/**
 * Lógica compartilhada entre o popup e o painel flutuante injetado na
 * página do serviço: formatação de campos e busca/match de funcionário.
 * Carregado como content script e no popup antes do respectivo *.js.
 */

const FIELD_LABELS = {
  serviceNumber: "Nº Serviço",
  qru: "QRU",
  employeeName: "Nome do funcionário",
  employeeCpf: "CPF do funcionário",
  baseValue: "Valor base",
  additionalValue: "Adicional",
  totalValue: "Total",
  serviceDate: "Data",
};

function formatCurrency(value) {
  const number = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number || 0);
}

function formatDate(value) {
  if (!value) return "";
  // Datas no formato "YYYY-MM-DD" devem ser tratadas como data local,
  // senão new Date() interpreta como UTC e o fuso (UTC-3) retrocede um dia.
  if (typeof value === "string") {
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }
    return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
  }
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function formatFieldValue(key, value) {
  if (key === "baseValue" || key === "additionalValue" || key === "totalValue") {
    return formatCurrency(value);
  }
  if (key === "serviceDate") {
    return formatDate(value);
  }
  return value;
}

function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "");
}

/** Remove acentos para comparação tolerante (ex: "José" === "jose") */
function stripAccents(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
}

function nameTokens(name) {
  return stripAccents(String(name || "").toLowerCase())
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Ignora nomes do meio: "Paulo Cesar Dias" casa com "Paulo Dias" */
function namesMatchByFirstLast(nameA, nameB) {
  const a = nameTokens(nameA);
  const b = nameTokens(nameB);
  if (!a.length || !b.length) return false;
  return a[0] === b[0] && a[a.length - 1] === b[b.length - 1];
}

function firstAndLastTokens(name) {
  const tokens = nameTokens(name);
  if (!tokens.length) return null;
  return { first: tokens[0], last: tokens[tokens.length - 1] };
}

function findExactEmployeeMatch(list, name, cpf) {
  const normalizedCpf = normalizeCpf(cpf);
  const normalizedName = stripAccents(String(name || "").trim().toLowerCase());
  return (
    (normalizedCpf && list.find((emp) => normalizeCpf(emp.cpf) === normalizedCpf)) ||
    list.find((emp) => stripAccents(emp.name?.trim().toLowerCase() || "") === normalizedName) ||
    list.find((emp) => namesMatchByFirstLast(emp.name, name)) ||
    list.find((emp) => stripAccents(emp.name?.trim().toLowerCase() || "").includes(normalizedName))
  );
}

/**
 * Content scripts (o painel injetado na página do serviço) executam
 * fetch() com a origem da própria página visitada para fins de CORS —
 * não com a permissão da extensão (host_permissions só isenta
 * contextos privilegiados: popup e background). Isso bloqueia
 * silenciosamente chamadas para a nossa API a partir do painel. Por
 * isso essas chamadas passam pelo background, que retransmite o fetch
 * sem essa restrição. No popup (contexto já privilegiado) isso também
 * funciona normalmente, só com uma volta a mais de mensagem.
 */
function apiFetchViaBackground(url, options) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "API_FETCH", url, options }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function searchEmployees(apiUrl, token, search) {
  if (!search || !apiUrl || !token) return [];
  try {
    const response = await apiFetchViaBackground(
      `${apiUrl}/api/employees?search=${encodeURIComponent(search)}&status=ACTIVE&limit=20`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response?.ok && response.body?.success && Array.isArray(response.body.data)
      ? response.body.data
      : [];
  } catch {
    return [];
  }
}

async function getOrCreateEmployee(apiUrl, token, extracted) {
  const name = String(extracted.employeeName?.value || "").trim();
  const cpf = normalizeCpf(extracted.employeeCpf?.value);
  if (!name) return null;

  // A busca da API é por substring, então mandar o nome inteiro capturado
  // (ex: "PAULO CESAR DIAS") raramente casa com o nome cadastrado (ex:
  // "Paulo Dias"). Buscar pelo primeiro e pelo último nome separadamente
  // (além do nome completo e do CPF) encontra o candidato certo mesmo com
  // nomes do meio diferentes. As buscas rodam em paralelo — em sequência,
  // em rede real (não localhost), a soma das 3-4 chamadas podia levar
  // alguns segundos para o funcionário aparecer selecionado.
  const tokens = firstAndLastTokens(name);
  const searches = [searchEmployees(apiUrl, token, name)];
  if (cpf.length === 11) searches.push(searchEmployees(apiUrl, token, cpf));
  if (tokens) {
    searches.push(searchEmployees(apiUrl, token, tokens.first));
    if (tokens.last !== tokens.first) searches.push(searchEmployees(apiUrl, token, tokens.last));
  }

  const results = await Promise.all(searches);
  const seenIds = new Set();
  const combined = [];
  for (const list of results) {
    for (const emp of list) {
      if (!seenIds.has(emp.id)) {
        seenIds.add(emp.id);
        combined.push(emp);
      }
    }
  }

  const employee = findExactEmployeeMatch(combined, name, cpf);
  if (employee) return employee;

  if (cpf.length < 11) return null;

  try {
    const response = await apiFetchViaBackground(`${apiUrl}/api/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        cpf,
        defaultPercentage: 100,
        status: "ACTIVE",
      }),
    });
    if (response?.ok && response.body?.success) return response.body.data;
    if (response?.status === 409) {
      const retry = await searchEmployees(apiUrl, token, cpf);
      return findExactEmployeeMatch(retry, name, cpf);
    }
  } catch {
    return null;
  }

  return null;
}
