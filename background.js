// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// chrome.runtime.onInstalled.addListener(function () {
//     chrome.storage.sync.set({color: '#3aa757'}, function () {
//         console.log('The color is green.');
//     });
//     chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
//         chrome.declarativeContent.onPageChanged.addRules([{
//             conditions: [new chrome.declarativeContent.PageStateMatcher({
//                 pageUrl: {urlMatches: '.*'},
//             })],
//             actions: [new chrome.declarativeContent.ShowPageAction()]
//         }]);
//     });
// });

// chrome.tabs.onUpdated.addListener(function (tabId, info) {
//     if (info.status === 'complete') {
//         const unmodifiedBackground = JSON.stringify(window.getComputedStyle(document.body, null).getPropertyValue('background'));
//         chrome.storage.sync.set({'unmodifiedBackground': unmodifiedBackground}, function () {
//             console.log('saved background ', unmodifiedBackground);
//         });
//         chrome.tabs.sendMessage(tabId, {text: 'report_back'}, function () {
//
//         });
//     }
// });

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
