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

async function searchEmployees(apiUrl, token, search) {
  if (!search || !apiUrl || !token) return [];
  try {
    const res = await fetch(
      `${apiUrl}/api/employees?search=${encodeURIComponent(search)}&status=ACTIVE&limit=20`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

async function getOrCreateEmployee(apiUrl, token, extracted) {
  const name = String(extracted.employeeName?.value || "").trim();
  const cpf = normalizeCpf(extracted.employeeCpf?.value);
  if (!name) return null;

  let employee = null;
  if (cpf.length === 11) {
    const byCpf = await searchEmployees(apiUrl, token, cpf);
    employee = findExactEmployeeMatch(byCpf, name, cpf);
    if (employee) return employee;
  }

  // A busca da API é por substring, então mandar o nome inteiro capturado
  // (ex: "PAULO CESAR DIAS") raramente casa com o nome cadastrado (ex:
  // "Paulo Dias"). Buscar pelo primeiro e pelo último nome separadamente
  // encontra o candidato certo mesmo com nomes do meio diferentes.
  const tokens = firstAndLastTokens(name);
  if (tokens) {
    const byFirstName = await searchEmployees(apiUrl, token, tokens.first);
    employee = findExactEmployeeMatch(byFirstName, name, cpf);
    if (employee) return employee;

    if (tokens.last !== tokens.first) {
      const byLastName = await searchEmployees(apiUrl, token, tokens.last);
      employee = findExactEmployeeMatch(byLastName, name, cpf);
      if (employee) return employee;
    }
  }

  const byName = await searchEmployees(apiUrl, token, name);
  employee = findExactEmployeeMatch(byName, name, cpf);
  if (employee) return employee;

  if (cpf.length < 11) return null;

  try {
    const res = await fetch(`${apiUrl}/api/employees`, {
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
    const json = await res.json();
    if (res.ok && json.success) return json.data;
    if (res.status === 409) {
      const retry = await searchEmployees(apiUrl, token, cpf);
      return findExactEmployeeMatch(retry, name, cpf);
    }
  } catch {
    return null;
  }

  return null;
}
