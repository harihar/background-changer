'use strict';

chrome.webNavigation.onCompleted.addListener(function (data) {
    const url = new URL(data.url);
    chrome.storage.sync.get(url.host, function (storedData) {
        if (storedData[url.host]) {
            console.log('found saved background', storedData);
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                const tab = tabs[0];
                chrome.tabs.sendMessage(tab.id, {
                    text: 'set_background',
                    background: storedData[url.host]
                }, function () {
                });
            });
        }
    });
});

const contextMenuItem = {
    "id": "applyBackground",
    "title": "Apply Background",
    "contexts": ["all"],
    "visible": true
};

chrome.contextMenus.create(contextMenuItem, function () {

});
