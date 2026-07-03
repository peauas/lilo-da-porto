/**
 * Motor de extração — Portal Porto (Salesforce my.site.com) + fallbacks genéricos
 */

const FIELD_KEYWORDS = {
  qru: ["qru", "qra", "qr u", "qr a", "código qru", "codigo qru"],
  serviceNumber: [
    "ordem de serviço",
    "nº serviço",
    "numero servico",
    "n° serviço",
    "os ",
    "workorder",
  ],
  name: [
    "nome",
    "nome do cliente",
    "nome do segurado",
    "nome do titular",
    "nome do beneficiário",
    "nome do beneficiario",
  ],
  cpf: ["cpf", "c.p.f", "cadastro", "documento"],
  baseValue: ["valor base", "valor serviço", "valor do serviço", "custos da ordem"],
  additionalValue: ["adicional", "valor adicional", "extra"],
  totalValue: ["valor total", "total geral", "custos da ordem de serviço", "total"],
  serviceDate: [
    "data de abertura",
    "data abertura",
    "data do serviço",
    "data serviço",
    "data de acionamento",
    "data",
  ],
  notes: ["motivo", "observação", "observacao", "obs", "descrição"],
};

function getVisibleText() {
  return (document.body?.innerText ?? "").replace(/\r/g, "");
}

/** Label na linha N, valor na linha N+1 (padrão Salesforce Lightning) */
function findByMultilineLabel(text, keywords) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].toLowerCase();
    if (keywords.some((k) => line === k || line.startsWith(k + " ") || line.includes(k))) {
      const next = lines[i + 1];
      if (next && next.length < 300 && !keywords.some((k) => next.toLowerCase().includes(k))) {
        return next;
      }
    }
  }
  return null;
}

/** Busca em pares label/valor no DOM (Salesforce slds) */
function findBySalesforceForm(keywords) {
  const labels = document.querySelectorAll(
    ".slds-form-element__label, records-record-layout-item [slot='label'], " +
      "span.test-id__field-label, dt, th, label, .forceOutputLabel",
  );

  for (const labelEl of labels) {
    const labelText = (labelEl.textContent ?? "").toLowerCase().trim();
    if (!keywords.some((k) => labelText.includes(k))) continue;

    const container =
      labelEl.closest(".slds-form-element") ??
      labelEl.closest("records-record-layout-item") ??
      labelEl.parentElement;

    if (!container) continue;

    const valueEl = container.querySelector(
      ".slds-form-element__control lightning-formatted-text, " +
        ".slds-form-element__control lightning-formatted-number, " +
        ".slds-form-element__control lightning-formatted-date-time, " +
        ".slds-form-element__control span, " +
        "dd, .test-id__field-value, .forceOutputValue",
    );

    const value = valueEl?.textContent?.trim();
    if (!value || value.length >= 300) continue;
    const normalizedValue = value.toLowerCase();
    if (normalizedValue === labelText) continue;
    if (
      normalizedValue.includes(labelText) &&
      labelText.length > 6 &&
      normalizedValue.length <= labelText.length + 24
    )
      continue;
    return value;
  }
}

function findByLabel(keywords) {
  return findBySalesforceForm(keywords) ?? findByMultilineLabel(getVisibleText(), keywords);
}

function parseMoney(value) {
  if (!value) return null;
  const cleaned = String(value)
    .replace(/R\$\s*/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(value) {
  if (!value) return null;
  const br = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "");
}

function parseCpf(value) {
  if (!value) return null;
  const normalized = normalizeCpf(value);
  if (normalized.length === 11) return normalized;
  const formatted = String(value).match(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
  if (formatted) return normalizeCpf(formatted[0]);
  const bare = String(value).match(/\b(\d{11})\b/);
  return bare ? bare[1] : null;
}

function extractEmployeeName(text) {
  const labelVal = findByLabel(FIELD_KEYWORDS.name);
  if (labelVal) return { value: labelVal.trim(), confidence: 0.95 };
  const line = findByMultilineLabel(text, FIELD_KEYWORDS.name);
  if (line) return { value: line.trim(), confidence: 0.8 };
  return { value: "", confidence: 0 };
}

function extractEmployeeCpf(text) {
  const labelVal = findByLabel(FIELD_KEYWORDS.cpf);
  if (labelVal) {
    const parsed = parseCpf(labelVal);
    if (parsed) return { value: parsed, confidence: 0.95 };
  }
  const regex = text.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/) || text.match(/\b\d{11}\b/);
  if (regex) {
    return { value: normalizeCpf(regex[0]), confidence: 0.7 };
  }
  return { value: "", confidence: 0 };
}

function normalizeServiceNumber(rawValue, text) {
  const source = String(rawValue || "");
  const headerMatch = source.match(/Ordem de Servi[çc]o\s+(\d{2}\/\d{6,}-\d{2})/i);
  if (headerMatch) return headerMatch[1];

  const patternMatch = source.match(/\b(\d{2}\/\d{6,}-\d{2})\b/);
  if (patternMatch) return patternMatch[1];

  const digits = source.match(/\d{4,}/g)?.join("");
  if (digits) return digits;

  const textMatch = String(text || "").match(/\b(\d{2}\/\d{6,}-\d{2})\b/);
  if (textMatch) return textMatch[1];

  return "";
}

/** Número OS no título: "Ordem de Serviço 01/4339106-26" */
function extractServiceNumber(text) {
  const headerMatch = text.match(/Ordem de Servi[çc]o\s+(\d+\/\d+-\d+)/i);
  if (headerMatch) return { value: headerMatch[1], confidence: 0.95 };

  const patternMatch = text.match(/\b(\d{2}\/\d{6,}-\d{2})\b/);
  if (patternMatch) return { value: patternMatch[1], confidence: 0.85 };

  const labelVal = findByLabel(FIELD_KEYWORDS.serviceNumber);
  if (labelVal) {
    const normalized = normalizeServiceNumber(labelVal, text);
    if (normalized) return { value: normalized, confidence: 0.9 };
  }

  return { value: "", confidence: 0 };
}

/** QRA/QRU — extrai código numérico (ex: "119431 - NOME" → "119431") */
function extractQru(text) {
  const qraLine = findByLabel(FIELD_KEYWORDS.qru);
  if (qraLine) {
    const num = qraLine.match(/^(\d{4,12})/);
    if (num) return { value: num[1], confidence: 0.95 };
    return { value: qraLine.split("-")[0].trim(), confidence: 0.85 };
  }

  const qraBlock = text.match(/QRA\s*\n?\s*(\d{4,12})/i);
  if (qraBlock) return { value: qraBlock[1], confidence: 0.9 };

  const qruMatch = text.match(/\bQRU[\s\-]?(\d{4,12})/i);
  if (qruMatch) return { value: qruMatch[1], confidence: 0.85 };

  return { value: "", confidence: 0 };
}

function extractDate(text) {
  const abertura = findByMultilineLabel(text, ["data de abertura", "data abertura"]);
  if (abertura) {
    const d = parseDate(abertura);
    if (d) return { value: d, confidence: 0.95 };
  }

  const labelVal = findByLabel(FIELD_KEYWORDS.serviceDate);
  if (labelVal) {
    const d = parseDate(labelVal.split(" ")[0]);
    if (d) return { value: d, confidence: 0.9 };
  }

  const firstDate = text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
  if (firstDate) {
    const d = parseDate(firstDate[1]);
    if (d) return { value: d, confidence: 0.6 };
  }

  return {
    value: new Date().toISOString().split("T")[0],
    confidence: 0.3,
  };
}

function extractValues(text) {
  let baseValue = null;
  let additionalValue = 0;
  let totalValue = null;
  let confidence = 0.3;

  const custosLine = findByMultilineLabel(text, [
    "custos da ordem de serviço",
    "custos da ordem",
  ]);
  if (custosLine) {
    totalValue = parseMoney(custosLine);
    baseValue = totalValue;
    confidence = 0.95;
  }

  if (!totalValue) {
    const custosBlock = text.match(
      /Custos da Ordem de Servi[çc]o[\s\S]{0,80}?(R\$\s*[\d.,]+)/i,
    );
    if (custosBlock) {
      totalValue = parseMoney(custosBlock[1]);
      baseValue = totalValue;
      confidence = 0.9;
    }
  }

  if (!totalValue) {
    const moneyMatches = [...text.matchAll(/R\$\s*([\d.,]+)/g)]
      .map((m) => parseMoney(m[0]))
      .filter(Boolean);
    if (moneyMatches.length > 0) {
      totalValue = moneyMatches[moneyMatches.length - 1];
      baseValue = totalValue;
      confidence = 0.65;
    }
  }

  const addLabel = findByLabel(FIELD_KEYWORDS.additionalValue);
  if (addLabel) {
    additionalValue = parseMoney(addLabel) ?? 0;
    if (baseValue) totalValue = baseValue + additionalValue;
  }

  return {
    baseValue: { value: baseValue ?? 0, confidence: baseValue ? confidence : 0.2 },
    additionalValue: { value: additionalValue, confidence: 0.7 },
    totalValue: { value: totalValue ?? baseValue ?? 0, confidence: totalValue ? confidence : 0.2 },
  };
}

function extractAll() {
  const text = getVisibleText();
  const isPortoPortal =
    location.hostname.includes("my.site.com") ||
    location.hostname.includes("portoseguro") ||
    location.hostname.includes("porto");

  if (!isPortoPortal) {
    console.warn("[Lilo da Porto] Portal não reconhecido:", location.hostname);
  }

  const serviceNumber = extractServiceNumber(text);
  const qru = extractQru(text);
  const employeeName = extractEmployeeName(text);
  const employeeCpf = extractEmployeeCpf(text);
  const serviceDate = extractDate(text);
  const values = extractValues(text);

  return {
    serviceNumber,
    qru,
    employeeName,
    employeeCpf,
    ...values,
    serviceDate,
    _meta: {
      url: location.href,
      hostname: location.hostname,
      capturedAt: new Date().toISOString(),
    },
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "EXTRACT") {
    try {
      const data = extractAll();
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
  }
  if (message.type === "PING") {
    sendResponse({ success: true, ready: true, url: location.href });
  }
  return true;
});
