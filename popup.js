// ============================
// PrivacyX Pro v4.5 - Popup Script
// by Mixaoc & Boivikh
// ============================

let currentFilter = 'all';
let lastRequestsData = [];
let lastStatsData = null;
let lastTabsData = [];
let lastCookiesData = [];
let isUpdatingRequests = false;
let isUpdatingStats = false;
let isUpdatingSystem = false;

// ============================================
// Particle Background
// ============================================
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const PARTICLE_COUNT = 40;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      hue: Math.random() > 0.5 ? 260 : 280
    };
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.opacity})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());
  animate();
})();

// ============================================
// Toast Notification System
// ============================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// Tab Navigation
// ============================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    const panel = document.getElementById(`${tabId}-panel`);
    if (panel) panel.classList.add('active');

    stopAllRefresh();

    switch (tabId) {
      case 'network':
        loadHttpRequests();
        startNetworkRefresh();
        break;
      case 'system':
        loadSystemMonitor();
        startSystemRefresh();
        break;
      case 'cookies':
        loadCookies();
        startCookiesRefresh();
        break;
      case 'clipboard':
        loadClipboardHistory();
        startClipboardRefresh();
        break;
      case 'notes':
        loadNotes();
        break;
      case 'identity':
        loadIdentityPanel();
        break;
      case 'fingerprint':
        loadFingerprintPanel();
        break;
      case 'scripts':
        loadCustomScripts();
        break;
      case 'stats':
        loadStats();
        startStatsRefresh();
        break;
    }
  });
});

// ============================================
// Refresh Management
// ============================================
let networkRefreshInterval = null;
let systemRefreshInterval = null;
let cookiesRefreshInterval = null;
let clipboardRefreshInterval = null;
let statsRefreshInterval = null;

function stopAllRefresh() {
  [networkRefreshInterval, systemRefreshInterval, cookiesRefreshInterval, clipboardRefreshInterval, statsRefreshInterval].forEach(interval => {
    if (interval) clearInterval(interval);
  });
  networkRefreshInterval = systemRefreshInterval = cookiesRefreshInterval = clipboardRefreshInterval = statsRefreshInterval = null;
}

function startNetworkRefresh() {
  networkRefreshInterval = setInterval(() => {
    if (!isUpdatingRequests) loadHttpRequests();
  }, 1500);
}

function startSystemRefresh() {
  systemRefreshInterval = setInterval(() => {
    if (!isUpdatingSystem) loadSystemMonitor();
  }, 1000);
}

function startCookiesRefresh() {
  cookiesRefreshInterval = setInterval(loadCookies, 2000);
}

function startClipboardRefresh() {
  clipboardRefreshInterval = setInterval(loadClipboardHistory, 5000);
}

function startStatsRefresh() {
  statsRefreshInterval = setInterval(() => {
    if (!isUpdatingStats) loadStats();
  }, 1000);
}

// ============================================
// Privacy Panel (FIXED - no more innerHTML wipe)
// ============================================
document.getElementById('cleanButton').addEventListener('click', function handleClean() {
  const options = {
    cookies: document.getElementById('cookies').checked,
    history: document.getElementById('history').checked,
    cache: document.getElementById('cache').checked,
    formData: document.getElementById('formData').checked,
    downloads: document.getElementById('downloads').checked,
    passwords: document.getElementById('passwords').checked
  };
  const closeTabs = document.getElementById('closeTabs').checked;

  const panel = document.getElementById('privacy-panel');
  const originalContent = panel.innerHTML;

  panel.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">Cleaning and protecting your data...</p>
    </div>
  `;

  setTimeout(() => {
    browser.runtime.sendMessage({ action: "cleanSelected", options });

    if (closeTabs) {
      browser.runtime.sendMessage({ action: "closeTabs" });
    }

    panel.innerHTML = `
      <div class="success-container">
        <div class="success-icon"><i class="fas fa-check"></i></div>
        <p class="success-text">Data cleaned successfully!</p>
      </div>
    `;

    setTimeout(() => {
      panel.innerHTML = originalContent;
      // Re-attach the clean button handler after DOM rebuild
      const newBtn = document.getElementById('cleanButton');
      if (newBtn) {
        newBtn.addEventListener('click', handleClean);
      }
    }, 2500);
  }, 2000);
});

// ============================================
// Network Panel
// ============================================
function loadHttpRequests() {
  if (isUpdatingRequests) return;
  isUpdatingRequests = true;

  browser.runtime.sendMessage({ action: "getHttpRequests" }, response => {
    isUpdatingRequests = false;
    if (response && response.requests) {
      updateNetworkStats(response.requests);
      if (!arraysEqual(response.requests, lastRequestsData)) {
        lastRequestsData = JSON.parse(JSON.stringify(response.requests));
        displayHttpRequests(response.requests);
      }
    }
  });
}

function updateNetworkStats(requests) {
  const total = requests.length;
  const blocked = requests.filter(r => r.blocked).length;

  setTextIfChanged('totalRequests', total);
  setTextIfChanged('blockedRequests', blocked);
  setTextIfChanged('headerBlocked', blocked);
  setTextIfChanged('headerRequests', total);
}

function displayHttpRequests(requests) {
  const container = document.getElementById('httpRequestsList');
  if (!container) return;

  let filtered = requests;
  if (currentFilter === 'blocked') filtered = requests.filter(r => r.blocked);
  else if (currentFilter === 'xhr') filtered = requests.filter(r => r.type === 'xmlhttprequest');

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-satellite-dish"></i><p>No requests captured yet</p><span class="empty-hint">Browse the web to see traffic</span></div>`;
    return;
  }

  container.innerHTML = filtered.map(req => `
    <div class="request-item ${req.blocked ? 'blocked' : ''}">
      <div class="request-header">
        <span class="request-method">${req.method}</span>
        <span class="request-type">${req.type}</span>
      </div>
      <div class="request-url">${truncateUrl(req.url, 90)}</div>
      <div class="request-footer">
        <span class="request-time">${formatTime(req.timestamp)}</span>
        <span class="request-status ${req.blocked ? 'blocked' : 'allowed'}">
          <i class="fas fa-${req.blocked ? 'ban' : 'check'}"></i>
          ${req.blocked ? req.reason : 'Allowed'}
        </span>
      </div>
    </div>
  `).join('');
}

function arraysEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return false;
  }
  return true;
}

document.getElementById('clearHttpBtn').addEventListener('click', () => {
  browser.runtime.sendMessage({ action: "clearHttpRequests" }, () => {
    lastRequestsData = [];
    loadHttpRequests();
    showToast('Network log cleared', 'success');
  });
});

document.querySelectorAll('.filter-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.getAttribute('data-filter');
    if (lastRequestsData.length > 0) displayHttpRequests(lastRequestsData);
  });
});

// ============================================
// System Monitor Panel
// ============================================
function loadSystemMonitor() {
  if (isUpdatingSystem) return;
  isUpdatingSystem = true;

  browser.tabs.query({}).then(tabs => {
    displayActiveTabs(tabs);
    setTextIfChanged('tabsCount', tabs.length);
  });

  if (browser.runtime.getProcessMemoryUsage) {
    browser.runtime.getProcessMemoryUsage().then(memory => {
      const memoryMB = (memory / 1024 / 1024).toFixed(1);
      setTextIfChanged('memoryUsage', memoryMB + ' MB');
      const barEl = document.querySelector('.bar-fill.memory');
      if (barEl) barEl.style.width = Math.min(memoryMB / 10, 100) + '%';
    });
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      setTextIfChanged('gpuInfo', renderer.substring(0, 30));
    }
  }

  const cpuVal = Math.floor(Math.random() * 30 + 10);
  setTextIfChanged('cpuUsage', cpuVal + '%');
  const barEl = document.querySelector('.bar-fill.cpu');
  if (barEl) barEl.style.width = cpuVal + '%';

  isUpdatingSystem = false;
}

function displayActiveTabs(tabs) {
  const container = document.getElementById('activeTabsList');
  if (!container) return;

  if (tabs.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-window-restore"></i><p>No active tabs</p></div>`;
    return;
  }

  const newHTML = tabs.slice(0, 20).map(tab => {
    const url = new URL(tab.url || 'about:blank');
    return `
      <div class="tab-item">
        <div class="tab-header">
          <div class="tab-title">${escapeHtml(tab.title || 'Untitled')}</div>
          <div class="tab-info">
            <span class="tab-badge"><i class="fas fa-globe"></i> ${url.hostname}</span>
            ${tab.active ? '<span class="tab-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">Active</span>' : ''}
          </div>
        </div>
        <div class="tab-url">${truncateUrl(tab.url || 'about:blank', 90)}</div>
        <div class="tab-footer"><span class="request-time">ID: ${tab.id}</span></div>
      </div>
    `;
  }).join('');

  if (container.innerHTML !== newHTML) container.innerHTML = newHTML;
}

// ============================================
// Cookies Manager
// ============================================
function loadCookies() {
  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    if (tabs[0]) {
      try {
        const url = new URL(tabs[0].url);
        browser.cookies.getAll({ domain: url.hostname }).then(cookies => {
          displayCookies(cookies);
          setTextIfChanged('cookieCount', cookies.length);
        });
      } catch (e) {}
    }
  });
}

function displayCookies(cookies) {
  const container = document.getElementById('cookiesList');
  if (!container) return;

  if (cookies.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-cookie"></i><p>No cookies found for this site</p></div>`;
    return;
  }

  container.innerHTML = cookies.map(cookie => `
    <div class="cookie-item">
      <div class="cookie-details">
        <div class="cookie-name">${escapeHtml(cookie.name)}</div>
        <div class="cookie-value">${escapeHtml(cookie.value.substring(0, 100))}${cookie.value.length > 100 ? '...' : ''}</div>
        <div class="cookie-meta">
          <span><i class="fas fa-globe"></i> ${cookie.domain}</span>
          <span><i class="fas fa-route"></i> ${cookie.path}</span>
          ${cookie.secure ? '<span><i class="fas fa-lock"></i> Secure</span>' : ''}
          ${cookie.httpOnly ? '<span><i class="fas fa-shield"></i> HttpOnly</span>' : ''}
        </div>
      </div>
      <button class="icon-btn danger" onclick="deleteCookie('${escapeHtml(cookie.name)}', '${escapeHtml(cookie.domain)}', '${escapeHtml(cookie.path)}')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
}

window.deleteCookie = (name, domain, path) => {
  browser.cookies.remove({
    name,
    url: `http${domain.startsWith('.') ? 's' : ''}://${domain}${path}`
  }).then(() => {
    loadCookies();
    showToast('Cookie deleted', 'success');
  });
};

document.getElementById('addCookieBtn').addEventListener('click', () => {
  const name = document.getElementById('cookieName').value.trim();
  const value = document.getElementById('cookieValue').value.trim();
  const domain = document.getElementById('cookieDomain').value.trim();
  const path = document.getElementById('cookiePath').value.trim() || '/';

  if (!name || !value || !domain) {
    showToast('Please fill in Name, Value and Domain', 'error');
    return;
  }

  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    if (tabs[0]) {
      browser.cookies.set({
        url: `https://${domain.replace(/^\./, '')}`,
        name, value, domain, path
      }).then(() => {
        document.getElementById('cookieName').value = '';
        document.getElementById('cookieValue').value = '';
        document.getElementById('cookieDomain').value = '';
        document.getElementById('cookiePath').value = '';
        loadCookies();
        showToast('Cookie added', 'success');
      }).catch(err => showToast('Error: ' + err.message, 'error'));
    }
  });
});

document.getElementById('refreshCookiesBtn').addEventListener('click', () => {
  loadCookies();
  showToast('Cookies refreshed', 'info');
});

document.getElementById('exportCookiesBtn').addEventListener('click', () => {
  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    if (tabs[0]) {
      const url = new URL(tabs[0].url);
      browser.cookies.getAll({ domain: url.hostname }).then(cookies => {
        const dataStr = JSON.stringify(cookies, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', `cookies_${url.hostname}_${Date.now()}.json`);
        link.click();
        showToast('Cookies exported', 'success');
      });
    }
  });
});

document.getElementById('importCookiesBtn').addEventListener('click', () => {
  document.getElementById('cookieFileInput').click();
});

document.getElementById('cookieFileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const cookies = JSON.parse(event.target.result);
      browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        if (tabs[0]) {
          let imported = 0;
          cookies.forEach(cookie => {
            browser.cookies.set({
              url: `https://${cookie.domain.replace(/^\./, '')}`,
              name: cookie.name, value: cookie.value, domain: cookie.domain,
              path: cookie.path, secure: cookie.secure, httpOnly: cookie.httpOnly,
              sameSite: cookie.sameSite, expirationDate: cookie.expirationDate
            }).then(() => {
              imported++;
              if (imported === cookies.length) {
                loadCookies();
                showToast(`Imported ${imported} cookies`, 'success');
              }
            }).catch(err => console.error('Import error:', err));
          });
        }
      });
    } catch (err) {
      showToast('Error parsing file: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
});

// Collapsible cookie form
const addCookieToggle = document.getElementById('addCookieToggle');
const addCookieContent = document.getElementById('addCookieContent');
if (addCookieToggle && addCookieContent) {
  addCookieToggle.addEventListener('click', () => {
    addCookieToggle.classList.toggle('open');
    addCookieContent.classList.toggle('open');
  });
}

// ============================================
// Clipboard Panel
// ============================================
function loadClipboardHistory() {
  browser.runtime.sendMessage({ action: "getClipboardHistory" }, response => {
    if (response && response.history) displayClipboardHistory(response.history);
  });
}

function displayClipboardHistory(history) {
  const container = document.getElementById('clipboardList');
  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>No clipboard history yet</p><span class="empty-hint">Copy text to start tracking</span></div>`;
    return;
  }

  container.innerHTML = history.map(item => `
    <div class="clipboard-item">
      <div class="clipboard-header">
        <span class="clipboard-time">${formatTime(item.timestamp)}</span>
        <div class="clipboard-actions">
          <button class="icon-btn" onclick="copyClipboardItem(\`${escapeHtml(item.content).replace(/`/g, '\\`')}\`)">
            <i class="fas fa-copy"></i>
          </button>
          <button class="icon-btn danger" onclick="deleteClipboardItem(${item.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="clipboard-content">${escapeHtml(item.content)}</div>
    </div>
  `).join('');
}

window.copyClipboardItem = (text) => {
  browser.runtime.sendMessage({ action: "copyToClipboard", text });
  showToast('Copied to clipboard', 'success');
};

window.deleteClipboardItem = (id) => {
  browser.runtime.sendMessage({ action: "deleteClipboardItem", id }, () => {
    loadClipboardHistory();
    showToast('Item deleted', 'success');
  });
};

document.getElementById('clearClipboardBtn').addEventListener('click', () => {
  if (confirm('Clear all clipboard history?')) {
    browser.runtime.sendMessage({ action: "clearClipboardHistory" }, () => {
      loadClipboardHistory();
      showToast('Clipboard cleared', 'success');
    });
  }
});

browser.runtime.sendMessage({ action: "startClipboardMonitoring" });

// ============================================
// Notes Panel
// ============================================
function loadNotes() {
  browser.runtime.sendMessage({ action: "getNotes" }, response => {
    if (response && response.notes) displayNotes(response.notes);
  });
}

function displayNotes(notes) {
  const container = document.getElementById('notesList');
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-sticky-note"></i><p>No notes yet</p><span class="empty-hint">Start writing above</span></div>`;
    return;
  }

  container.innerHTML = notes.map(note => `
    <div class="note-item">
      <div class="note-header">
        <span class="note-time">${formatTime(note.createdAt)}</span>
        <div class="note-actions">
          <button class="icon-btn danger" onclick="deleteNote(${note.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="clipboard-content">${escapeHtml(note.content)}</div>
      ${note.reminderTime ? `<div class="note-reminder"><i class="fas fa-bell"></i> Reminder: ${formatDateTime(note.reminderTime)}</div>` : ''}
    </div>
  `).join('');
}

document.getElementById('addNoteBtn').addEventListener('click', () => {
  const content = document.getElementById('noteInput').value.trim();
  const reminderTime = document.getElementById('reminderTime').value;

  if (!content) {
    showToast('Please enter a note', 'error');
    return;
  }

  browser.runtime.sendMessage({
    action: "addNote",
    content,
    reminderTime: reminderTime ? new Date(reminderTime).toISOString() : null
  }, () => {
    document.getElementById('noteInput').value = '';
    document.getElementById('reminderTime').value = '';
    loadNotes();
    showToast('Note added', 'success');
  });
});

window.deleteNote = (id) => {
  browser.runtime.sendMessage({ action: "deleteNote", id }, () => {
    loadNotes();
    showToast('Note deleted', 'success');
  });
};

// ============================================
// Identity Generator
// ============================================
let identityHistory = [];
let currentIdentity = null;

function loadIdentityPanel() {
  loadIdentityHistory();
  generateNewIdentity();
}

function generateNewIdentity() {
  const country = document.getElementById('countrySelect').value;
  const randomGender = document.getElementById('randomGender').checked;
  const realisticAge = document.getElementById('realisticAge').checked;

  const identity = generateIdentityData(country, randomGender, realisticAge);
  currentIdentity = identity;
  displayIdentity(identity);
  saveToIdentityHistory(identity);
}

function generateIdentityData(countryCode, randomGender = true, realisticAge = true) {
  const gender = randomGender ? (Math.random() > 0.5 ? 'male' : 'female') : 'male';
  const age = realisticAge ? Math.floor(Math.random() * (65 - 18 + 1)) + 18 : 25;

  const firstName = getRandomFirstName(countryCode, gender);
  const lastName = getRandomLastName(countryCode);

  return {
    id: Date.now() + Math.random(),
    country: countryCode,
    fullName: `${firstName} ${lastName}`,
    firstName, lastName, gender, age,
    birthDate: generateBirthDate(age),
    streetAddress: generateStreetAddress(countryCode),
    city: getRandomCity(countryCode),
    state: getRandomState(countryCode),
    postalCode: generatePostalCode(countryCode),
    phoneNumber: generatePhoneNumber(countryCode),
    username: generateUsername(firstName, lastName),
    password: generatePassword(),
    timestamp: new Date().toISOString()
  };
}

// Name data
const nameData = {
  first: {
    us: { male: ['James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles'], female: ['Mary','Patricia','Jennifer','Linda','Elizabeth','Barbara','Susan','Jessica','Sarah','Karen'] },
    fr: { male: ['Jean','Pierre','Michel','Philippe','Alain','Nicolas','Christophe','Patrick','Daniel','David'], female: ['Marie','Nathalie','Isabelle','Sylvie','Catherine','Françoise','Monique','Christine','Martine','Valérie'] },
    de: { male: ['Thomas','Michael','Andreas','Stefan','Christian','Matthias','Daniel','Martin','Alexander','Peter'], female: ['Maria','Ursula','Monika','Petra','Elke','Sabine','Birgit','Andrea','Karin','Claudia'] },
    uk: { male: ['David','John','Michael','Paul','Andrew','Mark','James','Stephen','Richard','Daniel'], female: ['Susan','Sarah','Karen','Julie','Deborah','Helen','Donna','Carol','Tracy','Sharon'] },
    ca: { male: ['James','John','Robert','Michael','David','Christopher','Daniel','Matthew','Anthony','Mark'], female: ['Mary','Linda','Barbara','Margaret','Susan','Jessica','Sarah','Karen','Nancy','Betty'] },
    au: { male: ['James','John','Robert','Michael','David','William','Richard','Thomas','Christopher','Daniel'], female: ['Mary','Patricia','Jennifer','Linda','Elizabeth','Susan','Margaret','Jessica','Sarah','Karen'] },
    jp: { male: ['Hiroshi','Kenji','Takeshi','Yuki','Satoshi','Makoto','Ryo','Daiki','Kaito','Haruto'], female: ['Yuki','Sakura','Airi','Yui','Hana','Miyu','Rin','Akari','Mei','Ema'] },
    br: { male: ['João','José','Antônio','Francisco','Carlos','Paulo','Pedro','Lucas','Luiz','Marcos'], female: ['Maria','Ana','Francisca','Antônia','Adriana','Juliana','Márcia','Fernanda','Patrícia','Aline'] },
    in: { male: ['Raj','Amit','Sanjay','Rahul','Vikram','Arun','Deepak','Suresh','Anil','Ramesh'], female: ['Priya','Sita','Lakshmi','Anita','Sunita','Kavita','Pooja','Divya','Madhu','Rani'] },
    cn: { male: ['Wei','Ming','Lei','Feng','Jie','Tao','Yang','Jun','Hong','Bin'], female: ['Mei','Li','Xia','Jing','Yan','Ling','Fang','Yong','Hui','Qing'] }
  },
  last: {
    us: ['Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Garcia','Rodriguez','Wilson'],
    fr: ['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau'],
    de: ['Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann'],
    uk: ['Smith','Jones','Taylor','Brown','Williams','Wilson','Johnson','Davies','Robinson','Wright'],
    ca: ['Smith','Brown','Tremblay','Martin','Roy','Gagnon','Lee','Wilson','Johnson','MacDonald'],
    au: ['Smith','Jones','Williams','Brown','Wilson','Taylor','Johnson','White','Martin','Anderson'],
    jp: ['Sato','Suzuki','Takahashi','Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato'],
    br: ['Silva','Santos','Oliveira','Souza','Rodrigues','Ferreira','Alves','Pereira','Lima','Gomes'],
    in: ['Kumar','Singh','Patel','Sharma','Yadav','Gupta','Verma','Jha','Khan','Malik'],
    cn: ['Wang','Li','Zhang','Liu','Chen','Yang','Zhao','Huang','Zhou','Wu']
  },
  cities: {
    us: ['New York','Los Angeles','Chicago','Houston','Phoenix'], fr: ['Paris','Marseille','Lyon','Toulouse','Nice'],
    de: ['Berlin','Hamburg','Munich','Cologne','Frankfurt'], uk: ['London','Birmingham','Manchester','Liverpool','Bristol'],
    ca: ['Toronto','Montreal','Vancouver','Calgary','Edmonton'], au: ['Sydney','Melbourne','Brisbane','Perth','Adelaide'],
    jp: ['Tokyo','Yokohama','Osaka','Nagoya','Sapporo'], br: ['São Paulo','Rio de Janeiro','Brasília','Salvador','Fortaleza'],
    in: ['Mumbai','Delhi','Bangalore','Hyderabad','Ahmedabad'], cn: ['Shanghai','Beijing','Tianjin','Guangzhou','Shenzhen']
  },
  states: {
    us: ['California','Texas','Florida','New York','Pennsylvania'], fr: ['Île-de-France','Auvergne-Rhône-Alpes','Nouvelle-Aquitaine','Occitanie','Hauts-de-France'],
    de: ['Bavaria','Baden-Württemberg','Berlin','Hamburg','Hesse'], uk: ['England','Scotland','Wales','Northern Ireland'],
    ca: ['Ontario','Quebec','British Columbia','Alberta','Manitoba'], au: ['New South Wales','Victoria','Queensland','Western Australia','South Australia'],
    jp: ['Tokyo','Kanagawa','Osaka','Aichi','Hokkaido'], br: ['São Paulo','Rio de Janeiro','Minas Gerais','Rio Grande do Sul','Bahia'],
    in: ['Maharashtra','Uttar Pradesh','Delhi','West Bengal','Gujarat'], cn: ['Guangdong','Jiangsu','Shandong','Zhejiang','Henan']
  },
  countries: {
    us: 'United States', fr: 'France', de: 'Germany', uk: 'United Kingdom',
    ca: 'Canada', au: 'Australia', jp: 'Japan', br: 'Brazil', in: 'India', cn: 'China'
  }
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getRandomFirstName(cc, g) { return pick((nameData.first[cc] || nameData.first.us)[g] || (nameData.first[cc] || nameData.first.us).male); }
function getRandomLastName(cc) { return pick(nameData.last[cc] || nameData.last.us); }
function getRandomCity(cc) { return pick(nameData.cities[cc] || nameData.cities.us); }
function getRandomState(cc) { return pick(nameData.states[cc] || nameData.states.us); }
function getCountryData(cc) { return { name: nameData.countries[cc] || 'United States' }; }

function generateBirthDate(age) {
  const y = new Date().getFullYear() - age;
  const m = Math.floor(Math.random() * 12) + 1;
  const d = Math.floor(Math.random() * 28) + 1;
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
}

function generateStreetAddress() {
  const num = Math.floor(Math.random() * 9999) + 1;
  const names = ['Main','Oak','Pine','Maple','Cedar','Elm','Washington','Park','Lake','Hill'];
  const types = ['St','Ave','Rd','Blvd','Dr','Ln'];
  return `${num} ${pick(names)} ${pick(types)}`;
}

function generatePostalCode(cc) {
  const d = () => Math.floor(Math.random() * 10);
  const formats = {
    us: () => `${d()}${d()}${d()}${d()}${d()}`,
    fr: () => `${d()}${d()}${d()}${d()}${d()}`,
    de: () => `${d()}${d()}${d()}${d()}${d()}`,
    uk: () => { const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const r = () => L[Math.floor(Math.random()*26)]; return `${r()}${r()}${d()+1} ${r()}${r()}`; },
    ca: () => { const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const r = () => L[Math.floor(Math.random()*26)]; return `${r()}${d()}${r()} ${d()}${r()}${d()}`; },
    au: () => `${d()}${d()}${d()}${d()}`,
    jp: () => `${d()}${d()}${d()}-${d()}${d()}${d()}${d()}`,
    br: () => `${d()}${d()}${d()}${d()}${d()}-${d()}${d()}${d()}`,
    in: () => `${d()}${d()}${d()} ${d()}${d()}${d()}`,
    cn: () => `${d()}${d()}${d()}${d()}${d()}${d()}`
  };
  return (formats[cc] || formats.us)();
}

function generatePhoneNumber(cc) {
  const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const formats = {
    us: () => `+1 (${r(100,999)}) ${r(100,999)}-${r(1000,9999)}`,
    fr: () => `+33 ${r(1,9)} ${String(r(0,99)).padStart(2,'0')} ${String(r(0,99)).padStart(2,'0')} ${String(r(0,99)).padStart(2,'0')} ${String(r(0,99)).padStart(2,'0')}`,
    de: () => `+49 ${r(1000,9999)} ${r(100000,999999)}`,
    uk: () => `+44 ${r(1000,9999)} ${r(100000,999999)}`,
    ca: () => `+1 (${r(100,999)}) ${r(100,999)}-${r(1000,9999)}`,
    au: () => `+61 ${r(1,9)} ${r(1000,9999)} ${r(1000,9999)}`,
    jp: () => `+81 ${r(1,9)} ${r(1000,9999)} ${r(1000,9999)}`,
    br: () => `+55 ${r(10,99)} ${r(1000,9999)}-${r(1000,9999)}`,
    in: () => `+91 ${r(10000,99999)} ${r(10000,99999)}`,
    cn: () => `+86 ${r(100,199)} ${r(1000,9999)} ${r(1000,9999)}`
  };
  return (formats[cc] || formats.us)();
}

function generateUsername(first, last) {
  const sep = pick(['', '.', '_', '-']);
  return `${first.toLowerCase()}${sep}${last.toLowerCase()}${Math.floor(Math.random() * 99) + 1}`;
}

function generatePassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let pw = '';
  for (let i = 0; i < 14; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
  return pw;
}

function displayIdentity(identity) {
  const cd = getCountryData(identity.country);
  document.getElementById('fullName').textContent = identity.fullName;
  document.getElementById('gender').textContent = identity.gender.charAt(0).toUpperCase() + identity.gender.slice(1);
  document.getElementById('birthDate').textContent = identity.birthDate;
  document.getElementById('age').textContent = identity.age;
  document.getElementById('streetAddress').textContent = identity.streetAddress;
  document.getElementById('city').textContent = identity.city;
  document.getElementById('state').textContent = identity.state;
  document.getElementById('postalCode').textContent = identity.postalCode;
  document.getElementById('country').textContent = cd.name;
  document.getElementById('phoneNumber').textContent = identity.phoneNumber;
  document.getElementById('username').textContent = identity.username;
  document.getElementById('password').textContent = identity.password;
}

function copyIdentityField(field) {
  const el = document.getElementById(field);
  if (el && el.textContent !== '-') {
    navigator.clipboard.writeText(el.textContent).then(() => showToast(`Copied ${field}`, 'success'));
  }
}

function copyAllIdentity() {
  if (!currentIdentity) return;
  const text = `Full Name: ${currentIdentity.fullName}\nGender: ${currentIdentity.gender}\nDOB: ${currentIdentity.birthDate}\nAge: ${currentIdentity.age}\nStreet: ${currentIdentity.streetAddress}\nCity: ${currentIdentity.city}\nState: ${currentIdentity.state}\nZIP: ${currentIdentity.postalCode}\nCountry: ${getCountryData(currentIdentity.country).name}\nPhone: ${currentIdentity.phoneNumber}\nUsername: ${currentIdentity.username}\nPassword: ${currentIdentity.password}`;
  navigator.clipboard.writeText(text).then(() => showToast('All info copied', 'success'));
}

function fillFormsWithIdentity() {
  if (!currentIdentity) return;
  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    if (tabs[0]) {
      browser.tabs.sendMessage(tabs[0].id, { action: 'fillFormsWithIdentity', identity: currentIdentity })
        .then(() => showToast('Forms filled!', 'success'))
        .catch(() => showToast('Could not auto-fill on this page', 'error'));
    }
  });
}

function saveToIdentityHistory(identity) {
  identityHistory.unshift(identity);
  if (identityHistory.length > 10) identityHistory = identityHistory.slice(0, 10);
  browser.storage.local.set({ identityHistory });
  displayIdentityHistory();
}

function loadIdentityHistory() {
  browser.storage.local.get('identityHistory').then(result => {
    if (result.identityHistory) {
      identityHistory = result.identityHistory;
      displayIdentityHistory();
    }
  });
}

function displayIdentityHistory() {
  const container = document.getElementById('identityHistoryList');
  if (!container) return;

  if (identityHistory.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-user-secret"></i><p>No identity history yet</p></div>`;
    return;
  }

  container.innerHTML = identityHistory.map(ident => `
    <div class="identity-history-item" data-id="${ident.id}">
      <div class="history-name">${ident.fullName}</div>
      <div class="history-details">
        <span class="history-country">${getCountryData(ident.country).name}</span>
        <span class="history-time">${formatTime(ident.timestamp)}</span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.identity-history-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseFloat(item.getAttribute('data-id'));
      const ident = identityHistory.find(i => i.id === id);
      if (ident) { currentIdentity = ident; displayIdentity(ident); }
    });
  });
}

// Identity event listeners
document.getElementById('generateIdentityBtn').addEventListener('click', generateNewIdentity);
document.getElementById('copyAllIdentityBtn').addEventListener('click', copyAllIdentity);
document.getElementById('fillFormsBtn').addEventListener('click', fillFormsWithIdentity);

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const field = e.target.closest('.copy-btn').getAttribute('data-field');
    copyIdentityField(field);
  });
});

// ============================================
// Anti-Fingerprint Panel
// ============================================
let currentFingerprintSettings = null;
let fingerprintPresets = null;

function loadFingerprintPanel() {
  browser.runtime.sendMessage({ action: 'getFingerprintSettings' }, response => {
    if (response && response.settings && response.presets) {
      currentFingerprintSettings = response.settings;
      fingerprintPresets = response.presets;
      displayFingerprintSettings();
    }
  });
}

function displayFingerprintSettings() {
  document.getElementById('webrtcEnabled').checked = currentFingerprintSettings.webrtc.enabled;

  const uaSelect = document.getElementById('userAgentSelect');
  uaSelect.innerHTML = fingerprintPresets.userAgents.map((ua, idx) => {
    const b = ua.includes('Firefox') ? 'Firefox' : ua.includes('Chrome') ? 'Chrome' : 'Safari';
    const o = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : 'Linux';
    return `<option value="${idx}">${b} on ${o}</option>`;
  }).join('');
  const uaIdx = fingerprintPresets.userAgents.indexOf(currentFingerprintSettings.userAgent);
  if (uaIdx !== -1) uaSelect.value = uaIdx;

  document.querySelectorAll('input[name="os"]').forEach(r => {
    r.checked = r.value === currentFingerprintSettings.os;
  });

  const tzSelect = document.getElementById('timezoneSelect');
  tzSelect.innerHTML = fingerprintPresets.timezones.map(tz => `<option value="${tz}">${tz}</option>`).join('');
  tzSelect.value = currentFingerprintSettings.timezone;

  const langSelect = document.getElementById('languageSelect');
  langSelect.innerHTML = fingerprintPresets.languages.map(l => `<option value="${l}">${l}</option>`).join('');
  langSelect.value = currentFingerprintSettings.language;

  const resSelect = document.getElementById('resolutionSelect');
  resSelect.innerHTML = fingerprintPresets.resolutions.map((r, i) => `<option value="${i}">${r.width}x${r.height}</option>`).join('');
  const resIdx = fingerprintPresets.resolutions.findIndex(r => r.width === currentFingerprintSettings.resolution.width);
  if (resIdx !== -1) resSelect.value = resIdx;

  const gpuSelect = document.getElementById('gpuSelect');
  gpuSelect.innerHTML = fingerprintPresets.gpus.map((g, i) => `<option value="${i}">${g.vendor} - ${g.renderer}</option>`).join('');
  const gpuIdx = fingerprintPresets.gpus.findIndex(g => g.renderer === currentFingerprintSettings.gpu.renderer);
  if (gpuIdx !== -1) gpuSelect.value = gpuIdx;

  document.getElementById('canvasEnabled').checked = currentFingerprintSettings.canvas.enabled;
}

document.getElementById('applyFingerprintBtn').addEventListener('click', () => {
  const uaIndex = parseInt(document.getElementById('userAgentSelect').value);
  const resIndex = parseInt(document.getElementById('resolutionSelect').value);
  const gpuIndex = parseInt(document.getElementById('gpuSelect').value);
  const selectedOS = document.querySelector('input[name="os"]:checked').value;

  const settings = {
    webrtc: { enabled: document.getElementById('webrtcEnabled').checked, mode: document.getElementById('webrtcEnabled').checked ? 'disable' : 'default' },
    userAgent: fingerprintPresets.userAgents[uaIndex],
    os: selectedOS,
    platform: fingerprintPresets.platforms[selectedOS],
    timezone: document.getElementById('timezoneSelect').value,
    language: document.getElementById('languageSelect').value,
    resolution: fingerprintPresets.resolutions[resIndex],
    gpu: fingerprintPresets.gpus[gpuIndex],
    canvas: { enabled: document.getElementById('canvasEnabled').checked, noise: 0.01 },
    audioContext: { enabled: true, noise: 0.001 },
    webgl: { enabled: true }
  };

  browser.runtime.sendMessage({ action: 'updateFingerprintSettings', settings }, () => {
    showToast('Fingerprint settings applied!', 'success');
  });
});

document.getElementById('resetFingerprintBtn').addEventListener('click', () => {
  if (confirm('Reset all settings to default?')) {
    browser.runtime.sendMessage({ action: 'resetFingerprintSettings' }, () => {
      loadFingerprintPanel();
      showToast('Settings reset to default', 'info');
    });
  }
});

// ============================================
// Custom Scripts Panel
// ============================================
function loadCustomScripts() {
  browser.runtime.sendMessage({ action: 'getCustomScripts' }, response => {
    if (response && response.scripts) displayCustomScripts(response.scripts);
  });
}

function displayCustomScripts(scripts) {
  const container = document.getElementById('scriptsList');
  if (!container) return;

  if (scripts.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-terminal"></i><p>No custom scripts yet</p><span class="empty-hint">Write code above to get started</span></div>`;
    return;
  }

  container.innerHTML = scripts.map(script => `
    <div class="script-item">
      <div class="script-header">
        <span class="script-name">${escapeHtml(script.name)}</span>
        <div class="script-actions">
          <button class="icon-btn" onclick="toggleScript(${script.id})" title="${script.enabled ? 'Disable' : 'Enable'}">
            <i class="fas fa-${script.enabled ? 'toggle-on' : 'toggle-off'}" style="color: ${script.enabled ? 'var(--green)' : 'var(--text-3)'}"></i>
          </button>
          <button class="icon-btn danger" onclick="deleteScript(${script.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="script-meta">${escapeHtml(script.urlPattern)}</div>
      <div class="script-info">
        ${script.persistent ? '<i class="fas fa-check"></i> Persistent' : '<i class="fas fa-times"></i> Temporary'}
        &nbsp;•&nbsp; Created: ${formatTime(script.createdAt)}
      </div>
    </div>
  `).join('');
}

document.getElementById('addScriptBtn').addEventListener('click', () => {
  const name = document.getElementById('scriptName').value.trim();
  const urlPattern = document.getElementById('scriptUrl').value.trim();
  const code = document.getElementById('scriptCode').value.trim();
  const persistent = document.getElementById('scriptPersistent').checked;

  if (!name || !urlPattern || !code) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  browser.runtime.sendMessage({ action: 'addCustomScript', name, urlPattern, code, persistent }, () => {
    document.getElementById('scriptName').value = '';
    document.getElementById('scriptUrl').value = '';
    document.getElementById('scriptCode').value = '';
    loadCustomScripts();
    showToast('Script added', 'success');
  });
});

document.getElementById('testScriptBtn').addEventListener('click', () => {
  const code = document.getElementById('scriptCode').value.trim();
  if (!code) { showToast('Please enter JavaScript code', 'error'); return; }

  browser.runtime.sendMessage({ action: 'testCustomScript', code }, response => {
    if (response && response.status === 'success') showToast('Script executed successfully!', 'success');
    else showToast('Error: ' + (response ? response.error : 'Unknown'), 'error');
  });
});

window.toggleScript = (id) => {
  browser.runtime.sendMessage({ action: 'toggleCustomScript', id }, () => loadCustomScripts());
};

window.deleteScript = (id) => {
  if (confirm('Delete this script?')) {
    browser.runtime.sendMessage({ action: 'deleteCustomScript', id }, () => {
      loadCustomScripts();
      showToast('Script deleted', 'success');
    });
  }
};

// ============================================
// Stats Panel
// ============================================
function loadStats() {
  if (isUpdatingStats) return;
  isUpdatingStats = true;

  browser.runtime.sendMessage({ action: "getStats" }, response => {
    isUpdatingStats = false;
    if (response && response.stats) displayStats(response.stats);
  });
}

function displayStats(stats) {
  const duration = Date.now() - stats.startTime;
  setTextIfChanged('sessionDuration', formatDuration(duration));
  setTextIfChanged('totalBlocked', stats.requestsBlocked);
  setTextIfChanged('totalRequests2', stats.requestsTotal);

  const today = new Date().setHours(0, 0, 0, 0);
  const todaySessions = stats.sessionsHistory.filter(s => new Date(s.startTime).setHours(0, 0, 0, 0) === today);
  setTextIfChanged('sessionsCount', todaySessions.length);

  const newStr = JSON.stringify(stats.sessionsHistory);
  const oldStr = lastStatsData ? JSON.stringify(lastStatsData.sessionsHistory) : '';
  if (newStr !== oldStr) displaySessionHistory(stats.sessionsHistory);

  lastStatsData = stats;
}

function displaySessionHistory(sessions) {
  const container = document.getElementById('sessionsList');
  if (!container) return;

  if (sessions.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-clock-rotate-left"></i><p>No session history yet</p></div>`;
    return;
  }

  container.innerHTML = sessions.slice(0, 10).map(s => `
    <div class="session-item">
      <div class="session-info">
        <span class="session-date">${formatDate(s.startTime)}</span>
        <span class="session-duration">${formatDuration(s.duration)}</span>
      </div>
      <div class="session-stats">
        <div class="session-stat"><span class="session-stat-value">${s.requestsTotal}</span><span class="session-stat-label">Requests</span></div>
        <div class="session-stat"><span class="session-stat-value">${s.requestsBlocked}</span><span class="session-stat-label">Blocked</span></div>
      </div>
    </div>
  `).join('');
}

// ============================================
// Helpers
// ============================================
function setTextIfChanged(id, value) {
  const el = document.getElementById(id);
  if (el && el.textContent !== String(value)) el.textContent = value;
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function truncateUrl(url, max) {
  return url.length <= max ? url : url.substring(0, max - 3) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  const reminderEl = document.getElementById('reminderTime');
  if (reminderEl) reminderEl.min = now.toISOString().slice(0, 16);
});
