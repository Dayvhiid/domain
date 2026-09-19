const Cart = (() => {
  const KEY = "dr_cart_v1";
  const MAX_ITEMS = 50;
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
  async function syncToBackend(item, action){
    if(!window.APP_USER) return;
    try {
      if(action === 'add'){
        await window.API.cartApi.addItem({
          domainName: item.domain.split('.')[0],
          extension: item.tld || '.' + item.domain.split('.').slice(1).join('.'),
          fullDomainName: item.domain,
          price: { registration: item.registration, renewal: item.renewal, currency: 'ZAR' },
          years: item.years || 1,
        });
      } else if(action === 'remove'){
        await window.API.cartApi.removeItem(item.domain);
      } else if(action === 'clear'){
        await window.API.cartApi.clearCart();
      }
    } catch(err){
      console.warn('Cart sync to backend failed:', err.message);
    }
  }
  function add(item){
    const items = load();
    if(items.length >= MAX_ITEMS){
      return { added:false, reason:"cart_full" };
    }
    if(items.find(i=>i.domain===item.domain)){
      return { added:false, reason:"already_in_cart" };
    }
    const cartItem = { id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), domain:item.domain, tld:item.tld||"", registration: Number(item.registration), renewal:Number(item.renewal), years: item.years||1, addedAt: new Date().toISOString() };
    items.push(cartItem);
    save(items);
    syncToBackend(cartItem, 'add');
    return { added:true };
  }
  function remove(id){
    const item = load().find(i=>i.id===id);
    const items = load().filter(i=>i.id!==id);
    save(items);
    if(item) syncToBackend(item, 'remove');
  }
  function updateYears(id, years){
    const items = load();
    const it = items.find(i=>i.id===id);
    if(it){ it.years = Math.max(1, Math.min(10, Number(years)||1)); save(items); }
  }
  function clear(){
    save([]);
    syncToBackend(null, 'clear');
  }
  function subtotal(){ return load().reduce((s,i)=> s + i.registration * i.years, 0); }
  function count(){ return load().length; }
  return { load, save, add, remove, updateYears, clear, subtotal, count, updateBadge };
})();
