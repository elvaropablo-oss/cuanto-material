
(()=>{
  const GA_ID='G-GW7JZFNRRP', KEY='cuantomaterial_consent_v1';
  window.cmTrack=(name,params={})=>{ if(!window.gtag) return; gtag('event',name,{site_project:'cuantomaterial',...params}); };
  function loadGA(){
    if(window.gtag) return;
    window.dataLayer=window.dataLayer||[]; window.gtag=function(){dataLayer.push(arguments)}; gtag('js',new Date()); gtag('config',GA_ID,{send_page_view:true});
    const s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID; document.head.appendChild(s);
  }
  function apply(v){ localStorage.setItem(KEY,v); const b=document.querySelector('.consent'); if(b)b.classList.remove('show'); if(v==='yes')loadGA(); }
  document.addEventListener('DOMContentLoaded',()=>{
    const v=localStorage.getItem(KEY), b=document.querySelector('.consent'); if(v==='yes')loadGA(); else if(!v&&b)b.classList.add('show');
    document.querySelector('[data-consent=yes]')?.addEventListener('click',()=>apply('yes'));
    document.querySelector('[data-consent=no]')?.addEventListener('click',()=>apply('no'));
    document.querySelectorAll('a[data-track]').forEach(a=>a.addEventListener('click',()=>cmTrack('internal_navigation',{target:a.getAttribute('href')||''})));
    const q=document.querySelector('[data-filter-calcs]'); if(q) q.addEventListener('input',()=>{ const s=q.value.toLowerCase().trim(); document.querySelectorAll('[data-calc-card]').forEach(c=>c.hidden=s&&!c.textContent.toLowerCase().includes(s)); });
  });
})();
