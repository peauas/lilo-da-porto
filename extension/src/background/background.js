const CONTENT_SCRIPT_FILE = "content.js";

function sendExtract(tabId, sendResponse) {
  chrome.tabs.sendMessage(tabId, { type: "EXTRACT" }, (response) => {
    if (chrome.runtime.lastError) {
      sendResponse({
        success: false,
        error:
          "Não foi possível ler a página. Recarregue a aba do portal Porto e tente novamente.",
        details: chrome.runtime.lastError.message,
      });
      return;
    }
    sendResponse(response);
  });
}

function injectAndExtract(tabId, sendResponse) {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      files: [CONTENT_SCRIPT_FILE],
    },
    () => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: "Abra uma ordem de serviço no portal Porto Seguro (portosocorro.my.site.com)",
          details: chrome.runtime.lastError.message,
        });
        return;
      }
      setTimeout(() => sendExtract(tabId, sendResponse), 300);
    },
  );
}

// Content scripts (o painel injetado na página do serviço) executam
// fetch() com a origem da própria página do portal para fins de CORS —
// não com a permissão da extensão. Isso bloqueia silenciosamente
// chamadas para a nossa API, que não libera CORS para esse domínio.
// O background tem host_permissions e não sofre essa restrição, então
// atua como retransmissor das chamadas de rede do painel.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "API_FETCH") return;

  (async () => {
    try {
      const res = await fetch(message.url, message.options);
      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      sendResponse({ ok: res.ok, status: res.status, body });
    } catch (err) {
      sendResponse({ ok: false, status: 0, error: String(err) });
    }
  })();

  return true;
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "GET_TAB_DATA") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      sendResponse({
        success: false,
        error: "Não foi possível acessar a aba ativa",
        details: chrome.runtime.lastError.message,
      });
      return;
    }

    const tab = tabs?.[0];
    if (!tab?.id) {
      sendResponse({ success: false, error: "Nenhuma aba ativa" });
      return;
    }

    const url = tab.url ?? "";
    const isSupported =
      url.includes("my.site.com") ||
      url.includes("portoseguro") ||
      url.includes(".porto/");

    if (!isSupported) {
      sendResponse({
        success: false,
        error: "Abra o portal Porto (portosocorro.my.site.com) em uma ordem de serviço",
        details: `URL atual: ${url}`,
      });
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: "PING" }, (ping) => {
      if (chrome.runtime.lastError || !ping?.ready) {
        injectAndExtract(tab.id, sendResponse);
        return;
      }
      sendExtract(tab.id, sendResponse);
    });
  });

  return true;
});
