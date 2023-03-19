const defaultPrompt =
  "You are acting as a summarization AI, and for the input text please summarize it to the most important 3 to 5 bullet points for brevity: ";
const defaultAPIKey = "";

chrome.storage.sync.get("prompt", function (items) {
  if (items.prompt) {
    document.getElementById("prompt").value = items.prompt;
  } else {
    document.getElementById("prompt").value = defaultPrompt;
  }
});

chrome.storage.sync.get("apiKey", function (items) {
  if (items.apiKey) {
    document.getElementById("apiKey").value = items.apiKey;
  } else {
    document.getElementById("apiKey").value = defaultAPIKey;
  }
});

chrome.storage.sync.get(
  {
    prompt: defaultPrompt,
  },
  function (items) {
    document.getElementById("prompt").value = items.prompt;
  }
);

chrome.storage.sync.get(
  {
    apiKey: defaultAPIKey,
  },
  function (items) {
    document.getElementById("apiKey").value = items.apiKey;
  }
);

function show_save_status() {
  var status = document.getElementById("status");
  status.textContent = "Options saved.";
  setTimeout(function () {
    status.textContent = "";
  }, 750);
}

function save_options() {
  var prompt = document.getElementById("prompt").value;
  var apiKey = document.getElementById("apiKey").value;
  chrome.storage.sync.set(
    {
      prompt: prompt,
      apiKey: apiKey,
    },
    show_save_status
  );
}

function restore_options() {
  chrome.storage.sync.set(
    {
      prompt: defaultPrompt,
      apiKey: defaultAPIKey,
    },
    function () {
      document.getElementById("prompt").value = defaultPrompt;
      document.getElementById("apiKey").value = defaultAPIKey;
      show_save_status();
    }
  );
}
document.getElementById("saveButton").addEventListener("click", save_options);
document
  .getElementById("resetButton")
  .addEventListener("click", restore_options);
