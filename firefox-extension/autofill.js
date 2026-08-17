// STL-Manager Auto-Fill Content Script
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

  let credentials = null;
  let hasFilled = false;

  async function fetchCredentials() {
    const endpoints = [
      `http://localhost:8000/api/accounts/${platform}/autofill`,
      `http://127.0.0.1:8000/api/accounts/${platform}/autofill`
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep);
        if (res.ok) {
          const data = await res.json();
          if (data && data.found && data.username && data.password) {
            return data;
          }
        }
      } catch (e) {
        // server might be on another port or offline
      }
    }
    return null;
  }

  function setInputValue(input, val) {
    if (!input || !val) return;
    input.focus();
    
    // React / Vue input value tracker bypass
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, val);
    } else {
      input.value = val;
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.blur();
  }

  function showToast(platformName) {
    if (document.getElementById('stl-manager-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'stl-manager-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      background: rgba(15, 18, 30, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid #00d2ff;
      border-radius: 12px;
      padding: 12px 18px;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 8px 32px rgba(0, 210, 255, 0.25);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
      transform: translateY(0);
      opacity: 1;
    `;
    toast.innerHTML = `
      <span style="font-size: 16px;">⚡</span>
      <div>
        <div style="color: #00d2ff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">STL-Manager Auto-Fill</div>
        <div>Anmeldedaten für ${platformName} automatisch ausgefüllt!</div>
      </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  function tryAutoFill() {
    if (hasFilled || !credentials) return;

    // Find password input
    const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    const visiblePassInput = passwordInputs.find(i => i.offsetParent !== null || i.offsetWidth > 0);
    if (!visiblePassInput) return;

    // Find user / email input
    let userInput = null;
    const form = visiblePassInput.closest('form');
    if (form) {
      const inputs = Array.from(form.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"])'));
      userInput = inputs.find(i => i.offsetParent !== null);
    }

    if (!userInput) {
      const allInputs = Array.from(document.querySelectorAll('input[type="email"], input[type="text"], input[name*="user"], input[name*="mail"], input[name*="login"], input[id*="user"], input[id*="mail"], input[id*="login"]'));
      userInput = allInputs.find(i => i.offsetParent !== null);
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
      }

      hasFilled = true;
      showToast(platform.toUpperCase());
    }
  }

  // Initial fetch and observation
  fetchCredentials().then(creds => {
    if (creds) {
      credentials = creds;
      tryAutoFill();

      // Observe DOM for dynamic login dialogs
      const observer = new MutationObserver(() => {
        if (!hasFilled) tryAutoFill();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // Interval fallback for 10 seconds
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (hasFilled || checks > 20) {
          clearInterval(interval);
        } else {
          tryAutoFill();
        }
      }, 500);
    }
  });
})();
