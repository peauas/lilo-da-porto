/**
 * Painel flutuante injetado automaticamente na página de detalhe do
 * serviço (Salesforce Experience Cloud, my.site.com), para não depender
 * de o usuário clicar no ícone da extensão.
 *
 * Detecção de navegação: o portal é uma SPA (troca de registro não
 * recarrega a página), então além de popstate/pushState/replaceState
 * também fazemos um polling leve como rede de segurança, já que não
 * sabemos ao certo qual mecanismo de roteamento o portal usa por baixo.
 */

const LILO_PANEL_HOST_ID = "lilo-da-porto-panel-host";
const LILO_DETAIL_URL_RE = /\/workorder\/[^/]+\/detail(?:[/?#]|$)/i;

const LILO_PANEL_CSS = `
  .panel {
    width: 320px;
    max-height: 80vh;
    overflow-y: auto;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 6px 24px rgba(15, 23, 42, 0.18), 0 1px 2px rgba(15, 23, 42, 0.08);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #0f172a;
    font-size: 13px;
    line-height: 1.4;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-bottom: 1px solid #e5e7eb;
    font-weight: 600;
    cursor: move;
    touch-action: none;
    user-select: none;
  }
  .header img { height: 22px; width: auto; display: block; }
  .header span { flex: 1; }
  .close {
    background: none;
    border: none;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    color: #64748b;
    padding: 2px 6px;
  }
  .close:hover { color: #0f172a; }
  .body { padding: 14px; }
  .fields {
    border: 1px solid #eef1f4;
    border-radius: 8px;
    padding: 2px 10px;
    margin-bottom: 12px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 7px 0;
    border-bottom: 1px solid #eef1f4;
  }
  .row:last-child { border-bottom: none; }
  .row span:first-child { color: #64748b; }
  .row span:last-child { font-weight: 600; text-align: right; }
  .row.total span:last-child { color: #0b2d6b; font-size: 14px; }
  .low { color: #d97706 !important; font-weight: 600; }
  label { display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; }
  select {
    width: 100%;
    padding: 8px 10px;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 8px;
    font-family: inherit;
    color: #0f172a;
    background: #fafbfc;
    box-sizing: border-box;
  }
  .hint {
    font-size: 12px;
    color: #059669;
    background: #ecfdf5;
    border: 1px solid rgba(5, 150, 105, 0.2);
    border-radius: 8px;
    padding: 6px 10px;
    margin-bottom: 8px;
  }
  .hint.hidden { display: none; }
  .btn {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    box-sizing: border-box;
  }
  .btn.primary { background: #00aaf6; color: white; }
  .btn.primary:hover { background: #0089cb; }
  .status { margin-top: 8px; font-size: 12px; text-align: center; color: #64748b; }
  .status.error { color: #dc2626; }
  .status.success { color: #059669; font-weight: 600; }
  .status.loading { color: #64748b; }
  .spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #e5e7eb;
    border-top-color: #00aaf6;
    border-radius: 50%;
    margin-right: 6px;
    animation: lilo-spin 0.7s linear infinite;
    vertical-align: middle;
  }
  @keyframes lilo-spin { to { transform: rotate(360deg); } }
`;

let liloHostEl = null;
let liloShadowRoot = null;
let liloToken = null;
let liloApiUrl = null;
let liloEmployees = [];
let liloExtracted = null;
let liloDuplicate = null;
const liloDismissedUrls = new Set();
let liloLastUrl = location.href;

function liloIsDetailPage() {
  return LILO_DETAIL_URL_RE.test(location.pathname);
}

async function liloGetAuth() {
  const stored = await chrome.storage.local.get(["token", "apiUrl"]);
  return {
    token: stored.token || null,
    apiUrl: stored.apiUrl || LILO_CONFIG.PRODUCTION_API_URL,
  };
}

function liloEnsureHost() {
  if (liloHostEl) return;
  liloHostEl = document.createElement("div");
  liloHostEl.id = LILO_PANEL_HOST_ID;
  // "popover" promove o elemento para o "top layer" do navegador — uma
  // camada acima de toda a página, imune a z-index/stacking context de
  // terceiros (o portal tem componentes com stacking próprio que
  // ficavam na frente do painel quando ele só usava z-index alto).
  // "manual" evita o fechamento automático ao clicar fora (light-dismiss).
  liloHostEl.setAttribute("popover", "manual");
  // Abre no topo (não embaixo) pra não cobrir botões de ação que o
  // portal costuma colocar no rodapé da página (ex: "Enviar Serviço").
  liloHostEl.style.cssText =
    "all: initial; position: fixed; inset: 20px 20px auto auto; margin: 0; padding: 0; border: none; background: transparent;";
  document.documentElement.appendChild(liloHostEl);
  liloShadowRoot = liloHostEl.attachShadow({ mode: "open" });
  liloShadowRoot.innerHTML = `
    <style>${LILO_PANEL_CSS}</style>
    <div class="panel">
      <div class="header">
        <img src="${chrome.runtime.getURL("icons/logo.png")}" alt="Lilo da Porto" />
        <span></span>
        <button type="button" class="close" aria-label="Fechar">×</button>
      </div>
      <div class="body"></div>
    </div>
  `;
  liloShadowRoot.querySelector(".close").addEventListener("click", liloDismissPanel);
  liloMakeDraggable(liloHostEl, liloShadowRoot.querySelector(".header"));
  if (typeof liloHostEl.showPopover === "function") {
    try {
      liloHostEl.showPopover();
    } catch (err) {
      console.warn("[Lilo da Porto] showPopover falhou:", err);
    }
  }
}

// Deixa o usuário arrastar o painel pelo cabeçalho, caso a posição
// padrão fique sobre algo importante da página.
function liloMakeDraggable(hostEl, handleEl) {
  if (!handleEl) return;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startTop = 0;
  let startLeft = 0;

  handleEl.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".close")) return;
    const rect = hostEl.getBoundingClientRect();
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startTop = rect.top;
    startLeft = rect.left;
    hostEl.style.top = `${startTop}px`;
    hostEl.style.left = `${startLeft}px`;
    hostEl.style.right = "auto";
    hostEl.style.bottom = "auto";
    handleEl.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  handleEl.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const maxTop = window.innerHeight - 40;
    const maxLeft = window.innerWidth - 40;
    const newTop = Math.min(Math.max(0, startTop + (event.clientY - startY)), maxTop);
    const newLeft = Math.min(Math.max(0, startLeft + (event.clientX - startX)), maxLeft);
    hostEl.style.top = `${newTop}px`;
    hostEl.style.left = `${newLeft}px`;
  });

  function stopDragging(event) {
    if (!dragging) return;
    dragging = false;
    try {
      handleEl.releasePointerCapture(event.pointerId);
    } catch {
      // ponteiro já solto — ignora.
    }
  }

  handleEl.addEventListener("pointerup", stopDragging);
  handleEl.addEventListener("pointercancel", stopDragging);
}

function liloRemoveHost() {
  liloStopWatchingForChanges();
  if (liloHostEl) {
    if (typeof liloHostEl.hidePopover === "function") {
      try {
        liloHostEl.hidePopover();
      } catch {
        // já estava escondido/fechado — ignora.
      }
    }
    liloHostEl.remove();
    liloHostEl = null;
    liloShadowRoot = null;
  }
}

// O prestador pode adicionar custo complementar (ex: KM excedente,
// alteração de endereço) a qualquer momento, na mesma página, sem
// trocar de URL — a detecção de navegação (pushState/polling) não pega
// isso. Observa mudanças no DOM e recaptura os valores quando param de
// mudar por um instante, sem mexer na seleção de funcionário já feita.
let liloMutationObserver = null;
let liloMutationDebounceTimer = null;
const LILO_MUTATION_DEBOUNCE_MS = 1200;

function liloStartWatchingForChanges() {
  liloStopWatchingForChanges();
  liloMutationObserver = new MutationObserver(() => {
    clearTimeout(liloMutationDebounceTimer);
    liloMutationDebounceTimer = setTimeout(liloRecaptureIfChanged, LILO_MUTATION_DEBOUNCE_MS);
  });
  liloMutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

function liloStopWatchingForChanges() {
  liloMutationObserver?.disconnect();
  liloMutationObserver = null;
  clearTimeout(liloMutationDebounceTimer);
}

async function liloRecaptureIfChanged() {
  // Só atualiza se o painel já estiver com dados capturados exibidos —
  // não interfere nos estados de carregamento/login/erro.
  if (!liloHostEl || !liloExtracted || !liloIsDetailPage()) return;

  let fresh;
  try {
    fresh = extractAll();
  } catch {
    return;
  }
  if (!fresh?.serviceNumber?.value) return;

  const valuesChanged =
    fresh.totalValue.value !== liloExtracted.totalValue.value ||
    fresh.additionalValue.value !== liloExtracted.additionalValue.value ||
    fresh.baseValue.value !== liloExtracted.baseValue.value;
  if (!valuesChanged) return;

  liloExtracted = fresh;
  const fieldsEl = liloBodyEl()?.querySelector(".fields");
  if (fieldsEl) fieldsEl.innerHTML = liloFieldRowsHtml(liloExtracted);
}

function liloDismissPanel() {
  liloDismissedUrls.add(location.href);
  liloRemoveHost();
}

function liloBodyEl() {
  return liloShadowRoot?.querySelector(".body");
}

function liloRenderLoggedOut() {
  const body = liloBodyEl();
  if (!body) return;
  body.innerHTML = `<p class="hint" style="color:#64748b;background:#f1f5f9;border-color:#e2e8f0;">Faça login na extensão (clique no ícone ao lado da barra de endereço) para habilitar a captura automática.</p>`;
}

function liloRenderLoading(message) {
  const body = liloBodyEl();
  if (!body) return;
  body.innerHTML = `<p class="status loading"><span class="spinner"></span>${message}</p>`;
}

function liloRenderError(message, showRetry) {
  const body = liloBodyEl();
  if (!body) return;
  body.innerHTML = `
    <p class="status error">${message}</p>
    ${showRetry ? '<button type="button" class="btn primary retry">Tentar novamente</button>' : ""}
  `;
  if (showRetry) {
    body.querySelector(".retry")?.addEventListener("click", liloRunCapture);
  }
}

function liloFieldRowsHtml(data) {
  return Object.entries(data)
    .filter(([key]) => key !== "qru" && key !== "_meta")
    .filter(
      ([key, field]) =>
        field?.value || ["baseValue", "additionalValue", "totalValue"].includes(key),
    )
    .map(([key, field]) => {
      const label = FIELD_LABELS[key] || key;
      const lowConf = field.confidence < 0.6;
      const value = formatFieldValue(key, field.value);
      return `<div class="row${key === "totalValue" ? " total" : ""}"><span>${label}</span><span class="${lowConf ? "low" : ""}">${value}${lowConf ? " ⚠" : ""}</span></div>`;
    })
    .join("");
}

function liloRenderCaptured() {
  const body = liloBodyEl();
  if (!body) return;
  const options = liloEmployees.map((e) => `<option value="${e.id}">${e.name}</option>`).join("");
  body.innerHTML = `
    <div class="fields">${liloFieldRowsHtml(liloExtracted)}</div>
    <label>Funcionário</label>
    <select class="employee"><option value="">Selecione...</option>${options}</select>
    <p class="hint employee-hint hidden"></p>
    <button type="button" class="btn primary submit">Enviar serviço</button>
    <p class="status"></p>
  `;
  body.querySelector(".submit").addEventListener("click", liloSubmitService);
  body.querySelector(".employee").addEventListener("change", () => {
    body.querySelector(".employee-hint")?.classList.add("hidden");
  });
}

function liloSetStatus(message, type) {
  const el = liloBodyEl()?.querySelector(".status");
  if (!el) return;
  el.className = `status ${type || ""}`;
  el.textContent = message;
}

// O portal (Salesforce Lightning) ainda busca e renderiza os dados do
// registro via chamadas assíncronas depois que a página já está
// "pronta" — capturar de primeira costuma vir vazio. Em vez de desistir
// na primeira tentativa, insiste por alguns segundos.
const LILO_CAPTURE_RETRY_INTERVAL_MS = 800;
const LILO_CAPTURE_MAX_ATTEMPTS = 15; // ~12s de tentativas no total

let liloCaptureGeneration = 0;

function liloSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function liloWaitForExtraction(myGeneration) {
  let data = null;
  for (let attempt = 0; attempt < LILO_CAPTURE_MAX_ATTEMPTS; attempt++) {
    if (myGeneration !== liloCaptureGeneration) return null;
    try {
      data = extractAll();
    } catch {
      data = null;
    }
    if (data?.serviceNumber?.value && data?.employeeName?.value) return data;
    await liloSleep(LILO_CAPTURE_RETRY_INTERVAL_MS);
  }
  return data?.serviceNumber?.value ? data : null;
}

async function liloRunCapture() {
  const myGeneration = ++liloCaptureGeneration;

  const { token, apiUrl } = await liloGetAuth();
  liloToken = token;
  liloApiUrl = apiUrl;

  if (!token) {
    liloRenderLoggedOut();
    return;
  }

  liloRenderLoading("Capturando dados da página...");

  const data = await liloWaitForExtraction(myGeneration);
  if (myGeneration !== liloCaptureGeneration) return; // usuário já navegou para outra página

  if (!data) {
    liloRenderError(
      "Não encontrei os dados do serviço nesta página. A página pode ainda estar carregando.",
      true,
    );
    return;
  }
  liloExtracted = data;

  try {
    const response = await apiFetchViaBackground(`${apiUrl}/api/employees?status=ACTIVE&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    liloEmployees = response?.ok && response.body?.success ? (response.body.data ?? []) : [];
  } catch {
    liloEmployees = [];
  }

  if (myGeneration !== liloCaptureGeneration) return; // usuário já navegou para outra página

  liloRenderCaptured();
  liloStartWatchingForChanges();

  // Deixa claro que a busca ainda está em andamento — em rede real (não
  // localhost) pode levar um instante, e sem esse aviso parece que a
  // extensão simplesmente não achou o funcionário.
  const loadingHint = liloBodyEl()?.querySelector(".employee-hint");
  if (loadingHint) {
    loadingHint.textContent = "Detectando funcionário automaticamente...";
    loadingHint.style.color = "";
    loadingHint.style.background = "";
    loadingHint.style.borderColor = "";
    loadingHint.classList.remove("hidden");
  }

  const employee = await getOrCreateEmployee(apiUrl, token, data);
  if (myGeneration !== liloCaptureGeneration) return; // usuário já navegou para outra página
  if (employee) {
    if (!liloEmployees.some((e) => e.id === employee.id)) {
      liloEmployees.unshift(employee);
      liloRenderCaptured();
    }
    const body = liloBodyEl();
    const select = body?.querySelector(".employee");
    if (select) select.value = employee.id;
    const hint = body?.querySelector(".employee-hint");
    if (hint) {
      hint.textContent = `Detectado automaticamente: ${employee.name}`;
      hint.classList.remove("hidden");
    }
  } else {
    await liloWarnIfAmbiguousName(apiUrl, token, data);
  }
}

// Sem CPF capturado, um nome duplicado (duas pessoas diferentes com o
// mesmo nome cadastradas) é ambíguo demais pra selecionar sozinho —
// arriscaria atribuir o serviço à pessoa errada. Avisa o motivo em vez
// de só deixar "Selecione..." sem explicação. Também cobre o caso mais
// comum de simplesmente não achar ninguém (funcionário novo, nome não
// bate) — a dica de "detectando..." não pode ficar travada.
async function liloWarnIfAmbiguousName(apiUrl, token, data) {
  const hint = liloBodyEl()?.querySelector(".employee-hint");
  const name = String(data.employeeName?.value || "").trim();
  if (!name) {
    hint?.classList.add("hidden");
    return;
  }

  const matches = await searchEmployees(apiUrl, token, name);
  const normalizedName = name.toLowerCase();
  const exactMatches = matches.filter((e) => (e.name || "").trim().toLowerCase() === normalizedName);
  if (exactMatches.length < 2) {
    hint?.classList.add("hidden");
    return;
  }

  if (!hint) return;
  hint.textContent = `${exactMatches.length} funcionários cadastrados com o nome "${name}" — não capturei o CPF desta página pra saber qual é. Selecione manualmente.`;
  hint.style.color = "#d97706";
  hint.style.background = "#fffbeb";
  hint.style.borderColor = "rgba(217, 119, 6, 0.2)";
  hint.classList.remove("hidden");
}

async function liloSubmitService() {
  const body = liloBodyEl();
  const select = body?.querySelector(".employee");
  const employeeId = select?.value;
  if (!employeeId) {
    liloSetStatus("Selecione um funcionário", "error");
    return;
  }
  if (!liloExtracted?.serviceNumber?.value) {
    liloSetStatus("Capture os dados primeiro", "error");
    return;
  }

  const employeeName = select.selectedOptions[0]?.textContent || "";
  const payload = {
    employeeId,
    serviceNumber: String(liloExtracted.serviceNumber.value).trim(),
    serviceDate: liloExtracted.serviceDate.value,
    baseValue: Number(liloExtracted.baseValue.value) || 0,
    additionalValue: Number(liloExtracted.additionalValue.value) || 0,
    origin: "EXTENSION",
  };

  liloSetStatus("Enviando...", "loading");

  try {
    const response = await apiFetchViaBackground(`${liloApiUrl}/api/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${liloToken}` },
      body: JSON.stringify(payload),
    });

    if (response?.status === 409) {
      liloDuplicate = response.body?.error?.details;
      const confirmed = confirm(
        `Serviço ${liloDuplicate?.serviceNumber} já existe para este funcionário.\n\nDeseja ATUALIZAR o serviço existente?\n\nClique OK para atualizar ou Cancelar para abortar.`,
      );
      if (confirmed) {
        await liloUpdateService(payload, employeeName);
      } else {
        liloSetStatus("Envio cancelado", "");
      }
      return;
    }

    if (!response?.body?.success) {
      liloSetStatus(response?.body?.error?.message || "Erro ao enviar", "error");
      return;
    }

    liloOnSubmitSuccess(payload.serviceNumber, employeeName, false);
  } catch {
    liloSetStatus("Erro de conexão", "error");
  }
}

async function liloUpdateService(payload, employeeName) {
  try {
    const response = await apiFetchViaBackground(`${liloApiUrl}/api/services/${liloDuplicate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${liloToken}` },
      body: JSON.stringify(payload),
    });
    if (response?.body?.success) {
      liloOnSubmitSuccess(payload.serviceNumber, employeeName, true);
    } else {
      liloSetStatus(response?.body?.error?.message || "Erro ao atualizar", "error");
    }
  } catch {
    liloSetStatus("Erro de conexão", "error");
  }
}

function liloOnSubmitSuccess(serviceNumber, employeeName, updated) {
  liloSetStatus(
    `Serviço ${serviceNumber} ${updated ? "atualizado" : "enviado"} para ${employeeName}!`,
    "success",
  );
  liloDismissedUrls.add(location.href);
  setTimeout(liloRemoveHost, 2500);
}

async function liloOnUrlChange() {
  if (!liloIsDetailPage()) {
    liloRemoveHost();
    return;
  }
  if (liloDismissedUrls.has(location.href)) return;
  liloEnsureHost();
  await liloRunCapture();
}

function liloHandleNavigationChange() {
  if (location.href === liloLastUrl) return;
  liloLastUrl = location.href;
  liloOnUrlChange();
}

const liloOrigPushState = history.pushState;
history.pushState = function (...args) {
  liloOrigPushState.apply(this, args);
  liloHandleNavigationChange();
};
const liloOrigReplaceState = history.replaceState;
history.replaceState = function (...args) {
  liloOrigReplaceState.apply(this, args);
  liloHandleNavigationChange();
};
window.addEventListener("popstate", liloHandleNavigationChange);
// Rede de segurança: se o portal navegar sem passar por pushState/
// replaceState (ex: algum roteador interno do Lightning), o polling
// ainda pega a troca de URL.
setInterval(liloHandleNavigationChange, 800);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.token && liloHostEl) {
    liloOnUrlChange();
  }
});

liloOnUrlChange();
