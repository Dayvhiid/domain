const Cart = (() => {
  const KEY = "dr_cart_v1";
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||[] }catch{return []} }
  function save(items){ localStorage.setItem(KEY, JSON.stringify(items)); updateBadge(); }
  function updateBadge(){
    const count = load().length;
    document.querySelectorAll("[data-cart-count]").forEach(el=>{
      el.textContent = count;
      el.classList.toggle("hidden", count===0);
      el.setAttribute("aria-label", `${count} items in cart`);
    });
  }
  function add(item){
    const items = load();
    if(items.find(i=>i.domain===item.domain)){
      return { added:false, reason:"already_in_cart" };
    }
    items.push({ id: Date.now().toString(36), domain:item.domain, tld:item.tld||"", registration: Number(item.registration), renewal:Number(item.renewal), years: item.years||1, addedAt: new Date().toISOString() });
    save(items);
    return { added:true };
  }
  function remove(id){
    const items = load().filter(i=>i.id!==id);
    save(items);
  }
  function updateYears(id, years){
    const items = load();
    const it = items.find(i=>i.id===id);
    if(it){ it.years = Math.max(1, Math.min(10, Number(years)||1)); save(items); }
  }
  function clear(){ save([]); }
  function subtotal(){ return load().reduce((s,i)=> s + i.registration * i.years, 0); }
  function count(){ return load().length; }
  return { load, save, add, remove, updateYears, clear, subtotal, count, updateBadge };
})();
