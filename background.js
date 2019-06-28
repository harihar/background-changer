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
    id: "applyBackground",
    title: "Apply Background",
    contexts: ["image"],
    visible: true
};
chrome.contextMenus.create(contextMenuItem);

const tabsWithHost = {};

chrome.tabs.getAllInWindow(null, function (tabs) {
    for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].url.startsWith("chrome://")) {
            continue;
        }
        const url = new URL(tabs[i].url);
        if ((tabsWithHost[url.host] || []).length === 0) {
            tabsWithHost[url.host] = [tabs[i].id];
        } else {
            tabsWithHost[url.host].push(tabs[i].id);
            continue;
        }
        const subContextMenuItem = {
            id: url.host,
            title: url.host,
            visible: true,
            contexts: ["image"],
            parentId: "applyBackground"
        };
        chrome.contextMenus.create(subContextMenuItem);
    }
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    for (let i = 0; i < tabsWithHost[info.menuItemId].length; i++) {
        const hostName = info.menuItemId;
        chrome.tabs.sendMessage(tabsWithHost[hostName][i], {
            text: 'set_background',
            background: info.srcUrl
        }, function () {
            chrome.storage.sync.set({[hostName]: info.srcUrl}, function () {

            });
        });
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //ignore urls like chrome://
    if (changeInfo.status === 'loading') {
        console.log(changeInfo);
        removeTabId(tabId);
        if ((changeInfo.url || "").startsWith("chrome://")) {
            return;
        }
        const newUrl = new URL(changeInfo.url);
        if ((tabsWithHost[newUrl.host] || []).length === 0) {
            tabsWithHost[newUrl.host] = [tabId];
        } else {
            tabsWithHost[newUrl.host].push(tabId);
        }
    }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    removeTabId(tabId);
});

function removeTabId(tabId) {
    const hostNames = Object.keys(tabsWithHost);
    for (let i = 0; i < hostNames; i++) {
        const tabIds = tabsWithHost[hostNames[i]];
        const indexOfTabId = tabIds.indexOf(tabId);
        if (indexOfTabId >= 0) {
            tabIds.splice(indexOfTabId, 1);
        }
    }
}
