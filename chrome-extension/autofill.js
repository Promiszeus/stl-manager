// STL-Manager Auto-Fill Content Script (v1.4.0)
(function() {
  const hostname = window.location.hostname.toLowerCase();
  let platform = null;

  if (hostname.includes('makerworld.com') || hostname.includes('bambulab.com')) {
    platform = 'makerworld';
  } else if (hostname.includes('printables.com') || hostname.includes('prusa3d.com')) {
    platform = 'printables';
  } else if (hostname.includes('thingiverse.com') || hostname.includes('makerbot.com')) {
    platform = 'thingiverse';
  } else if (hostname.includes('cults3d.com')) {
    platform = 'cults3d';
  } else if (hostname.includes('crealitycloud.com') || hostname.includes('creality.com')) {
    platform = 'creality';
  } else if (hostname.includes('makeronline.com')) {
    platform = 'makeronline';
  }

  if (!platform) return;

  const api = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome : (typeof browser !== 'undefined' ? browser : null);
  if (!api) return;

  let credentials = null;
  let hasFilled = false;

  function setInputValue(input, val) {
    if (!input || !val) return;
    input.focus();
    
    // Bypass React / Vue input value tracker
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, val);
    } else {
      input.value = val;
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    input.blur();
  }

  function showToast(platformName) {
    if (window.top !== window.self) return; // Only show toast in top window
    if (document.getElementById('stl-manager-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'stl-manager-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999999;
      background: rgba(15, 18, 30, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid #00d2ff;
      border-radius: 12px;
      padding: 12px 18px;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 8px 32px rgba(0, 210, 255, 0.35);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
      transform: translateY(0);
      opacity: 1;
      pointer-events: none;
    `;
    toast.innerHTML = `
      <span style="font-size: 18px;">⚡</span>
      <div>
        <div style="color: #00d2ff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">STL-Manager Auto-Fill (v1.3)</div>
        <div>Anmeldedaten für ${platformName} automatisch eingefügt!</div>
      </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  function tryAutoFill() {
    if (hasFilled || !credentials || !credentials.username || !credentials.password) return;

    // Find password input
    const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    const visiblePassInput = passwordInputs.find(i => i.offsetParent !== null || i.offsetWidth > 0 || i.clientHeight > 0);
    if (!visiblePassInput) return;

    // Find user / email input
    let userInput = null;
    const form = visiblePassInput.closest('form');
    if (form) {
      const inputs = Array.from(form.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"])'));
      userInput = inputs.find(i => i.offsetParent !== null || i.offsetWidth > 0);
    }

    if (!userInput) {
      const allInputs = Array.from(document.querySelectorAll('input[type="email"], input[autocomplete="username"], input[autocomplete="email"], input[name*="user"], input[name*="mail"], input[name*="login"], input[placeholder*="mail" i], input[placeholder*="konto" i], input[placeholder*="benutzer" i], input[placeholder*="account" i], input[type="text"]'));
      userInput = allInputs.find(i => i.offsetParent !== null || i.offsetWidth > 0);
    }

    if (userInput && visiblePassInput) {
      setInputValue(userInput, credentials.username);
      setInputValue(visiblePassInput, credentials.password);

      // Check terms checkbox if present and unchecked (e.g. MakerWorld "Ich stimme den Nutzungsbedingungen zu")
      const formContainer = form || document;
      const termsCheckbox = formContainer.querySelector('input[type="checkbox"]');
      if (termsCheckbox && !termsCheckbox.checked) {
        termsCheckbox.checked = true;
        termsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        termsCheckbox.dispatchEvent(new Event('click', { bubbles: true }));
      }

      hasFilled = true;
      showToast(platform.toUpperCase());
    }
  }

  // Request credentials from background script (cross-origin bypass)
  try {
    api.runtime.sendMessage({ action: 'get_autofill', platform: platform }, (response) => {
      if (response && response.found && response.username && response.password) {
        credentials = response;
        tryAutoFill();

        // Observe DOM mutations for dynamic popups / SPAs
        const observer = new MutationObserver(() => {
          if (!hasFilled) tryAutoFill();
        });
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true });
        }

        // Retry loop for dynamic login modals
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (hasFilled || attempts > 25) {
            clearInterval(interval);
          } else {
            tryAutoFill();
          }
        }, 400);
      }
    });
  } catch (e) {
    console.log('[STL-Manager] Auto-Fill notice:', e);
  }
})();
