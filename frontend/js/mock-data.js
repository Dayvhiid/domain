// Mock API Abstraction Layer
// TODAY: returns mock data. FUTURE: replace internals with fetch('/wp-json/domain-platform/v1/...')
// UI should never need to change.
const MockAPI = (() => {
  const TLD_PRICING = [
    { tld: ".com", registration: 12.99, renewal: 14.99, transfer: 12.99, category: "Popular" },
    { tld: ".ng", registration: 9.50, renewal: 11.50, transfer: 10.00, category: "Africa" },
    { tld: ".co.za", registration: 7.99, renewal: 9.99, transfer: 8.99, category: "Africa" },
    { tld: ".africa", registration: 8.99, renewal: 19.99, transfer: 12.99, category: "Africa" },
    { tld: ".online", registration: 3.99, renewal: 29.99, transfer: 5.99, category: "Popular" },
    { tld: ".store", registration: 4.99, renewal: 54.99, transfer: 8.99, category: "E-commerce" },
    { tld: ".tech", registration: 6.99, renewal: 49.99, transfer: 9.99, category: "Technology" },
    { tld: ".io", registration: 39.99, renewal: 49.99, transfer: 42.99, category: "Technology" },
    { tld: ".co", registration: 8.99, renewal: 28.99, transfer: 10.99, category: "Popular" },
    { tld: ".net", registration: 13.99, renewal: 16.99, transfer: 13.99, category: "Popular" },
    { tld: ".org", registration: 10.99, renewal: 14.99, transfer: 11.99, category: "Popular" },
    { tld: ".biz", registration: 6.99, renewal: 17.99, transfer: 8.99, category: "Business" },
    { tld: ".blog", registration: 9.99, renewal: 31.99, transfer: 12.99, category: "Personal" },
    { tld: ".shop", registration: 2.99, renewal: 32.99, transfer: 6.99, category: "E-commerce" },
  ];

  const TAKEN_DOMAINS = new Set(["google","facebook","amazon","example","test","admin","mybusiness"]);
  const PREMIUM_DOMAINS = new Set(["invest","crypto","shop","news","premium"]);

  function delay(ms=450){ return new Promise(r=>setTimeout(r,ms)); }

  function parseDomain(input){
    const raw = input.trim().toLowerCase();
    if(!raw) return null;
    // allow "example.com" or "example"
    if(raw.includes(".")){
      const idx = raw.lastIndexOf(".");
      return { sld: raw.slice(0,idx), tld: raw.slice(idx) };
    }
    return { sld: raw, tld: null };
  }

  async function searchDomain(query){
    await delay(650 + Math.random()*400);
    const parsed = parseDomain(query);
    if(!parsed || !parsed.sld) throw new Error("Invalid domain");
    const cleanSld = parsed.sld.replace(/[^a-z0-9-]/g,"").slice(0,63);
    if(!cleanSld) throw new Error("Invalid domain name");

    const requestedTld = parsed.tld || ".com";
    const priceEntry = TLD_PRICING.find(p=>p.tld===requestedTld) || TLD_PRICING[0];

    let status = "available";
    if(PREMIUM_DOMAINS.has(cleanSld)) status = "premium";
    else if(TAKEN_DOMAINS.has(cleanSld)) status = "taken";
    else if(cleanSld.length < 3) status = "reserved";
    else if(Math.random() < 0.18) status = "taken";

    const primary = {
      domain: `${cleanSld}${requestedTld}`,
      sld: cleanSld,
      tld: requestedTld,
      status,
      registration: status==="premium" ? 199.00 : priceEntry.registration,
      renewal: priceEntry.renewal,
      premium: status==="premium"
    };

    const alternatives = TLD_PRICING.filter(p=>p.tld!==requestedTld).slice(0,8).map(p=>{
      let altStatus = "available";
      if(TAKEN_DOMAINS.has(cleanSld) && Math.random()<0.5) altStatus="taken";
      if(p.tld===".io" && Math.random()<0.3) altStatus="taken";
      return { domain:`${cleanSld}${p.tld}`, tld:p.tld, status:altStatus, registration:p.registration, renewal:p.renewal };
    });

    // also prefix/suffix suggestions when taken
    const suggestions = [];
    if(status!=="available"){
      ["get","my","try","go"].forEach(pref=>{
        suggestions.push({ domain:`${pref}${cleanSld}${requestedTld}`, status:"available", registration: priceEntry.registration, renewal: priceEntry.renewal });
      });
      ["hub","ly","hq","online"].forEach(suf=>{
        suggestions.push({ domain:`${cleanSld}${suf}${requestedTld}`, status:"available", registration: priceEntry.registration, renewal: priceEntry.renewal });
      });
    }

    return { primary, alternatives, suggestions: suggestions.slice(0,4) };
  }

  async function getPricing(){ await delay(150); return TLD_PRICING; }

  async function whoisLookup(domain){
    await delay(600);
    const p = parseDomain(domain);
    if(!p) throw new Error("Invalid domain");
    const fullDomain = p.tld ? `${p.sld}${p.tld}` : `${p.sld}.com`;
    const isTaken = TAKEN_DOMAINS.has(p.sld);
    if(!isTaken) return { domain: fullDomain, available: true };
    return {
      domain: fullDomain,
      available: false,
      registrar: "Example Registrar LLC",
      created: "2019-04-12",
      expires: "2027-04-12",
      status: ["clientTransferProhibited"],
      nameServers: ["ns1.example.com","ns2.example.com"],
      privacy: true
    };
  }

  // simple cart abstraction already handled in cart.js but expose pricing helper
  function calculateTotal(registration, years){ return +(registration*years).toFixed(2); }

  return { searchDomain, getPricing, whoisLookup, calculateTotal, TLD_PRICING };
})();
