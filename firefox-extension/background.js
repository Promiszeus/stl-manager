const api = (typeof browser !== 'undefined') ? browser : chrome;

function cleanModelUrl(url) {
  if (!url || typeof url !== 'string') return '';
  url = url.trim();

  // Printables CDN: files.printables.com/media/prints/610638/... -> https://www.printables.com/model/610638
  const mPrintables = url.match(/printables\.com\/(?:media\/)?prints\/(\d+)/i);
  if (mPrintables) {
    return `https://www.printables.com/model/${mPrintables[1]}`;
  }

  // MakerWorld: makerworld.com/models/12345 -> https://makerworld.com/en/models/12345
  const mMw = url.match(/makerworld\.com\/(?:[a-z]{2}\/)?models\/(\d+)/i);
  if (mMw) {
    return `https://makerworld.com/en/models/${mMw[1]}`;
  }

  // Thingiverse: thingiverse.com/thing:12345 or things/12345 -> https://www.thingiverse.com/thing:${mThing[1]}
  const mThing = url.match(/thingiverse\.com\/(?:things\/|thing:)(\d+)/i);
  if (mThing) {
    return `https://www.thingiverse.com/thing:${mThing[1]}`;
  }

  return url;
}

function isValidModelUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('moz-extension://') || url.startsWith('chrome-extension://')) return false;
  
  // Ignore bare homepages
  const parsed = url.replace(/https?:\/\//, '').replace(/\/+$/, '');
  if (!parsed.includes('/')) return false;
  
  return true;
}

function sendToStlManager(filename, pageUrl) {
  if (!filename || !pageUrl) return;

  // Clean / normalize URL to model presentation page
  const finalUrl = cleanModelUrl(pageUrl);
  if (!finalUrl) return;

  // Extract clean filename without path
  let cleanName = filename;
  if (cleanName.includes('\\')) cleanName = cleanName.split('\\').pop();
  if (cleanName.includes('/')) cleanName = cleanName.split('/').pop();

  console.log(`[STL-Manager Firefox] Tracking: ${cleanName} -> ${finalUrl}`);

  const payload = JSON.stringify({ filename: cleanName, url: finalUrl });
  const endpoints = [
    'http://localhost:8000/api/downloads/url',
    'http://127.0.0.1:8000/api/downloads/url'
  ];

  endpoints.forEach(ep => {
    fetch(ep, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    }).catch(() => {});
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
  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let bestUrl = '';
    if (tabs && tabs.length > 0 && isValidModelUrl(tabs[0].url)) {
      bestUrl = tabs[0].url;
    }

    // 2. If tab URL is invalid or generic, check downloadItem referrer
    if (!bestUrl && isValidModelUrl(downloadItem.referrer)) {
      bestUrl = downloadItem.referrer;
    }

    // 3. Fallback: check if downloadItem.url is a CDN link that can be transformed (e.g. Printables CDN)
    if (!bestUrl && downloadItem.url) {
      const cleanedCdn = cleanModelUrl(downloadItem.url);
      if (cleanedCdn && cleanedCdn !== downloadItem.url) {
        bestUrl = cleanedCdn;
      }
    }

    // 4. Fallback: check all open tabs matching 3D printing sites
    if (!bestUrl) {
      api.tabs.query({}, (allTabs) => {
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

if (api.downloads && api.downloads.onCreated) {
  api.downloads.onCreated.addListener((item) => {
    processDownload(item);
  });
}

if (api.downloads && api.downloads.onDeterminingFilename) {
  api.downloads.onDeterminingFilename.addListener((item, suggest) => {
    processDownload(item);
    if (typeof suggest === 'function') suggest();
  });
}

if (api.downloads && api.downloads.onChanged) {
  api.downloads.onChanged.addListener((delta) => {
    if (delta.filename && delta.filename.current) {
      api.downloads.search({ id: delta.id }, (items) => {
        if (items && items.length > 0) {
          processDownload(items[0]);
        }
      });
    }
  });
}
