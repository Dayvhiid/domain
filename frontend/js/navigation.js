function initNavigation(){
  const btn = document.getElementById("mobile-menu-button");
  const menu = document.getElementById("mobile-menu");
  const closeBtn = document.getElementById("mobile-menu-close");
  if(!btn || !menu) return;
  const iconOpen = document.getElementById("icon-open");
  const iconClose = document.getElementById("icon-close");
  let open = false;
  function setState(v){
    open=v;
    menu.classList.toggle("hidden", !open);
    btn.setAttribute("aria-expanded", String(open));
    if(iconOpen) iconOpen.classList.toggle("hidden", open);
    if(iconClose) iconClose.classList.toggle("hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  btn.addEventListener("click", ()=> setState(!open));
  if(closeBtn) closeBtn.addEventListener("click", ()=> setState(false));
  menu.querySelectorAll("a, button").forEach(el=>{
    if(el.id !== "mobile-menu-button") el.addEventListener("click", ()=> setState(false));
  });
  const backdrop = menu.querySelector(".mobile-drawer-backdrop");
  if(backdrop) backdrop.addEventListener("click", ()=> setState(false));
  document.addEventListener("keydown", e=>{ if(e.key==="Escape" && open) setState(false); });
}
