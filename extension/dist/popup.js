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
    .replace(/[\u0300-\u036f]/g, "");
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

async function searchEmployees(search) {
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

async function getOrCreateEmployee(extracted) {
  const name = String(extracted.employeeName?.value || "").trim();
  const cpf = normalizeCpf(extracted.employeeCpf?.value);
  if (!name) return null;

  let employee = null;
  if (cpf.length === 11) {
    const byCpf = await searchEmployees(cpf);
    employee = findExactEmployeeMatch(byCpf, name, cpf);
    if (employee) return employee;
  }

  // A busca da API é por substring, então mandar o nome inteiro capturado
  // (ex: "PAULO CESAR DIAS") raramente casa com o nome cadastrado (ex:
  // "Paulo Dias"). Buscar pelo primeiro e pelo último nome separadamente
  // encontra o candidato certo mesmo com nomes do meio diferentes.
  const tokens = firstAndLastTokens(name);
  if (tokens) {
    const byFirstName = await searchEmployees(tokens.first);
    employee = findExactEmployeeMatch(byFirstName, name, cpf);
    if (employee) return employee;

    if (tokens.last !== tokens.first) {
      const byLastName = await searchEmployees(tokens.last);
      employee = findExactEmployeeMatch(byLastName, name, cpf);
      if (employee) return employee;
    }
  }

  const byName = await searchEmployees(name);
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
      const retry = await searchEmployees(cpf);
      return findExactEmployeeMatch(retry, name, cpf);
    }
  } catch {
    return null;
  }

  return null;
}

async function captureFromPage() {
  hideEmployeeHint();
  setStatus("Capturando dados...", "loading");
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_TAB_DATA" }, async (response) => {
      if (chrome.runtime.lastError) {
        setStatus(`${chrome.runtime.lastError.message || "Erro na captura"}`, "error");
        return resolve(false);
      }
      if (!response?.success) {
        const detail = response?.details ? `: ${response.details}` : "";
        setStatus(
          response?.error ? `${response.error}${detail}` : `Erro na captura${detail}`,
          "error",
        );
        return resolve(false);
      }
      extractedData = response.data;
      renderFields(extractedData);
      setStatus("Dados capturados. Revise antes de enviar.", "success");
      await autoSelectEmployee();
      resolve(true);
    });
  });
}

function hideEmployeeHint() {
  document.getElementById("employee-hint").classList.add("hidden");
}

function showEmployeeHint(name) {
  const hint = document.getElementById("employee-hint");
  hint.textContent = `Detectado automaticamente: ${name}`;
  hint.classList.remove("hidden");
}

async function autoSelectEmployee() {
  if (!extractedData) return;
  const employee = await getOrCreateEmployee(extractedData);
  if (!employee) return;
  if (!employees.some((e) => e.id === employee.id)) {
    employees.unshift(employee);
  }
  const select = document.getElementById("employee");
  select.innerHTML = '<option value="">Selecione...</option>';
  employees.forEach((e) => {
    const opt = document.createElement("option");
    opt.value = e.id;
    opt.textContent = e.name;
    select.appendChild(opt);
  });
  select.value = employee.id;
  showEmployeeHint(employee.name);
}

let token = null;
let apiUrl = null;
let employees = [];
let extractedData = null;
let duplicateService = null;

async function init() {
  const stored = await chrome.storage.local.get(["token", "apiUrl", "email"]);
  token = stored.token;
  apiUrl = stored.apiUrl || "http://localhost:3000";

  document.getElementById("api-url").value = apiUrl;
  if (stored.email) document.getElementById("email").value = stored.email;

  if (token) {
    await showMain();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
  document.getElementById("main-section").classList.add("hidden");
}

async function showMain() {
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("main-section").classList.remove("hidden");
  await loadEmployees();
  await captureFromPage();
}

document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  apiUrl = document.getElementById("api-url").value.replace(/\/$/, "");
  const errorEl = document.getElementById("login-error");

  try {
    const res = await fetch(`${apiUrl}/api/auth/extension-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!json.success) {
      errorEl.textContent = json.error?.message || "Erro no login";
      errorEl.classList.remove("hidden");
      return;
    }
    token = json.data.token;
    await chrome.storage.local.set({ token, apiUrl, email });
    errorEl.classList.add("hidden");
    await showMain();
  } catch {
    errorEl.textContent = "Não foi possível conectar à API";
    errorEl.classList.remove("hidden");
  }
});

async function loadEmployees() {
  const res = await fetch(`${apiUrl}/api/employees?status=ACTIVE&limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  employees = json.data ?? [];
  const select = document.getElementById("employee");
  select.innerHTML = '<option value="">Selecione...</option>';
  employees.forEach((e) => {
    const opt = document.createElement("option");
    opt.value = e.id;
    opt.textContent = e.name;
    select.appendChild(opt);
  });
}

function renderFields(data) {
  const container = document.getElementById("fields");
  container.innerHTML = "";
  if (!data) {
    container.innerHTML = "<p>Nenhum dado capturado. Clique em Capturar.</p>";
    return;
  }
  for (const [key, field] of Object.entries(data)) {
    if (key === "qru") continue;
    if (!field?.value && key !== "baseValue" && key !== "additionalValue" && key !== "totalValue")
      continue;
    const row = document.createElement("div");
    row.className = key === "totalValue" ? "field-row field-row-total" : "field-row";
    const label = FIELD_LABELS[key] || key;
    const lowConf = field.confidence < 0.6;
    const formattedValue = formatFieldValue(key, field.value);
    row.innerHTML = `
      <span>${label}</span>
      <span class="${lowConf ? "low-confidence" : ""}">${formattedValue}${lowConf ? " ⚠" : ""}</span>
    `;
    container.appendChild(row);
  }
}

document.getElementById("capture-btn").addEventListener("click", captureFromPage);
document.getElementById("employee").addEventListener("change", hideEmployeeHint);

function resetForm() {
  extractedData = null;
  duplicateService = null;
  renderFields(null);
  hideEmployeeHint();
  document.getElementById("employee").value = "";
}

function setSuccessAndReset(message) {
  resetForm();
  setStatus(`${message} Pronto para capturar o próximo serviço.`, "success");
}

document.getElementById("submit-btn").addEventListener("click", async () => {
  const employeeSelect = document.getElementById("employee");
  const employeeId = employeeSelect.value;
  if (!employeeId) {
    setStatus("Selecione um funcionário", "error");
    return;
  }
  if (!extractedData?.serviceNumber?.value) {
    setStatus("Capture os dados da página primeiro", "error");
    return;
  }

  const employeeName = employeeSelect.selectedOptions[0]?.textContent || "";
  const payload = {
    employeeId,
    serviceNumber: String(extractedData.serviceNumber.value).trim(),
    serviceDate: extractedData.serviceDate.value,
    baseValue: Number(extractedData.baseValue.value) || 0,
    additionalValue: Number(extractedData.additionalValue.value) || 0,
    origin: "EXTENSION",
  };

  setStatus("Enviando...", "loading");

  try {
    const res = await fetch(`${apiUrl}/api/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (res.status === 409) {
      duplicateService = json.error.details;
      showDuplicateDialog(payload, employeeName);
      return;
    }

    if (!json.success) {
      setStatus(json.error?.message || "Erro ao enviar", "error");
      return;
    }

    setSuccessAndReset(`Serviço ${payload.serviceNumber} enviado para ${employeeName}!`);
  } catch {
    setStatus("Erro de conexão", "error");
  }
});

function showDuplicateDialog(payload, employeeName) {
  const confirmed = confirm(
    `Serviço ${duplicateService.serviceNumber} já existe para este funcionário.\n\nDeseja ATUALIZAR o serviço existente?\n\nClique OK para atualizar ou Cancelar para abortar.`,
  );
  if (confirmed && duplicateService) {
    updateExisting(payload, employeeName);
  } else {
    setStatus("Envio cancelado", "");
  }
}

async function updateExisting(payload, employeeName) {
  try {
    const res = await fetch(`${apiUrl}/api/services/${duplicateService.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      setSuccessAndReset(`Serviço ${payload.serviceNumber} atualizado para ${employeeName}!`);
    } else {
      setStatus(json.error?.message || "Erro ao atualizar", "error");
    }
  } catch {
    setStatus("Erro de conexão", "error");
  }
}

function setStatus(msg, type) {
  const el = document.getElementById("status");
  el.className = `status ${type}`;
  if (type === "loading") {
    el.innerHTML = `<span class="spinner spinner-inline" aria-hidden="true"></span>${msg}`;
  } else if (type === "success") {
    el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg><span>${msg}</span>`;
  } else {
    el.textContent = msg;
  }
}

init();
