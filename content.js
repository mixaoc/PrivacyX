
// PrivacyX v10.0 - Advanced - 08/02/2026
// Developer: https://github.com/mixaoc
// Anti-Fingerprinting Protection DEBUG 5BG6IGH
// credits https://addons.mozilla.org/fr/firefox/addon/privacyx/
// Boivikh & Mixaoc
// Created By NSA & BL2C & C3N
// =======================================

console.log('PrivacyX Pro v4.0 loaded :3 by Mixaoc & boivikh ');

// Get fingerprint settings from background
let fingerprintSettings = null;

browser.runtime.sendMessage({ action: 'getFingerprintSettings' }).then(response => {
  if (response && response.settings) {
    fingerprintSettings = response.settings;
    applyFingerprint();
  }
});

// Listen for fingerprint updates gho
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateFingerprint' && message.settings) {
    fingerprintSettings = message.settings;
    applyFingerprint();
  }
});

// Apply fingerprint spoofing 4x resolve
function applyFingerprint() {
  if (!fingerprintSettings) return;
  
  // Inject spoofing script into page context to re memory
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      const settings = ${JSON.stringify(fingerprintSettings)};
      
      // ==========================================
      // USER AGENT SPOOFING 
      // fixed 2025
      // ==========================================
      if (settings.userAgent) {
        Object.defineProperty(navigator, 'userAgent', {
          get: () => settings.userAgent,
          configurable: true
        });
      }
      
      // ==========================================
      // PLATFORM SPOOFING (not remove !!! idiot :3
      // ==========================================
      if (settings.platform) {
        Object.defineProperty(navigator, 'platform', {
          get: () => settings.platform,
          configurable: true
        });
      }
      
      // ==========================================
      // LANGUAGE SPOOFING 6.7 UPGRADE !!!!!!!!!!
      // ==========================================
      if (settings.language) {
        Object.defineProperty(navigator, 'language', {
          get: () => settings.language,
          configurable: true
        });
        
        Object.defineProperty(navigator, 'languages', {
          get: () => [settings.language],
          configurable: true
        });
      }
      
      // ==========================================
      // TIMEZONE SPOOFING
      // ==========================================
      if (settings.timezone) {
        const originalDateTimeFormat = Intl.DateTimeFormat;
        Intl.DateTimeFormat = function(...args) {
          if (args[1] && !args[1].timeZone) {
            args[1].timeZone = settings.timezone;
          }
          return new originalDateTimeFormat(...args);
        };
        
        Date.prototype.getTimezoneOffset = function() {
          // Calculate offset based on spoofed timezone
          const tzOffset = {
            'America/New_York': 300,
            'America/Los_Angeles': 480,
            'America/Chicago': 360,
            'Europe/London': 0,
            'Europe/Paris': -60,
            'Europe/Berlin': -60,
            'Asia/Tokyo': -540,
            'Asia/Shanghai': -480,
            'Asia/Dubai': -240,
            'Australia/Sydney': -660
          };
          return tzOffset[settings.timezone] || 0;
        };
      }
      
      // ==========================================
      // SCREEN RESOLUTION SPOOFING
      // ==========================================
      if (settings.resolution) {
        Object.defineProperty(window.screen, 'width', {
          get: () => settings.resolution.width,
          configurable: true
        });
        
        Object.defineProperty(window.screen, 'height', {
          get: () => settings.resolution.height,
          configurable: true
        });
        
        Object.defineProperty(window.screen, 'availWidth', {
          get: () => settings.resolution.width,
          configurable: true
        });
        
        Object.defineProperty(window.screen, 'availHeight', {
          get: () => settings.resolution.height - 40, // Account for taskbar
          configurable: true
        });
      }
      
      // =========================================================
      // WEBGL & GPU SPOOFING AND OTHER OPTION COMING SOON HEHE 
      // =========================================================
      if (settings.gpu && settings.webgl.enabled) {
        const getParameterProxyHandler = {
          apply: function(target, thisArg, args) {
            const param = args[0];
            
            // UNMASKED_VENDOR_WEBGL
            if (param === 37445) {
              return settings.gpu.vendor;
            }
            
            // UNMASKED_RENDERER_WEBGL
            if (param === 37446) {
              return settings.gpu.renderer;
            }
            
            return target.apply(thisArg, args);
          }
        };
        
        // WebGL 1
        const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = new Proxy(
          originalGetParameter,
          getParameterProxyHandler
        );
        
        // WebGL 2
        if (typeof WebGL2RenderingContext !== 'undefined') {
          const originalGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
          WebGL2RenderingContext.prototype.getParameter = new Proxy(
            originalGetParameter2,
            getParameterProxyHandler
          );
        }
        
        // WebGL Debug Renderer Info
        const originalGetExtension = WebGLRenderingContext.prototype.getExtension;
        WebGLRenderingContext.prototype.getExtension = function(name) {
          const ext = originalGetExtension.call(this, name);
          
          if (name === 'WEBGL_debug_renderer_info' && ext) {
            const originalGetParam = this.getParameter.bind(this);
            this.getParameter = function(param) {
              if (param === ext.UNMASKED_VENDOR_WEBGL) {
                return settings.gpu.vendor;
              }
              if (param === ext.UNMASKED_RENDERER_WEBGL) {
                return settings.gpu.renderer;
              }
              return originalGetParam(param);
            };
          }
          
          return ext;
        };
      }
      
      // ==========================================
      // CANVAS FINGERPRINTING PROTECTION  git boivikh
      // ==========================================
      if (settings.canvas.enabled) {
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        const originalToBlob = HTMLCanvasElement.prototype.toBlob;
        const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
        
        // Add noise to canvas data
        function addCanvasNoise(imageData) {
          if (!imageData || !imageData.data) return imageData;
          
          const data = imageData.data;
          const noise = settings.canvas.noise;
          
          for (let i = 0; i < data.length; i += 4) {
            // Add slight random noise to RGB channels
            data[i] = Math.min(255, Math.max(0, data[i] + (Math.random() - 0.5) * noise * 255));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (Math.random() - 0.5) * noise * 255));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (Math.random() - 0.5) * noise * 255));
          }
          
          return imageData;
        }
        
        HTMLCanvasElement.prototype.toDataURL = function(...args) {
          const context = this.getContext('2d');
          if (context) {
            const imageData = context.getImageData(0, 0, this.width, this.height);
            addCanvasNoise(imageData);
            context.putImageData(imageData, 0, 0);
          }
          return originalToDataURL.apply(this, args);
        };
        
        CanvasRenderingContext2D.prototype.getImageData = function(...args) {
          const imageData = originalGetImageData.apply(this, args);
          return addCanvasNoise(imageData);
        };
      }
      
      // ==========================================
      // AUDIO CONTEXT FINGERPRINTING PROTECTION
      // ==========================================
      if (settings.audioContext.enabled) {
        const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
        
        if (OriginalAudioContext) {
          const audioContextHandler = {
            construct: function(target, args) {
              const context = new target(...args);
              const originalCreateOscillator = context.createOscillator.bind(context);
              
              context.createOscillator = function() {
                const oscillator = originalCreateOscillator();
                const originalStart = oscillator.start.bind(oscillator);
                
                oscillator.start = function(...args) {
                  // Add slight noise to frequency
                  if (oscillator.frequency) {
                    const noise = settings.audioContext.noise;
                    oscillator.frequency.value += (Math.random() - 0.5) * noise;
                  }
                  return originalStart(...args);
                };
                
                return oscillator;
              };
              
              return context;
            }
          };
          
          window.AudioContext = new Proxy(OriginalAudioContext, audioContextHandler);
          if (window.webkitAudioContext) {
            window.webkitAudioContext = new Proxy(OriginalAudioContext, audioContextHandler);
          }
        }
      }
      
      // ==========================================
      // WEBRTC PROTECTION
      // ==========================================
      if (settings.webrtc.enabled && settings.webrtc.mode === 'disable') {
        // Completely disable WebRTC
        if (window.RTCPeerConnection) {
          window.RTCPeerConnection = function() {
            throw new Error('WebRTC is disabled for privacy');
          };
        }
        
        if (window.webkitRTCPeerConnection) {
          window.webkitRTCPeerConnection = function() {
            throw new Error('WebRTC is disabled for privacy');
          };
        }
        
        if (window.mozRTCPeerConnection) {
          window.mozRTCPeerConnection = function() {
            throw new Error('WebRTC is disabled for privacy');
          };
        }
        
        // Disable getUserMedia
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia = function() {
            return Promise.reject(new Error('getUserMedia is disabled for privacy'));
          };
        }
      }
      
      // ==========================================
      // BATTERY API BLOCKING
      // ==========================================
      if (navigator.getBattery) {
        navigator.getBattery = function() {
          return Promise.reject(new Error('Battery API is disabled for privacy'));
        };
      }
      
      // ==========================================
      // HARDWARE CONCURRENCY SPOOFING
      // ==========================================
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8, // Always report 8 cores
        configurable: true
      });
      
      // ==========================================
      // DEVICE MEMORY SPOOFING
      // ==========================================
      if (navigator.deviceMemory) {
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => 8, // Always report 8GB
          configurable: true
        });
      }
      
      // ==========================================
      // PLUGINS SPOOFING
      // ==========================================
      Object.defineProperty(navigator, 'plugins', {
        get: () => [],
        configurable: true
      });
      
      // ==========================================
      // COLOR DEPTH SPOOFING
      // ==========================================
      Object.defineProperty(window.screen, 'colorDepth', {
        get: () => 24,
        configurable: true
      });
      
      Object.defineProperty(window.screen, 'pixelDepth', {
        get: () => 24,
        configurable: true
      });
      
      // ==========================================
      // DISABLE TRACKING METHODS
      // ==========================================
      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon = function() { return false; };
      }
      
      // Console notification
      console.log('%c🛡️ PrivacyX Pro Active', 'color: #44aaff; font-size: 16px; font-weight: bold;');
      console.log('%cAnti-Fingerprinting Protection Enabled', 'color: #4caf50; font-size: 12px;');
    })();
  `;
  
  // Inject before any other scripts
  (document.head || document.documentElement).insertBefore(script, (document.head || document.documentElement).firstChild);
  script.remove();
}

// Apply on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyFingerprint);
} else {
  applyFingerprint();
}

// ==========================================
// PASSWORD MANAGER - AUTO-FILL
// ==========================================

// Listen for password fill requests
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillPassword') {
    fillLoginForm(message.username, message.password);
    sendResponse({ status: 'filled' });
  }
});

// Fill login form
function fillLoginForm(username, password) {
  // Find username/email fields
  const usernameFields = document.querySelectorAll('input[type="email"], input[type="text"], input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"], input[autocomplete="username"], input[autocomplete="email"]');
  
  // Find password fields
  const passwordFields = document.querySelectorAll('input[type="password"]');
  
  // Fill username
  if (usernameFields.length > 0 && username) {
    usernameFields[0].value = username;
    usernameFields[0].dispatchEvent(new Event('input', { bubbles: true }));
    usernameFields[0].dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Fill password
  if (passwordFields.length > 0 && password) {
    passwordFields[0].value = password;
    passwordFields[0].dispatchEvent(new Event('input', { bubbles: true }));
    passwordFields[0].dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Visual feedback
  if (usernameFields.length > 0 || passwordFields.length > 0) {
    showNotification('Password auto-filled!', 'success');
  }
}

// Detect form submissions and offer to save
let formSubmitHandler = null;

function detectFormSubmission() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    // Remove old listener if any
    if (formSubmitHandler) {
      form.removeEventListener('submit', formSubmitHandler);
    }
    
    formSubmitHandler = (e) => {
      const passwordFields = form.querySelectorAll('input[type="password"]');
      const usernameFields = form.querySelectorAll('input[type="email"], input[type="text"], input[name*="user"], input[name*="email"]');
      
      if (passwordFields.length > 0) {
        const password = passwordFields[0].value;
        const username = usernameFields.length > 0 ? usernameFields[0].value : '';
        
        if (password && password.length >= 6) {
          // Offer to save password
          setTimeout(() => {
            if (confirm('Save this password in PrivacyX Pro?')) {
              browser.runtime.sendMessage({
                action: 'savePasswordPrompt',
                url: window.location.href,
                username: username,
                password: password,
                name: document.title || window.location.hostname
              });
            }
          }, 500);
        }
      }
    };
    
    form.addEventListener('submit', formSubmitHandler);
  });
}

// Run detection after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(detectFormSubmission, 1000);
  });
} else {
  setTimeout(detectFormSubmission, 1000);
}

// Re-detect on dynamic content changes
const observer = new MutationObserver((mutations) => {
  for (let mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      setTimeout(detectFormSubmission, 500);
      break;
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// ==========================================
// IDENTITY FORM FILLING
// ==========================================

// Listen for identity fill requests
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillFormsWithIdentity' && message.identity) {
    fillFormsWithIdentity(message.identity);
    sendResponse({ status: 'filled' });
  }
});

function fillFormsWithIdentity(identity) {
  // Map of common form field patterns and their corresponding identity data
  const fieldMappings = [
    // Name fields
    { patterns: ['name', 'fullname', 'full_name', 'username'], value: identity.fullName },
    { patterns: ['firstname', 'first_name', 'fname'], value: identity.firstName },
    { patterns: ['lastname', 'last_name', 'lname', 'surname'], value: identity.lastName },
    
    // Personal info
    { patterns: ['email', 'e-mail'], value: '' }, // Email laissé vide
    { patterns: ['phone', 'telephone', 'mobile', 'cellphone'], value: identity.phoneNumber },
    { patterns: ['birth', 'birthdate', 'birth_date', 'dob'], value: identity.birthDate },
    { patterns: ['age'], value: identity.age.toString() },
    
    // Address fields
    { patterns: ['address', 'street', 'street_address'], value: identity.streetAddress },
    { patterns: ['city', 'town'], value: identity.city },
    { patterns: ['state', 'province', 'region'], value: identity.state },
    { patterns: ['zip', 'postal', 'postcode', 'zipcode'], value: identity.postalCode },
    { patterns: ['country'], value: getCountryData(identity.country).name },
    
    // Login fields
    { patterns: ['user', 'login', 'account'], value: identity.username },
    { patterns: ['pass', 'pwd', 'password'], value: identity.password }
  ];

  // Fill all input fields
  const inputs = document.querySelectorAll('input[type="text"], input[type="tel"], input[type="number"], input[type="password"]');
  
  inputs.forEach(input => {
    const fieldName = (input.name || input.id || input.placeholder || '').toLowerCase();
    
    for (const mapping of fieldMappings) {
      if (mapping.patterns.some(pattern => fieldName.includes(pattern))) {
        input.value = mapping.value;
        
        // Trigger events to simulate user input
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  });

  // Fill select fields
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    const fieldName = (select.name || select.id || '').toLowerCase();
    
    // Country select
    if (fieldName.includes('country')) {
      const countryName = getCountryData(identity.country).name;
      for (let option of select.options) {
        if (option.text.toLowerCase().includes(countryName.toLowerCase()) || 
            option.value.toLowerCase().includes(identity.country)) {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    }
    
    // Gender select
    if (fieldName.includes('gender') || fieldName.includes('sex')) {
      const genderValue = identity.gender.charAt(0).toUpperCase();
      for (let option of select.options) {
        if (option.text.toLowerCase().includes(identity.gender) || 
            option.value.toLowerCase().includes(identity.gender) ||
            option.text.toLowerCase().includes(genderValue.toLowerCase())) {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    }
  });

  showNotification('Forms filled with generated identity!', 'success');
}

function getCountryData(countryCode) {
  const countries = {
    us: { name: 'United States' },
    fr: { name: 'France' },
    de: { name: 'Germany' },
    uk: { name: 'United Kingdom' },
    ca: { name: 'Canada' },
    au: { name: 'Australia' },
    jp: { name: 'Japan' },
    br: { name: 'Brazil' },
    in: { name: 'India' },
    cn: { name: 'China' }
  };
  return countries[countryCode] || countries.us;
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4caf50' : '#44aaff'};
    color: white;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    animation: slideInRight 0.3s ease-out;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// CSS animations for notification
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
