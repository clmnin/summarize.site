const PROMPTS = {
  "default": {
    "name": "Default",
    "prompt": "You are acting as a summarization AI, and for the input text please summarize it to the most important 3 to 5 bullet points for brevity: ",
  },
  "zh_tw": {
    "name": "Tradition Chinese",
    "prompt": "As a summarization AI, please provide a concise summary of the given text in 3 to 5 key bullet points. Additionally, please output the summary in Traditional Chinese.",
  },
};

function getPrompt(name = "default") {
  if (name in PROMPTS) {
    return PROMPTS[name].prompt;
  }
  return { "error": "No prompt found for name: " + name, };
}
const defaultPrompt = getPrompt( ); // default prompt
const defaultAPIKey = "";

chrome.storage.sync.get("prompt", function (items) {
  if (items.prompt) {
    document.getElementById("prompt").value = items.prompt;
  } else {
    document.getElementById("prompt").value = defaultPrompt;
  }
});

chrome.storage.sync.get("promptSelect", function (items) {
  document.getElementById("promptSelect").innerHTML = "";
  let promptList = Object.keys(PROMPTS);
  promptList.forEach((key) => {
    let option = document.createElement("option");
    option.value = key;
    option.text = PROMPTS[key].name;
    if (items.promptSelect === key) {
      option.selected = true;
      document.getElementById("prompt").value = getPrompt(key);
    }
    document.getElementById("promptSelect").appendChild(option);
  });
  // add custom option
  let option = document.createElement("option");
  option.value = "custom";
  option.text = "Custom";
  if (items.promptSelect === "custom") {
    option.selected = true;
  }
  document.getElementById("promptSelect").appendChild(option);
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
  var promptSelect = document.getElementById("promptSelect").value;
  var prompt = document.getElementById("prompt").value;
  var apiKey = document.getElementById("apiKey").value;
  chrome.storage.sync.set(
    { prompt, apiKey, promptSelect, },
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

document.getElementById("promptSelect").addEventListener("change", function () {
  var promptSelect = document.getElementById("promptSelect").value;
  if (promptSelect !== "custom") {
    document.getElementById("prompt").value = getPrompt(promptSelect);
  }
});
document.getElementById("prompt").addEventListener("input", function () {
  document.getElementById("promptSelect").value = "custom";
});
document.getElementById("saveButton").addEventListener("click", save_options);
document.getElementById("resetButton").addEventListener("click", restore_options);
