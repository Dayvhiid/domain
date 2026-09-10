import { API } from './api-client.js';

// Make API globally available for backwards compatibility
window.MockAPI = API;
window.API = API;

// Auth state management - load from localStorage synchronously first
window.APP_USER = null;
try {
  const stored = localStorage.getItem('dp_user');
  if (stored) window.APP_USER = JSON.parse(stored);
} catch {}

async function checkAuthSession() {
  try {
    const result = await API.authApi.getMe();
    if (result?.user) {
      window.APP_USER = result.user;
      localStorage.setItem('dp_user', JSON.stringify(result.user));
    } else {
      window.APP_USER = null;
      localStorage.removeItem('dp_user');
    }
  } catch {
    // Network error — keep cached user, don't force logout
  }

  updateAuthUI();
}

function updateAuthUI() {
  const user = window.APP_USER;
  document.querySelectorAll('[data-auth-guest]').forEach(el => {
    el.style.display = user ? 'none' : '';
  });
  document.querySelectorAll('[data-auth-user]').forEach(el => {
    el.style.display = user ? '' : 'none';
  });
  document.querySelectorAll('[data-auth-name]').forEach(el => {
    el.textContent = user ? `${user.firstName} ${user.lastName}` : '';
  });
}

window.logout = async function() {
  try {
    await API.authApi.logout();
  } catch {}
  window.APP_USER = null;
  localStorage.removeItem('dp_user');
  window.toast('Logged out.', 'success');
  setTimeout(() => location.href = 'login.html', 300);
};

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initUI();
  initDomainSearch();
  initSearchResults();
  Cart.updateBadge();
  checkAuthSession();
  
  if (document.getElementById("pricing-table")) initPricing();
  if (document.getElementById("whois-root")) initWhois();
  if (document.getElementById("cart-root")) initCart();
  if (document.getElementById("transfer-form")) initTransfer();

  initReveal();
});

function initReveal() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

async function initPricing() {
  const search = document.getElementById("pricing-search");
  const filter = document.getElementById("pricing-category");
  const grid = document.getElementById("pricing-tbody");
  if (!grid) return;
  
  let data = [];
  
  try {
    data = await API.getPricing();
  } catch (err) {
    console.error('Failed to load pricing:', err);
    window.toast("Failed to load pricing data", "error");
    return;
  }
  
  function render() {
    const q = (search?.value || "").toLowerCase();
    const cat = filter?.value || "All";
    const filtered = data.filter(r => (cat === "All" || r.category === cat) && r.tld.toLowerCase().includes(q));
    
    grid.innerHTML = filtered.map(r => `
      <div class="ext-card">
        <div class="ext-card-top">
          <span class="ext-name">${r.tld}</span>
          <span class="ext-category">${r.category}</span>
        </div>
        <div class="ext-prices">
          <div class="ext-price-item">
            <span class="ext-price-label">Registration</span>
            <span class="ext-price-value">${formatPrice(r.registration)}/yr</span>
          </div>
          <div class="ext-price-item">
            <span class="ext-price-label">Renewal</span>
            <span class="ext-price-value">${formatPrice(r.renewal)}/yr</span>
          </div>
          <div class="ext-price-item">
            <span class="ext-price-label">Transfer</span>
            <span class="ext-price-value">${formatPrice(r.transfer)}</span>
          </div>
        </div>
        <a href="search-results.html?domain=example${r.tld}" class="ext-action">Check availability</a>
      </div>
    `).join("") || `<div class="ext-empty">No extensions match your filter.</div>`;
    
    document.getElementById("pricing-count").textContent = `${filtered.length} extensions`;
  }
  
  search?.addEventListener("input", render);
  filter?.addEventListener("change", render);
}

async function initWhois() {
  const form = document.getElementById("whois-form");
  const input = document.getElementById("whois-input");
  const out = document.getElementById("whois-result");
  const loading = document.getElementById("whois-loading");
  
  form?.addEventListener("submit", async e => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) { window.toast("Enter a domain", "error"); return; }
    
    loading.hidden = false;
    out.innerHTML = "";
    
    try {
      const res = await API.whoisLookup(v);
      
      if (res.available) {
        out.innerHTML = `<div class="card p-6 text-center">
          <div class="badge badge-success mb-3">Available</div>
          <p class="font-medium">${res.domain} is available!</p>
          <a href="search-results.html?domain=${encodeURIComponent(res.domain)}" class="btn btn-primary mt-4">Register now</a>
        </div>`;
      } else {
        out.innerHTML = `<div class="card p-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="badge badge-danger">Registered</span>
            <span class="font-mono font-medium">${res.domain}</span>
          </div>
          <dl class="grid sm:grid-cols-2 gap-4 text-subheadline">
            <div><dt class="text-tertiary-label">Registrar</dt><dd class="font-medium">${res.registrar}</dd></div>
            <div><dt class="text-tertiary-label">Created</dt><dd class="font-medium">${res.created}</dd></div>
            <div><dt class="text-tertiary-label">Expires</dt><dd class="font-medium">${res.expires}</dd></div>
            <div><dt class="text-tertiary-label">Privacy</dt><dd class="font-medium">${res.privacy ? "Enabled (redacted)" : "Disabled"}</dd></div>
          </dl>
          <p class="text-caption-1 text-quaternary-label mt-4">WHOIS data is shown with privacy — personal data redacted.</p>
        </div>`;
      }
    } catch (err) {
      out.innerHTML = `<div class="card p-6 border-danger/20 bg-danger/5 text-danger text-sm">${err.message}</div>`;
    } finally {
      loading.hidden = true;
    }
  });
}

function initCart() {
  const root = document.getElementById("cart-root");
  const emptyEl = document.getElementById("cart-empty");
  const listEl = document.getElementById("cart-list");
  const summaryEl = document.getElementById("cart-summary");
  
  function render() {
    const items = Cart.load();
    if (items.length === 0) {
      listEl.innerHTML = "";
      summaryEl.hidden = true;
      emptyEl.hidden = false;
      return;
    }
    
    emptyEl.hidden = true;
    summaryEl.hidden = false;
    
    listEl.innerHTML = items.map(it => `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:1.25rem;gap:1rem;border-bottom:1px solid rgba(255,255,255,0.04);">
        <div style="min-width:0;flex:1;">
          <div style="font-family:'JetBrains Mono',monospace;font-weight:600;font-size:.9375rem;color:#f4f4f5;">${it.domain}</div>
          <div style="font-size:.75rem;color:#52525b;margin-top:.25rem;">${formatPrice(it.registration)}/yr · Renewal ${formatPrice(it.renewal)}/yr</div>
          <div style="display:flex;align-items:center;gap:.75rem;margin-top:.75rem;flex-wrap:wrap;">
            <label style="display:flex;align-items:center;gap:.5rem;font-size:.8125rem;color:#a1a1aa;">Term
              <select data-cart-years="${it.id}" style="background:#18181b;border:1px solid #27272a;border-radius:.5rem;padding:6px 10px;font-size:.8125rem;color:#f4f4f5;font-family:inherit;cursor:pointer;min-height:36px;">
                ${[1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === it.years ? "selected" : ""}>${y} yr${y > 1 ? "s" : ""} — ${formatPrice(it.registration * y)}</option>`).join("")}
              </select>
            </label>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.5rem;flex-shrink:0;">
          <button data-remove="${it.id}" style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;border:none;background:transparent;color:#52525b;cursor:pointer;transition:all .15s;" title="Remove">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
          <div style="font-weight:700;color:#f4f4f5;font-variant-numeric:tabular-nums;white-space:nowrap;">${formatPrice(it.registration * it.years)}</div>
        </div>
      </div>
    `).join("");
    
    const subtotal = Cart.subtotal();
    const tax = 0;
    
    document.getElementById("cart-subtotal").textContent = formatPrice(subtotal);
    document.getElementById("cart-tax").textContent = formatPrice(tax);
    document.getElementById("cart-total").textContent = formatPrice(subtotal + tax);
    
    listEl.querySelectorAll("[data-cart-years]").forEach(sel => {
      sel.addEventListener("change", () => {
        Cart.updateYears(sel.getAttribute("data-cart-years"), sel.value);
        render();
      });
    });
    
    listEl.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        Cart.remove(btn.getAttribute("data-remove"));
        window.toast("Removed from cart.");
        render();
      });
    });
  }
  
  document.getElementById("cart-clear")?.addEventListener("click", () => {
    if (confirm("Clear cart?")) {
      Cart.clear();
      render();
    }
  });
  
  render();
}

function initTransfer() {
  const form = document.getElementById("transfer-form");
  form?.addEventListener("submit", async e => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    const btn = form.querySelector("button[type='submit']");
    btn.textContent = "Checking…";
    btn.disabled = true;
    
    try {
      await new Promise(r => setTimeout(r, 900));
      window.toast("Transfer eligibility checked. You will receive instructions by email.", "success");
    } catch (err) {
      window.toast(err.message, "error");
    } finally {
      btn.textContent = "Check transfer eligibility";
      btn.disabled = false;
    }
  });
}

function formatPrice(n) {
  return `R${Number(n).toFixed(2)}`;
}
