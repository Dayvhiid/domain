function initDomainSearch() {
  const forms = document.querySelectorAll("[data-domain-search-form]");
  forms.forEach(form => {
    const input = form.querySelector("input[type='search'], input[type='text']");
    const btn = form.querySelector("button[type='submit']");
    if (!input) return;
    
    form.addEventListener("submit", e => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) {
        input.focus();
        input.classList.add("input-error");
        window.toast("Enter a domain name to search.", "error");
        return;
      }
      if (!/^[a-z0-9.-]+$/i.test(val)) {
        window.toast("Domain can only contain letters, numbers, hyphens and dots.", "error");
        return;
      }
      if (val.length < 2) {
        window.toast("Domain too short.", "error");
        return;
      }
      if (btn) {
        btn.disabled = true;
        const orig = btn.innerHTML;
        btn.innerHTML = "Searching…";
        setTimeout(() => { btn.disabled = false; btn.innerHTML = orig; }, 400);
      }
      const target = form.dataset.target || "search-results.html";
      location.href = `${target}?domain=${encodeURIComponent(val.toLowerCase())}`;
    });
    
    input.addEventListener("input", () => input.classList.remove("input-error"));
  });
}

async function initSearchResults() {
  const container = document.getElementById("search-results-root");
  if (!container) return;
  
  const params = new URLSearchParams(location.search);
  let domain = params.get("domain") || "";
  const input = document.getElementById("results-search-input");
  const resultsEl = document.getElementById("results-container");
  const loadingEl = document.getElementById("results-loading");
  
  if (input) input.value = domain;
  
  if (!domain) {
    resultsEl && (resultsEl.innerHTML = `<div style="background:#121214;border:1px solid rgba(255,255,255,0.06);border-radius:1rem;padding:2rem;text-align:center;color:#71717a;">Enter a domain above to search.</div>`);
    return;
  }
  
  const form = document.getElementById("results-search-form");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      history.pushState(null, "", `?domain=${encodeURIComponent(v)}`);
      run(v);
    });
  }
  
  await run(domain);
  
  async function run(q) {
    loadingEl && (loadingEl.hidden = false);
    resultsEl && (resultsEl.innerHTML = "");
    
    try {
      const data = await window.API.searchDomain(q);
      render(data);
    } catch (err) {
      resultsEl.innerHTML = `<div style="background:#121214;border:1px solid rgba(239,68,68,0.2);border-radius:1rem;padding:1.5rem;color:#f87171;">${err.message || "Search failed."}</div>`;
    } finally {
      loadingEl && (loadingEl.hidden = true);
    }
  }
  
  function render(data) {
    const fmt = (n) => `R${Number(n).toFixed(2)}`;
    const primary = data.primary;
    const isAvailable = primary.status === "available" || primary.status === "premium";
    const isTaken = primary.status === "taken";
    
    let html = "";
    
    // ─── Primary Result Card ───────────────────────────────
    html += `<div style="background:#121214;border:1px solid rgba(255,255,255,0.06);border-radius:1rem;overflow:hidden;">`;
    html += `<div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem;">`;
    
    // Top row: domain + status + pricing
    html += `<div style="display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:1rem;">`;
    
    // Left: domain name + badges
    html += `<div style="min-width:0;">`;
    html += `<h1 style="font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:700;color:#f4f4f5;letter-spacing:-0.02em;word-break:break-all;">${primary.domain}</h1>`;
    html += `<div style="display:flex;align-items:center;gap:.5rem;margin-top:.625rem;flex-wrap:wrap;">`;
    
    if (isAvailable) {
      html += `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:9999px;font-size:.6875rem;font-weight:600;background:rgba(34,197,94,0.1);color:#4ade80;border:1px solid rgba(34,197,94,0.2);">Available</span>`;
    } else if (primary.status === "premium") {
      html += `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:9999px;font-size:.6875rem;font-weight:600;background:rgba(245,158,11,0.1);color:#fbbf24;border:1px solid rgba(245,158,11,0.2);">Premium</span>`;
    } else if (isTaken) {
      html += `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:9999px;font-size:.6875rem;font-weight:600;background:rgba(244,63,94,0.1);color:#fb7185;border:1px solid rgba(244,63,94,0.2);">Taken</span>`;
    } else {
      html += `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:9999px;font-size:.6875rem;font-weight:600;background:rgba(255,255,255,0.05);color:#71717a;border:1px solid rgba(255,255,255,0.08);">${primary.status}</span>`;
    }
    
    if (primary.premium) {
      html += `<span style="font-size:.6875rem;color:#fbbf24;background:rgba(245,158,11,0.1);padding:3px 10px;border-radius:9999px;">Premium pricing</span>`;
    }
    html += `</div></div>`;
    
    // Right: pricing (only for available)
    if (primary.registration > 0) {
      html += `<div style="text-align:right;flex-shrink:0;">`;
      html += `<div style="font-size:.75rem;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">Registration</div>`;
      html += `<div style="font-size:1.75rem;font-weight:700;color:#f4f4f5;margin-top:.125rem;">${fmt(primary.registration)}<span style="font-size:.875rem;font-weight:400;color:#71717a;">/yr</span></div>`;
      if (primary.renewal > 0) {
        html += `<div style="font-size:.75rem;color:#52525b;margin-top:.125rem;">Renewal ${fmt(primary.renewal)}/yr</div>`;
      }
      html += `</div>`;
    }
    
    html += `</div>`; // end top row
    
    // Action area
    if (isAvailable) {
      // Available: term selector + add to cart
      html += `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.06);">`;
      html += `<label style="display:flex;align-items:center;gap:.5rem;font-size:.875rem;color:#a1a1aa;">Term `;
      html += `<select data-term-select style="background:#09090b;border:1px solid #27272a;border-radius:.5rem;padding:6px 10px;font-size:.8125rem;color:#f4f4f5;font-family:inherit;cursor:pointer;">`;
      html += `<option value="1">1 year — ${fmt(primary.registration * 1)}</option>`;
      html += `<option value="2">2 years — ${fmt(primary.registration * 2)}</option>`;
      html += `<option value="3">3 years — ${fmt(primary.registration * 3)}</option>`;
      html += `<option value="5">5 years — ${fmt(primary.registration * 5)}</option>`;
      html += `<option value="10">10 years — ${fmt(primary.registration * 10)}</option>`;
      html += `</select></label>`;
      html += `<div style="flex:1;"></div>`;
      html += `<button data-add-cart style="display:inline-flex;align-items:center;justify-content:center;padding:10px 24px;border-radius:.5rem;font-size:.875rem;font-weight:600;color:#000;background:#22d3ee;border:none;cursor:pointer;font-family:inherit;box-shadow:0 0 12px rgba(6,182,212,0.2);transition:all .15s;white-space:nowrap;">${primary.premium ? 'Add premium domain to cart' : 'Add to cart'}</button>`;
      html += `</div>`;
    } else if (isTaken) {
      // Taken: WHOIS + Make Offer buttons
      html += `<div style="display:flex;flex-wrap:wrap;gap:.75rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.06);">`;
      html += `<p style="flex-basis:100%;font-size:.875rem;color:#71717a;margin-bottom:.25rem;">This domain is already registered. You can look up ownership details or explore acquisition options.</p>`;
      html += `<a href="whois.html?domain=${encodeURIComponent(primary.domain)}" style="display:inline-flex;align-items:center;gap:.375rem;padding:8px 16px;border-radius:.5rem;font-size:.8125rem;font-weight:500;color:#d4d4d8;border:1px solid #27272a;background:transparent;text-decoration:none;transition:all .15s;">`;
      html += `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
      html += `WHOIS Details</a>`;
      html += `<button onclick="window.toast('Backorder coming soon!','default')" style="display:inline-flex;align-items:center;gap:.375rem;padding:8px 16px;border-radius:.5rem;font-size:.8125rem;font-weight:600;color:#000;background:transparent;border:1px solid rgba(6,182,212,0.4);cursor:pointer;font-family:inherit;transition:all .15s;">`;
      html += `Make an offer</button>`;
      html += `</div>`;
    }
    
    html += `</div></div>`; // end card content + card wrapper
    
    // ─── Alternatives Section ──────────────────────────────
    if (data.alternatives.length > 0) {
      html += `<div style="margin-top:2rem;">`;
      html += `<h2 style="font-size:1.125rem;font-weight:600;color:#f4f4f5;margin-bottom:.875rem;">Available alternatives</h2>`;
      html += `<div style="background:#121214;border:1px solid rgba(255,255,255,0.06);border-radius:1rem;overflow:hidden;">`;
      
      data.alternatives.forEach((alt, i) => {
        const altAvailable = alt.status === "available";
        const borderStyle = i > 0 ? "border-top:1px solid rgba(255,255,255,0.04);" : "";
        
        html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:.875rem 1.25rem;gap:1rem;${borderStyle}">`;
        
        // Left: domain name
        html += `<div style="min-width:0;flex:1;">`;
        html += `<div style="font-weight:500;color:#f4f4f5;font-size:.9375rem;word-break:break-all;">${alt.domain}</div>`;
        html += `<div style="font-size:.75rem;color:#52525b;margin-top:.125rem;">`;
        if (altAvailable && alt.registration > 0) {
          html += `<span style="color:#4ade80;">Available</span> · ${fmt(alt.registration)}/yr`;
        } else if (altAvailable) {
          html += `<span style="color:#4ade80;">Available</span>`;
        } else {
          html += `<span style="color:#52525b;">Taken</span>`;
        }
        html += `</div></div>`;
        
        // Right: action
        if (altAvailable) {
          html += `<button data-alt-add="${alt.domain}" data-price="${alt.registration}" data-renew="${alt.renewal}" style="display:inline-flex;align-items:center;padding:6px 14px;border-radius:.375rem;font-size:.75rem;font-weight:600;color:#000;background:#22d3ee;border:none;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0;transition:background .15s;">Add to cart</button>`;
        } else {
          html += `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:9999px;font-size:.6875rem;font-weight:500;color:#52525b;flex-shrink:0;">Taken</span>`;
        }
        
        html += `</div>`;
      });
      
      html += `</div></div>`;
    }
    
    // ─── Suggestions Section ───────────────────────────────
    if (data.suggestions.length > 0) {
      html += `<div style="margin-top:2rem;">`;
      html += `<h2 style="font-size:1.125rem;font-weight:600;color:#f4f4f5;margin-bottom:.875rem;">Suggestions for you</h2>`;
      html += `<div style="display:grid;grid-template-columns:1fr;gap:.625rem;">`;
      
      // 2-column on md+
      html += `<style>@media(min-width:768px){.sug-grid{grid-template-columns:repeat(2,1fr) !important;}}</style>`;
      
      data.suggestions.forEach(s => {
        html += `<div class="sug-grid" style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;background:#121214;border:1px solid rgba(255,255,255,0.06);border-radius:.75rem;gap:.75rem;">`;
        html += `<span style="font-weight:500;color:#f4f4f5;font-size:.875rem;word-break:break-all;">${s.domain}</span>`;
        html += `<button data-alt-add="${s.domain}" data-price="${s.registration}" data-renew="${s.renewal}" style="display:inline-flex;align-items:center;padding:5px 12px;border-radius:.375rem;font-size:.75rem;font-weight:600;color:#000;background:#22d3ee;border:none;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0;">Add</button>`;
        html += `</div>`;
      });
      
      html += `</div></div>`;
    }
    
    resultsEl.innerHTML = html;
    
    // ─── Wire up event listeners ───────────────────────────
    const termSelect = resultsEl.querySelector("[data-term-select]");
    const addBtn = resultsEl.querySelector("[data-add-cart]");
    
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const years = termSelect ? Number(termSelect.value) : 1;
        const res = Cart.add({ 
          domain: primary.domain, 
          tld: primary.tld, 
          registration: primary.registration, 
          renewal: primary.renewal, 
          years 
        });
        
        if (!res.added) {
          window.toast("Already in cart.", "error");
        } else {
          window.toast(`${primary.domain} added to cart (${years} yr).`, "success");
          Cart.updateBadge();
        }
      });
    }
    
    resultsEl.querySelectorAll("[data-alt-add]").forEach(btn => {
      btn.addEventListener("click", () => {
        const domain = btn.getAttribute("data-alt-add");
        const price = Number(btn.getAttribute("data-price"));
        const renew = Number(btn.getAttribute("data-renew"));
        
        const res = Cart.add({ domain, registration: price, renewal: renew, years: 1 });
        
        if (!res.added) {
          window.toast("Already in cart.", "error");
        } else {
          window.toast(`${domain} added to cart.`, "success");
          Cart.updateBadge();
        }
      });
    });
  }
}
