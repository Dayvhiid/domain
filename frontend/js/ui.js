function initUI(){
  // Toast
  const container = document.getElementById("toast-container");
  window.toast = (msg, type="default")=>{
    if(!container) return;
    const el = document.createElement("div");
    el.className = `pointer-events-auto rounded-lg border bg-card border-subtle px-4 py-3 text-sm shadow-lg flex items-center gap-3 ${type==="error" ? "border-red-300 text-red-500" : type==="success" ? "border-green-300 text-green-500" : "text-primary"}`;
    el.innerHTML = `<span>${msg}</span><button class="ml-auto text-slate-400 hover:text-slate-600" aria-label="Dismiss">&times;</button>`;
    el.querySelector("button").onclick=()=> el.remove();
    container.appendChild(el);
    setTimeout(()=> { el.style.opacity="0"; el.style.transform="translateY(-4px)"; setTimeout(()=>el.remove(),300); }, 3500);
  };

  // FAQ accordion
  document.querySelectorAll("[data-accordion-button]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const content = document.getElementById(btn.getAttribute("aria-controls"));
      const expanded = btn.getAttribute("aria-expanded")==="true";
      btn.setAttribute("aria-expanded", String(!expanded));
      if(content){
        content.hidden = expanded;
        btn.querySelector("[data-accordion-icon]")?.classList.toggle("rotate-180", !expanded);
      }
    });
  });

  // Toggle switches (visual only)
  document.querySelectorAll("[data-toggle]").forEach(toggle=>{
    toggle.addEventListener("click", ()=>{
      const pressed = toggle.getAttribute("aria-pressed")==="true";
      toggle.setAttribute("aria-pressed", String(!pressed));
      toggle.querySelector("[data-toggle-knob]")?.classList.toggle("translate-x-5", !pressed);
      toggle.classList.toggle("bg-brand-500", !pressed);
      toggle.classList.toggle("bg-slate-200", pressed);
    });
  });

  // Dashboard tabs (if present)
  document.querySelectorAll("[data-tab-button]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const target = btn.dataset.tabButton;
      document.querySelectorAll("[data-tab-button]").forEach(b=> b.setAttribute("aria-selected", String(b===btn)));
      document.querySelectorAll("[data-tab-panel]").forEach(p=> p.hidden = p.dataset.tabPanel!==target);
      btn.classList.add("border-brand-500","text-slate-900");
    });
  });

  // Simple form validation helper
  document.querySelectorAll("form[data-validate]").forEach(form=>{
    form.addEventListener("submit", (e)=>{
      let valid = true;
      form.querySelectorAll("[required]").forEach(inp=>{
        const err = inp.nextElementSibling;
        if(!inp.value.trim()){
          valid=false;
          inp.classList.add("input-error");
          if(err && err.matches("[data-error]")) err.hidden=false;
        } else {
          inp.classList.remove("input-error");
          if(err && err.matches("[data-error]")) err.hidden=true;
        }
        if(inp.type==="email" && inp.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)){
          valid=false; inp.classList.add("input-error");
        }
      });
      if(!valid){ e.preventDefault(); window.toast("Please fix the highlighted fields.", "error"); }
    });
    form.querySelectorAll("input, select, textarea").forEach(inp=>{
      inp.addEventListener("input", ()=> inp.classList.remove("input-error"));
    });
  });
}

function formatPrice(n){ return `$${Number(n).toFixed(2)}`; }
