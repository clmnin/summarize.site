const defaultPrompt = "Give me the summary of:";

chrome.storage.sync.get("prompt", function (items) {
    if (items.prompt) {
        document.getElementById('prompt').value = items.prompt;
    } else {
        document.getElementById('prompt').value = defaultPrompt;
    }
});

chrome.storage.sync.get({
    prompt: defaultPrompt,
}, function (items) {
    document.getElementById('prompt').value = items.prompt;
});

function show_save_status() {
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function () {
        status.textContent = '';
    }, 750);
}

function save_options() {
    var prompt = document.getElementById('prompt').value;
    chrome.storage.sync.set({
        prompt: prompt,
    }, show_save_status);
}
function restore_options() {
    chrome.storage.sync.set({
        prompt: defaultPrompt,
    }, function () {
        document.getElementById('prompt').value = defaultPrompt;
        show_save_status();
    });
}
document.getElementById('saveButton').addEventListener('click', save_options);
document.getElementById('resetButton').addEventListener('click', restore_options);
