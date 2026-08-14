function isValidModelUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('chrome-extension://')) return false;
  
  // Ignore bare homepages
  const parsed = url.replace(/https?:\/\//, '').replace(/\/+$/, '');
  if (!parsed.includes('/')) return false; // just domain like "makerworld.com"
  
  return true;
}

function sendToStlManager(filename, pageUrl) {
  if (!filename || !pageUrl) return;

  // Extract clean filename without path
  let cleanName = filename;
  if (cleanName.includes('\\')) cleanName = cleanName.split('\\').pop();
  if (cleanName.includes('/')) cleanName = cleanName.split('/').pop();

  console.log(`[STL-Manager] Sending download link: ${cleanName} -> ${pageUrl}`);

  const payload = JSON.stringify({ filename: cleanName, url: pageUrl });
  const endpoints = [
    'http://localhost:8000/api/downloads/url',
    'http://127.0.0.1:8000/api/downloads/url'
  ];

  endpoints.forEach(ep => {
    fetch(ep, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    }).catch(() => {
      // Backend might be offline or using another port
    });
  });
}

function processDownload(downloadItem) {
  const filename = downloadItem.filename || downloadItem.finalUrl || '';
  const lower = filename.toLowerCase();
  const is3D = lower.endsWith('.stl') || lower.endsWith('.3mf') || lower.endsWith('.obj') || 
               lower.endsWith('.zip') || lower.endsWith('.rar') || lower.endsWith('.7z') ||
               lower.endsWith('.step') || lower.endsWith('.stp');

  if (!is3D) return;

  // 1. Try active tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let bestUrl = '';
    if (tabs && tabs.length > 0 && isValidModelUrl(tabs[0].url)) {
      bestUrl = tabs[0].url;
    }

    // 2. If tab URL is invalid or generic, check downloadItem referrer
    if (!bestUrl && isValidModelUrl(downloadItem.referrer)) {
      bestUrl = downloadItem.referrer;
    }

    // 3. Fallback: check all tabs matching 3D printing sites
    if (!bestUrl) {
      chrome.tabs.query({}, (allTabs) => {
        for (const t of allTabs) {
          if (t.url && (
            t.url.includes('makerworld.com/en/models/') || 
            t.url.includes('makerworld.com/de/models/') || 
            t.url.includes('makerworld.com/models/') || 
            t.url.includes('printables.com/model/') || 
            t.url.includes('cults3d.com/') || 
            t.url.includes('thingiverse.com/thing:') || 
            t.url.includes('makeronline.com/model/') ||
            t.url.includes('crealitycloud.com/model-detail/')
          )) {
            bestUrl = t.url;
            break;
          }
        }
        if (bestUrl) {
          sendToStlManager(filename, bestUrl);
        }
      });
      return;
    }

    if (bestUrl) {
      sendToStlManager(filename, bestUrl);
    }
  });
}

// Listen to download creation
chrome.downloads.onCreated.addListener((item) => {
  processDownload(item);
});

// Listen when filename is determined
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  processDownload(item);
  suggest();
});

// Listen to state changes
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.filename && delta.filename.current) {
    chrome.downloads.search({ id: delta.id }, (items) => {
      if (items && items.length > 0) {
        processDownload(items[0]);
      }
    });
  }
});
