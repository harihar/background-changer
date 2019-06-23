// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    // If the received message has the expected format...
    if (msg.text === 'set_background') {
        document.body.style.background = 'url(' + msg.background + ')';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundSize = 'cover';
        sendResponse();
    }
});
