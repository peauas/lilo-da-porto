/**
 * Motor de extração resiliente — não depende de seletores fixos.
 * Tenta múltiplas estratégias por campo com score de confiança.
 */

const FIELD_KEYWORDS = {
  qru: ["qru", "qr u", "código qru", "codigo qru"],
  serviceNumber: ["nº serviço", "numero servico", "n° serviço", "serviço n", "os ", "ordem de serviço"],
  baseValue: ["valor base", "valor serviço", "valor do serviço", "valor principal"],
  additionalValue: ["adicional", "valor adicional", "extra"],
  totalValue: ["valor total", "total geral", "total"],
  serviceDate: ["data", "data serviço", "data do serviço", "dt."],
  notes: ["observação", "observacao", "obs", "descrição"],
};

const REGEX = {
  qru: /\b(QRU[\s\-]?[A-Z0-9]{4,20}|[A-Z0-9]{8,20})\b/i,
  serviceNumber: /\b(\d{5,12})\b/,
  money: /R\$\s*([\d.,]+)|(\d{1,3}(?:\.\d{3})*,\d{2})/g,
  date: /\b(\d{2}\/\d{2}\/\d{4})\b/,
};

function getVisibleText() {
  return document.body?.innerText ?? "";
}

function getPageHtml() {
  return document.body?.innerHTML ?? "";
}

function findByLabel(keywords) {
  const elements = document.querySelectorAll("label, th, td, span, div, p, strong, b");
  for (const el of elements) {
    const text = (el.textContent ?? "").toLowerCase().trim();
    if (keywords.some((k) => text.includes(k))) {
      const sibling = el.nextElementSibling ?? el.parentElement?.querySelector("span, input, td + td");
      const value = sibling?.textContent?.trim() || (sibling instanceof HTMLInputElement ? sibling.value : "");
      if (value && value.length < 200) return value;
    }
  }
  return null;
}

function findByRegex(pattern, text) {
  const match = text.match(pattern);
  return match ? (match[1] ?? match[0]).trim() : null;
}

function parseMoney(value) {
  if (!value) return null;
  const cleaned = value.replace(/R\$\s*/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(value) {
  if (!value) return null;
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function extractField(field, keywords, regex) {
  let value = null;
  let confidence = 0;

  const labelValue = findByLabel(keywords);
  if (labelValue) {
    value = labelValue;
    confidence = 0.9;
  }

  if (!value) {
    const text = getVisibleText();
    const regexMatch = findByRegex(regex, text);
    if (regexMatch) {
      value = regexMatch;
      confidence = 0.7;
    }
  }

  if (!value) {
    const html = getPageHtml();
    const regexMatch = findByRegex(regex, html);
    if (regexMatch) {
      value = regexMatch;
      confidence = 0.5;
    }
  }

  return { value, confidence };
}

function extractAll() {
  const qru = extractField("qru", FIELD_KEYWORDS.qru, REGEX.qru);
  const serviceNumber = extractField("serviceNumber", FIELD_KEYWORDS.serviceNumber, REGEX.serviceNumber);
  const dateRaw = extractField("serviceDate", FIELD_KEYWORDS.serviceDate, REGEX.date);
  const notes = extractField("notes", FIELD_KEYWORDS.notes, /.{5,200}/);

  const text = getVisibleText();
  const moneyMatches = [...text.matchAll(/R\$\s*([\d.,]+)/g)].map((m) => parseMoney(m[0])).filter(Boolean);

  let baseValue = null;
  let additionalValue = 0;
  let totalValue = null;

  const baseLabel = findByLabel(FIELD_KEYWORDS.baseValue);
  const addLabel = findByLabel(FIELD_KEYWORDS.additionalValue);
  const totalLabel = findByLabel(FIELD_KEYWORDS.totalValue);

  if (baseLabel) baseValue = parseMoney(baseLabel);
  if (addLabel) additionalValue = parseMoney(addLabel) ?? 0;
  if (totalLabel) totalValue = parseMoney(totalLabel);

  if (!baseValue && moneyMatches.length > 0) baseValue = moneyMatches[0];
  if (!totalValue && moneyMatches.length > 1) totalValue = moneyMatches[moneyMatches.length - 1];
  if (!totalValue && baseValue) totalValue = baseValue + (additionalValue ?? 0);

  const serviceDate = parseDate(dateRaw.value) ?? new Date().toISOString().split("T")[0];

  return {
    serviceNumber: { value: serviceNumber.value ?? "", confidence: serviceNumber.confidence },
    qru: { value: qru.value ?? "", confidence: qru.confidence },
    baseValue: { value: baseValue ?? 0, confidence: baseValue ? 0.8 : 0.3 },
    additionalValue: { value: additionalValue ?? 0, confidence: 0.7 },
    totalValue: { value: totalValue ?? 0, confidence: totalValue ? 0.8 : 0.3 },
    serviceDate: { value: serviceDate, confidence: dateRaw.confidence || 0.6 },
    notes: { value: notes.value ?? "", confidence: notes.confidence },
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
  return true;
});

// Notify popup that page is ready
chrome.runtime.sendMessage({ type: "PAGE_READY" }).catch(() => {});
