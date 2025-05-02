// chrome.runtime.onInstalled.addListener(() => {
//   console.log("installed");

//   chrome.action.setBadgeText({
//     text: "OFF",
//   });
// });

chrome.action.onClicked.addListener(tab => {
  console.log('Extension icon clicked on tab:', tab.id);
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
  });
});

// chrome.action.onClicked.addListener((tab) => {
//   console.log('Extension icon clicked on tab:', tab.id);
  
//   // You can do various actions here, such as:
  
//   // 1. Send a message to content script
//   chrome.tabs.sendMessage(tab.id, {
//     action: "iconClicked",
//     data: { tabId: tab.id }
//   });
  
//   // 2. Open a popup or page
//   // chrome.windows.create({
//   //   url: chrome.runtime.getURL('popup.html'),
//   //   type: 'popup',
//   //   width: 400,
//   //   height: 600
//   // });
  
//   // 3. Modify the tab
//   // chrome.scripting.executeScript({
//   //   target: { tabId: tab.id },
//   //   function: contentScriptFunction
//   // });
  
//   // 4. Change the icon badge
//   chrome.action.setBadgeText({
//     text: "ON",
//     tabId: tab.id
//   });
  
//   // 5. Store state
//   chrome.storage.local.set({ 'isActive': true });
// });

// // Example function to be injected as a content script
// function contentScriptFunction() {
//   // This function runs in the context of the web page
//   console.log('Injected from background script');
//   document.body.style.backgroundColor = '#f0f0f0';
// }


// const extensions = "https://developer.chrome.com/docs/extensions";
// const webstore = "https://developer.chrome.com/docs/webstore";

// chrome.action.onClicked.addListener(async (tab) => {

//   window.alert("hello");
//   console.log("has just click");

//   if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore)) {
//     // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
//     const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
//     // Next state will always be the opposite
//     const nextState = prevState === "ON" ? "OFF" : "ON";

//     // Set the action badge to the next state
//     await chrome.action.setBadgeText({
//       tabId: tab.id,
//       text: nextState,
//     });

//     if (nextState === "ON") {
//       // Insert the CSS file when the user turns the extension on
//       await chrome.scripting.insertCSS({
//         files: ["css/focus-mode.css"],
//         target: { tabId: tab.id },
//       });
//     } else if (nextState === "OFF") {
//       // Remove the CSS file when the user turns the extension off
//       await chrome.scripting.removeCSS({
//         files: ["css/focus-mode.css"],
//         target: { tabId: tab.id },
//       });
//     }
//   }
// });
