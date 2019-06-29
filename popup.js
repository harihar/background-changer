'use strict';

const applyBtn = document.getElementById('apply');
const resetBtn = document.getElementById('reset');

// if it looks like an url use that as an image
// else use it as a string
applyBtn.onclick = function () {
    const imgUrlInput = document.querySelector(".url-input input");
    const imgUrl = imgUrlInput.value.trim();

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const tab = tabs[0];
        const url = new URL(tab.url);
        chrome.tabs.sendMessage(tab.id, {text: 'set_background', background: imgUrl}, function () {
            chrome.storage.sync.set({[url.host]: imgUrl});
        });
    });
};

resetBtn.onclick = function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.storage.sync.remove(new URL(tabs[0].url).host, function () {
            chrome.tabs.executeScript(
                tabs[0].id,
                {code: 'window.location.reload()'});
        });
    });
};
