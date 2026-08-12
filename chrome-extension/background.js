chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  const filename = downloadItem.filename;
  if (!filename) {
    suggest();
    return;
  }
  
  const lower = filename.toLowerCase();
  
  if (lower.endsWith('.stl') || lower.endsWith('.3mf') || lower.endsWith('.obj')) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const pageUrl = tabs[0].url;
        
        // Nur den reinen Dateinamen ohne Ordnerstruktur
        let cleanName = filename;
        if (cleanName.includes('\\')) cleanName = cleanName.split('\\').pop();
        if (cleanName.includes('/')) cleanName = cleanName.split('/').pop();

        console.log(`Sending to STL-Manager: ${cleanName} -> ${pageUrl}`);

        fetch('http://localhost:8000/api/downloads/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: cleanName, url: pageUrl })
        }).catch((err) => console.log("STL-Manager API unreachable", err));
      }
    });
  }
  suggest();
});
