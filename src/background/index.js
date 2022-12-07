import ExpiryMap from "expiry-map";
import { v4 as uuidv4 } from "uuid";
import { fetchSSE } from "./fetch-sse.js";

const KEY_ACCESS_TOKEN = "accessToken";

let prompt = "Rewrite this for brevity, in outline form:";
chrome.storage.sync.get("prompt", function (items) {
  if (items && items.prompt) {
    prompt = items.prompt;
  }
});

const cache = new ExpiryMap(10 * 1000);

async function getAccessToken() {
  if (cache.get(KEY_ACCESS_TOKEN)) {
    return cache.get(KEY_ACCESS_TOKEN);
  }
  const resp = await fetch("https://chat.openai.com/api/auth/session")
    .then((r) => r.json())
    .catch(() => ({}));
  if (!resp.accessToken) {
    throw new Error("UNAUTHORIZED");
  }
  cache.set(KEY_ACCESS_TOKEN, resp.accessToken);
  return resp.accessToken;
}

async function getSummary(question, callback) {
  const accessToken = await getAccessToken();
  await fetchSSE("https://chat.openai.com/backend-api/conversation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: "next",
      messages: [
        {
          id: uuidv4(),
          role: "user",
          content: {
            content_type: "text",
            parts: [question],
          },
        },
      ],
      model: "text-davinci-002-render",
      parent_message_id: uuidv4(),
    }),
    onMessage(message) {
      console.debug("sse message", message);
      if (message === "[DONE]") {
        return;
      }
      const data = JSON.parse(message);
      const text = data.message?.content?.parts?.[0];
      if (text) {
        callback(text);
      }
    },
  });
}

let preventInstance = {};
function executeScripts(tab) {
  const tabId = tab.id;
  // return if we've already created the summary for this website
  if (preventInstance[tabId]) return;

  preventInstance[tabId] = true;
  setTimeout(() => delete preventInstance[tabId], 10000);

  // Add a badge to signify the extension is in use
  chrome.action.setBadgeBackgroundColor({ color: [242, 38, 19, 230] });
  chrome.action.setBadgeText({ text: "GPT" });

  chrome.scripting.executeScript({ target: { tabId }, files: ['content.bundle.js'] })

  setTimeout(function () {
    chrome.action.setBadgeText({ text: "" });
  }, 1000);
}

// Load on clicking the extension icon
chrome.action.onClicked.addListener(executeScripts);

// Listen for messages
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (request, sender, sendResponse) => {
    console.debug("received msg ", request.content);
    try {
      const gptQuestion = prompt + `\n\n${request.content}`;
      await getSummary(gptQuestion, (answer) => {
        port.postMessage({ answer });
      });
    } catch (err) {
      console.error(err);
      port.postMessage({ error: err.message });
      cache.delete(KEY_ACCESS_TOKEN);
    }
  });
});
