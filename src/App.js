import React, { useState,useEffect  } from "react";
import ReactDOM from "react-dom";
import "./popup.css";

function App() {
  const [isFocused, setIsFocused] = useState(false);

  // Function to check if the current URL is a restricted one (like chrome://)
  const isRestrictedUrl = (url) => {
    return url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('https://chrome.google.com/webstore');
  };

  useEffect(() => {
    // On popup load, retrieve the focus mode state from storage
    chrome.storage.local.get("focusModeEnabled", (result) => {
      setIsFocused(!!result.focusModeEnabled);
    });
  }, []);

  const toggleFocusMode = async () => {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if the active tab is on a restricted URL
    if (isRestrictedUrl(activeTab.url)) {
      alert("Focus Mode cannot be enabled on this page.");
      return;
    }

    if (isFocused) {
      // Disable Focus Mode: Clear blur effect from all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (!isRestrictedUrl(tab.url)) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id, allFrames: true },
              func: () => document.body.style.filter = ""
            });
          }
        });
      });
      // Update storage to indicate that Focus Mode is off
      chrome.storage.local.set({ focusModeEnabled: false });
    } else {
      // Enable Focus Mode: Apply blur effect to all non-active tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id !== activeTab.id && !isRestrictedUrl(tab.url)) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id, allFrames: true },
              func: () => document.body.style.filter = "blur(5px) brightness(0.7)"
            });
          }
        });
      });
      // Update storage to indicate that Focus Mode is on
      chrome.storage.local.set({ focusModeEnabled: true });
    }

    // Toggle the local state
    setIsFocused(!isFocused);
  };

  return (
    <div className="container">
      <h2>Focus Mode</h2>
      <button onClick={toggleFocusMode}>
        {isFocused ? "Disable Focus Mode" : "Enable Focus Mode"}
      </button>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));

export default App;
