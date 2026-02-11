// https://mixaoc.com
// PrivacyX v4.4 - Background Script
// Developer: https://github.com/mixaoc
// Credits :  https://addons.mozilla.org/fr/firefox/addon/privacyx/
// ==========================================

// Data Stores
let httpRequests = [];
let clipboardHistory = [];
let notes = [];
let customScripts = [];
let identityHistory = [];
let sessionStats = {
  startTime: Date.now(),
  lastActivity: Date.now(),
  requestsBlocked: 0,
  requestsTotal: 0,
  sessionsHistory: []
};

// Initialize extension
browser.runtime.onInstalled.addListener(() => {
  console.log("PrivacyX Pro v4.0 installed by Boivikh & Mixaoc 0PEN S0URCE");
  loadAllData();
  initializeSession();
  createContextMenus();
});

browser.runtime.onStartup.addListener(() => {
  loadAllData();
  initializeSession();
});

// Session Management
function initializeSession() {
  sessionStats.startTime = Date.now();
  sessionStats.lastActivity = Date.now();
  loadSessionHistory();
}

async function loadSessionHistory() {
  const result = await browser.storage.local.get('sessionsHistory');
  if (result.sessionsHistory) {
    sessionStats.sessionsHistory = result.sessionsHistory;
  }
}

async function saveSession() {
  const session = {
    startTime: sessionStats.startTime,
    endTime: Date.now(),
    duration: Date.now() - sessionStats.startTime,
    requestsTotal: sessionStats.requestsTotal,
    requestsBlocked: sessionStats.requestsBlocked
  };
  
  sessionStats.sessionsHistory.unshift(session);
  if (sessionStats.sessionsHistory.length > 100) {
    sessionStats.sessionsHistory = sessionStats.sessionsHistory.slice(0, 100);
  }
  
  await browser.storage.local.set({ sessionsHistory: sessionStats.sessionsHistory });
}

setInterval(saveSession, 60000);

// ==========================================
// HTTP REQUEST MONITORING
// ==========================================

const blockUrls = [
  "*://*.doubleclick.net/*",
  "*://*.googleadservices.com/*",
  "*://*.googlesyndication.com/*",
  "*://*.adnxs.com/*",
  "*://*.adsafeprotected.com/*",
  "*://*.adform.net/*",
  "*://*.google-analytics.com/*",
  "*://*.facebook.com/tr/*",
  "*://*.facebook.net/*"
];

const maliciousSites = [
  "*://*.malicioussite.com/*",
  "*://*.badvirus.com/*",
  "*://*.weirdads.com/*",
  "*://*.baddomain.net/*"
];

browser.webRequest.onBeforeRequest.addListener(
  details => {
    sessionStats.requestsTotal++;
    
    const requestInfo = {
      id: Date.now() + Math.random(),
      url: details.url,
      method: details.method,
      type: details.type,
      timestamp: new Date().toISOString(),
      blocked: false,
      reason: null
    };
    
    let shouldBlock = false;
    let blockReason = null;
    
    for (let pattern of blockUrls) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(details.url)) {
        shouldBlock = true;
        blockReason = 'Tracker/Ad blocked';
        sessionStats.requestsBlocked++;
        break;
      }
    }
    
    for (let pattern of maliciousSites) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(details.url)) {
        shouldBlock = true;
        blockReason = 'Malicious site blocked';
        sessionStats.requestsBlocked++;
        
        browser.notifications.create({
          type: "basic",
          iconUrl: browser.extension.getURL("icons/icon.png"),
          title: "Malicious Site Blocked",
          message: "Attempted access to malicious site has been blocked."
        });
        break;
      }
    }
    
    requestInfo.blocked = shouldBlock;
    requestInfo.reason = blockReason;
    
    httpRequests.unshift(requestInfo);
    if (httpRequests.length > 500) {
      httpRequests = httpRequests.slice(0, 500);
    }
    
    if (shouldBlock) {
      return { cancel: true };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

const fraudulentCookieDomains = ["examplefraud.com", "maliciouscookies.com", "fraudcookie.net"];

browser.webRequest.onHeadersReceived.addListener(
  details => {
    let isFraudulent = fraudulentCookieDomains.some(domain => details.url.includes(domain));
    if (isFraudulent) {
      let headers = details.responseHeaders.filter(header => header.name.toLowerCase() !== "set-cookie");
      return { responseHeaders: headers };
    }
    return {};
  },
  { urls: ["<all_urls>"] },
  ["blocking", "responseHeaders"]
);

// ==========================================
// CLIPBOARD MONITORING
// ==========================================

let lastClipboardContent = '';
let clipboardCheckInterval = null;

function startClipboardMonitoring() {
  if (clipboardCheckInterval) return;
  
  clipboardCheckInterval = setInterval(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text !== lastClipboardContent && text.length > 0) {
        lastClipboardContent = text;
        
        const clipboardItem = {
          id: Date.now() + Math.random(),
          content: text,
          timestamp: new Date().toISOString(),
          preview: text.substring(0, 100)
        };
        
        clipboardHistory.unshift(clipboardItem);
        if (clipboardHistory.length > 1000) {
          clipboardHistory = clipboardHistory.slice(0, 1000);
        }
        
        saveClipboardHistory();
      }
    } catch (error) {}
  }, 2000);
}

async function saveClipboardHistory() {
  await browser.storage.local.set({ clipboardHistory: clipboardHistory });
}

async function loadClipboardHistory() {
  const result = await browser.storage.local.get('clipboardHistory');
  if (result.clipboardHistory) {
    clipboardHistory = result.clipboardHistory;
  }
}

// ==========================================
// NOTES & REMINDERS
// ==========================================

async function saveNotes() {
  await browser.storage.local.set({ notes: notes });
}

async function loadNotes() {
  const result = await browser.storage.local.get('notes');
  if (result.notes) {
    notes = result.notes;
    for (let note of notes) {
      if (note.reminderTime && new Date(note.reminderTime) > new Date()) {
        createAlarmForNote(note);
      }
    }
  }
}

function createAlarmForNote(note) {
  const alarmName = `note_${note.id}`;
  browser.alarms.create(alarmName, {
    when: new Date(note.reminderTime).getTime()
  });
}

browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name.startsWith('note_')) {
    const noteId = alarm.name.replace('note_', '');
    const note = notes.find(n => n.id == noteId);
    
    if (note) {
      browser.notifications.create({
        type: "basic",
        iconUrl: browser.extension.getURL("icons/icon.png"),
        title: "PrivacyX Reminder",
        message: note.content
      });
    }
  }
});

// ==========================================
// CUSTOM SCRIPTS INJECTION
// ==========================================

async function loadCustomScripts() {
  const result = await browser.storage.local.get('customScripts');
  if (result.customScripts) {
    customScripts = result.customScripts;
  }
}

async function saveCustomScripts() {
  await browser.storage.local.set({ customScripts: customScripts });
}

// Inject scripts on page load
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    injectMatchingScripts(tabId, tab.url);
  }
});

function injectMatchingScripts(tabId, url) {
  for (let script of customScripts) {
    if (!script.enabled) continue;
    
    const urlPattern = script.urlPattern.replace(/\*/g, '.*');
    const regex = new RegExp(urlPattern);
    
    if (regex.test(url)) {
      browser.tabs.executeScript(tabId, {
        code: script.code,
        runAt: 'document_start'
      }).catch(err => console.error('Script injection failed:', err));
    }
  }
}

// ==========================================
// ANTI-FINGERPRINTING SETTINGS
// ==========================================

let fingerprintSettings = {
  webrtc: { enabled: true, mode: 'disable' },
  timezone: 'America/New_York',
  language: 'en-US',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  os: 'Windows',
  platform: 'Win32',
  resolution: { width: 1920, height: 1080 },
  gpu: {
    vendor: 'NVIDIA Corporation',
    renderer: 'NVIDIA GeForce RTX 3080'
  },
  canvas: { enabled: true, noise: 0.01 },
  audioContext: { enabled: true, noise: 0.001 },
  webgl: { enabled: true }
};

const fingerprintPresets = {
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
  ],
  gpus: [
    { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4090' },
    { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4080' },
    { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3090' },
    { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3080' },
    { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3070' },
    { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1080 Ti' },
    { vendor: 'AMD', renderer: 'AMD Radeon RX 7900 XTX' },
    { vendor: 'AMD', renderer: 'AMD Radeon RX 7900 XT' },
    { vendor: 'AMD', renderer: 'AMD Radeon RX 6900 XT' },
    { vendor: 'AMD', renderer: 'AMD Radeon RX 6800 XT' },
    { vendor: 'AMD', renderer: 'AMD Radeon RX 5700 XT' },
    { vendor: 'Intel Corporation', renderer: 'Intel(R) UHD Graphics 770' },
    { vendor: 'Intel Corporation', renderer: 'Intel(R) Iris(R) Xe Graphics' }
  ],
  resolutions: [
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
    { width: 3840, height: 2160 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1680, height: 1050 }
  ],
  timezones: [
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney'
  ],
  languages: [
    'en-US',
    'en-GB',
    'fr-FR',
    'de-DE',
    'es-ES',
    'it-IT',
    'pt-BR',
    'ja-JP',
    'zh-CN',
    'ko-KR'
  ],
  platforms: {
    'Windows': 'Win32',
    'Mac': 'MacIntel',
    'Linux': 'Linux'
  }
};

async function loadFingerprintSettings() {
  const result = await browser.storage.local.get('fingerprintSettings');
  if (result.fingerprintSettings) {
    fingerprintSettings = result.fingerprintSettings;
  }
}

async function saveFingerprintSettings() {
  await browser.storage.local.set({ fingerprintSettings: fingerprintSettings });
  
  const tabs = await browser.tabs.query({});
  for (let tab of tabs) {
    browser.tabs.sendMessage(tab.id, {
      action: 'updateFingerprint',
      settings: fingerprintSettings
    }).catch(() => {});
  }
}

loadFingerprintSettings();

// ==========================================
// IDENTITY HISTORY STORAGE
// ==========================================

async function loadIdentityHistory() {
  const result = await browser.storage.local.get('identityHistory');
  if (result.identityHistory) {
    identityHistory = result.identityHistory;
  }
}

async function saveIdentityHistory() {
  await browser.storage.local.set({ identityHistory: identityHistory });
}

// ==========================================
// CONTEXT MENU
// ==========================================

function createContextMenus() {
  browser.contextMenus.create({
    id: 'save-page-html',
    title: 'Save Page as HTML',
    contexts: ['page']
  });
  
  browser.contextMenus.create({
    id: 'google-lens',
    title: 'Search with Google Lens',
    contexts: ['image']
  });
}

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'save-page-html':
      try {
        const response = await fetch(tab.url);
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        await browser.downloads.download({
          url: url,
          filename: `page_${Date.now()}.html`,
          saveAs: true
        });
        
        browser.notifications.create({
          type: 'basic',
          iconUrl: browser.extension.getURL('icons/icon.png'),
          title: 'Page Saved',
          message: 'The page has been saved as HTML'
        });
      } catch (error) {
        console.error('Error saving page:', error);
      }
      break;
      
    case 'google-lens':
      if (info.srcUrl) {
        const lensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(info.srcUrl)}`;
        browser.tabs.create({ url: lensUrl });
      }
      break;
  }
});

// ==========================================
// LOAD ALL DATA
// ==========================================

async function loadAllData() {
  await loadClipboardHistory();
  await loadNotes();
  await loadSessionHistory();
  await loadFingerprintSettings();
  await loadCustomScripts();
  await loadIdentityHistory();
}

// ==========================================
// MESSAGE HANDLING
// ==========================================

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "getHttpRequests":
      sendResponse({ requests: httpRequests });
      break;
      
    case "clearHttpRequests":
      httpRequests = [];
      sendResponse({ status: "cleared" });
      break;
      
    case "getClipboardHistory":
      sendResponse({ history: clipboardHistory });
      break;
      
    case "clearClipboardHistory":
      clipboardHistory = [];
      saveClipboardHistory();
      sendResponse({ status: "cleared" });
      break;
      
    case "deleteClipboardItem":
      clipboardHistory = clipboardHistory.filter(item => item.id !== message.id);
      saveClipboardHistory();
      sendResponse({ status: "deleted" });
      break;
      
    case "copyToClipboard":
      navigator.clipboard.writeText(message.text);
      sendResponse({ status: "copied" });
      break;
      
    case "getNotes":
      sendResponse({ notes: notes });
      break;
      
    case "addNote":
      const newNote = {
        id: Date.now() + Math.random(),
        content: message.content,
        createdAt: new Date().toISOString(),
        reminderTime: message.reminderTime || null
      };
      
      if (newNote.reminderTime) {
        createAlarmForNote(newNote);
      }
      
      notes.unshift(newNote);
      saveNotes();
      sendResponse({ status: "added", note: newNote });
      break;
      
    case "deleteNote":
      notes = notes.filter(note => note.id !== message.id);
      browser.alarms.clear(`note_${message.id}`);
      saveNotes();
      sendResponse({ status: "deleted" });
      break;
      
    case "getStats":
      sendResponse({ stats: sessionStats });
      break;
      
    case "cleanSelected":
      browser.browsingData.remove({}, message.options)
        .then(() => {
          console.log("Data cleaned:", message.options);
        })
        .catch(error => console.error("Error cleaning data:", error));
      sendResponse({ status: "cleaned" });
      break;
      
    case "closeTabs":
      browser.tabs.query({}).then(tabs => {
        let tabIds = tabs.map(tab => tab.id);
        browser.tabs.remove(tabIds).catch(error => console.error("Error closing tabs:", error));
      });
      sendResponse({ status: "tabs closed" });
      break;
      
    case "startClipboardMonitoring":
      startClipboardMonitoring();
      sendResponse({ status: "started" });
      break;
      
    case "getFingerprintSettings":
      sendResponse({ settings: fingerprintSettings, presets: fingerprintPresets });
      break;
      
    case "updateFingerprintSettings":
      fingerprintSettings = { ...fingerprintSettings, ...message.settings };
      saveFingerprintSettings();
      sendResponse({ status: "updated" });
      break;
      
    case "resetFingerprintSettings":
      fingerprintSettings = {
        webrtc: { enabled: true, mode: 'disable' },
        timezone: 'America/New_York',
        language: 'en-US',
        userAgent: fingerprintPresets.userAgents[0],
        os: 'Windows',
        platform: 'Win32',
        resolution: { width: 1920, height: 1080 },
        gpu: fingerprintPresets.gpus[3],
        canvas: { enabled: true, noise: 0.01 },
        audioContext: { enabled: true, noise: 0.001 },
        webgl: { enabled: true }
      };
      saveFingerprintSettings();
      sendResponse({ status: "reset" });
      break;
      
    case "getCustomScripts":
      sendResponse({ scripts: customScripts });
      break;
      
    case "addCustomScript":
      const script = {
        id: Date.now() + Math.random(),
        name: message.name,
        urlPattern: message.urlPattern,
        code: message.code,
        enabled: true,
        persistent: message.persistent || false,
        createdAt: new Date().toISOString()
      };
      customScripts.unshift(script);
      saveCustomScripts();
      sendResponse({ status: "added", script: script });
      break;
      
    case "deleteCustomScript":
      customScripts = customScripts.filter(s => s.id !== message.id);
      saveCustomScripts();
      sendResponse({ status: "deleted" });
      break;
      
    case "toggleCustomScript":
      const scriptToToggle = customScripts.find(s => s.id === message.id);
      if (scriptToToggle) {
        scriptToToggle.enabled = !scriptToToggle.enabled;
        saveCustomScripts();
        sendResponse({ status: "toggled", enabled: scriptToToggle.enabled });
      }
      break;
      
    case "testCustomScript":
      browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        if (tabs[0]) {
          browser.tabs.executeScript(tabs[0].id, {
            code: message.code,
            runAt: 'document_start'
          }).then(() => {
            sendResponse({ status: "success" });
          }).catch(err => {
            sendResponse({ status: "error", error: err.message });
          });
        }
      });
      break;

    case "getIdentityHistory":
      sendResponse({ history: identityHistory });
      break;

    case "saveIdentityHistory":
      identityHistory = message.history;
      saveIdentityHistory();
      sendResponse({ status: "saved" });
      break;
  }
  
  return true;
});

startClipboardMonitoring();
