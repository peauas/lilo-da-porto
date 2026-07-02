chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TAB_DATA") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        sendResponse({ success: false, error: "Nenhuma aba ativa" });
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: "EXTRACT" }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: "Abra um serviço no portal Porto Seguro" });
          return;
        }
        sendResponse(response);
      });
    });
    return true;
  }
});
