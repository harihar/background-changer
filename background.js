'use strict';

chrome.contextMenus.remove('applyBackground');
const contextMenuItem = {
    id: "applyBackground",
    title: "Apply Background",
    contexts: ["image"],
    visible: true
};
chrome.contextMenus.create(contextMenuItem);

const tabsWithHost = {};

chrome.windows.getAll({populate: true}, function (windows) {
    windows.forEach(function (window) {
        window.tabs.forEach(function (tab) {
            if (tab.url.startsWith("chrome://")) {
                return;
            }
            const url = new URL(tab.url);
            if ((tabsWithHost[url.host] || []).length > 0) {
                appendTabId(url.host, tab.id);
            } else {
                addContextMenuItem(url.host, tab.id);
            }
        });
    });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    for (let i = 0; i < tabsWithHost[info.menuItemId].length; i++) {
        const hostName = info.menuItemId;
        chrome.tabs.sendMessage(tabsWithHost[hostName][i], {
            text: 'set_background',
            background: info.srcUrl
        }, function () {
            chrome.storage.sync.set({[hostName]: info.srcUrl});
        });
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //ignore urls like chrome://
    if (tab.url.startsWith("chrome://")) {
        return;
    }
    if (changeInfo.status === 'complete') {
        const newUrl = new URL(tab.url);
        chrome.storage.sync.get(newUrl.host, function (storedData) {
            if (storedData[newUrl.host]) {
                chrome.tabs.sendMessage(tabId, {
                    text: 'set_background',
                    background: storedData[newUrl.host]
                });
            }
        });

        removeTabId(tabId);
        if ((tabsWithHost[newUrl.host] || []).length === 0) {
            addContextMenuItem(newUrl.host, tabId);
        } else {
            appendTabId(newUrl.host, tabId);
        }
    }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    removeTabId(tabId);
});

function appendTabId(host, tabId) {
    tabsWithHost[host].push(tabId);
    console.log('added', tabId, 'to', host);
}

function removeWww(host) {
    const parts = host.split("www.");
    return parts.length > 1 ? parts[1] : parts[0];
}

function addContextMenuItem(host, tabId) {
    const hostLabel = removeWww(host);
    tabsWithHost[host] = [tabId];
    const subContextMenuItem = {
        id: host,
        title: hostLabel,
        visible: true,
        contexts: ["image"],
        parentId: "applyBackground"
    };
    chrome.contextMenus.create(subContextMenuItem);
    console.log('added context menu item', hostLabel);
}

function removeTabId(tabId) {
    const hostNames = Object.keys(tabsWithHost) || [];
    for (let i = 0; i < hostNames.length; i++) {
        const hostName = hostNames[i];
        const tabIds = tabsWithHost[hostName];
        const indexOfTabId = tabIds.indexOf(tabId);
        if (indexOfTabId >= 0) {
            tabIds.splice(indexOfTabId, 1);
            console.log('removed', tabId, hostName);
            // if this is the last tab for the domain, remove the host name from the map
            if (tabIds.length === 0) {
                delete tabsWithHost[hostName];
                chrome.contextMenus.remove(hostName);
                console.log('removed context menu item', hostName);
            }
        }
    }
}
