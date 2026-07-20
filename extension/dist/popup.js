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

function findExactEmployeeMatch(list, name, cpf) {
  const normalizedCpf = normalizeCpf(cpf);
  const normalizedName = String(name || "")
    .trim()
    .toLowerCase();
  return (
    list.find((emp) => normalizeCpf(emp.cpf) === normalizedCpf) ||
    list.find((emp) => emp.name?.trim().toLowerCase() === normalizedName) ||
    list.find((emp) => emp.name?.trim().toLowerCase().includes(normalizedName))
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
  setStatus("Capturando dados...", "");
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
  setStatus(`Funcionário automaticamente selecionado: ${employee.name}`, "success");
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
    row.className = "field-row";
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

document.getElementById("submit-btn").addEventListener("click", async () => {
  const employeeId = document.getElementById("employee").value;
  if (!employeeId) {
    setStatus("Selecione um funcionário", "error");
    return;
  }
  if (!extractedData?.serviceNumber?.value) {
    setStatus("Capture os dados da página primeiro", "error");
    return;
  }

  const payload = {
    employeeId,
    serviceNumber: String(extractedData.serviceNumber.value).trim(),
    serviceDate: extractedData.serviceDate.value,
    baseValue: Number(extractedData.baseValue.value) || 0,
    additionalValue: Number(extractedData.additionalValue.value) || 0,
    origin: "EXTENSION",
  };

  setStatus("Enviando...", "");

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
      showDuplicateDialog(payload);
      return;
    }

    if (!json.success) {
      setStatus(json.error?.message || "Erro ao enviar", "error");
      return;
    }

    setStatus("Serviço enviado com sucesso!", "success");
  } catch {
    setStatus("Erro de conexão", "error");
  }
});

function showDuplicateDialog(payload) {
  const confirmed = confirm(
    `Serviço ${duplicateService.serviceNumber} já existe para este funcionário.\n\nDeseja ATUALIZAR o serviço existente?\n\nClique OK para atualizar ou Cancelar para abortar.`,
  );
  if (confirmed && duplicateService) {
    updateExisting(payload);
  } else {
    setStatus("Envio cancelado", "");
  }
}

async function updateExisting(payload) {
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
      setStatus("Serviço atualizado com sucesso!", "success");
    } else {
      setStatus(json.error?.message || "Erro ao atualizar", "error");
    }
  } catch {
    setStatus("Erro de conexão", "error");
  }
}

function setStatus(msg, type) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = `status ${type}`;
}

init();
