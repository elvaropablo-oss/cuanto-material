(()=>{
  const GA_ID='G-GW7JZFNRRP', KEY='cuantomaterial_consent_v1';
  window.cmTrack=(name,params={})=>{if(!window.gtag)return;gtag('event',name,{site_project:'cuantomaterial',...params});};
  window.cmToast=(text)=>{let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t);}t.textContent=text;t.classList.add('show');clearTimeout(window.__cmToastTimer);window.__cmToastTimer=setTimeout(()=>t.classList.remove('show'),1800);};
  function loadGA(){if(window.gtag)return;window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',GA_ID,{send_page_view:true,site_project:'cuantomaterial'});const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID;document.head.appendChild(s);}
  function apply(v){localStorage.setItem(KEY,v);document.querySelector('.consent')?.classList.remove('show');if(v==='yes'){loadGA();window.gtag?.('consent','update',{analytics_storage:'granted'});}else{window.gtag?.('consent','update',{analytics_storage:'denied'});}window.cmToast?.(v==='yes'?'Analytics aceptado':'Analytics rechazado');}
  function addPreferenceControl(){const cols=[...document.querySelectorAll('.footer-grid>div')];const legal=cols.at(-1);if(!legal||legal.querySelector('.preference-link'))return;const b=document.createElement('button');b.type='button';b.className='preference-link';b.textContent='Preferencias de privacidad';b.addEventListener('click',()=>document.querySelector('.consent')?.classList.add('show'));legal.appendChild(b);}
  const titles={
    'pintura-paredes.html':'Pintura para paredes','azulejos-baldosas.html':'Azulejos y baldosas','suelo-laminado.html':'Suelo laminado','papel-pintado.html':'Papel pintado','hormigon.html':'Hormigón','ladrillos-bloques.html':'Ladrillos y bloques','pladur.html':'Pladur','rodapie.html':'Rodapié','aislamiento.html':'Aislamiento','mortero.html':'Mortero','frigorias-aire-acondicionado.html':'Frigorías y aire acondicionado','grava-aridos.html':'Grava y áridos'
  };
  const related={
    'pintura-paredes.html':['papel-pintado.html','pladur.html','aislamiento.html'],
    'azulejos-baldosas.html':['mortero.html','suelo-laminado.html','rodapie.html'],
    'suelo-laminado.html':['rodapie.html','aislamiento.html','azulejos-baldosas.html'],
    'papel-pintado.html':['pintura-paredes.html','pladur.html','rodapie.html'],
    'hormigon.html':['grava-aridos.html','mortero.html','ladrillos-bloques.html'],
    'ladrillos-bloques.html':['mortero.html','hormigon.html','pladur.html'],
    'pladur.html':['aislamiento.html','pintura-paredes.html','ladrillos-bloques.html'],
    'rodapie.html':['suelo-laminado.html','papel-pintado.html','azulejos-baldosas.html'],
    'aislamiento.html':['pladur.html','frigorias-aire-acondicionado.html','suelo-laminado.html'],
    'mortero.html':['ladrillos-bloques.html','azulejos-baldosas.html','hormigon.html'],
    'frigorias-aire-acondicionado.html':['aislamiento.html','pladur.html','pintura-paredes.html'],
    'grava-aridos.html':['hormigon.html','mortero.html','rodapie.html']
  };
  function addRelated(){const page=location.pathname.split('/').pop();const links=related[page];const content=document.querySelector('article.content');if(!links||!content||content.querySelector('.related-tools'))return;const section=document.createElement('section');section.className='related-tools';const h=document.createElement('h2');h.textContent='Calculadoras relacionadas';const grid=document.createElement('div');grid.className='related-grid';links.forEach(href=>{const a=document.createElement('a');a.className='related-link';a.href=href;a.dataset.track='';a.textContent=titles[href];grid.appendChild(a);});section.append(h,grid);const back=[...content.querySelectorAll('p')].find(p=>p.querySelector('a[href="calculadoras.html"]'));if(back)content.insertBefore(section,back);else content.appendChild(section);}
  function bindTrackedLinks(){document.querySelectorAll('a[data-track]').forEach(a=>{if(a.dataset.tracked)return;a.dataset.tracked='1';a.addEventListener('click',()=>window.cmTrack?.('internal_navigation',{target:a.getAttribute('href')||''}));});}
  document.addEventListener('DOMContentLoaded',()=>{
    const v=localStorage.getItem(KEY),b=document.querySelector('.consent');if(v==='yes')loadGA();else if(!v&&b)b.classList.add('show');
    document.querySelector('[data-consent=yes]')?.addEventListener('click',()=>apply('yes'));
    document.querySelector('[data-consent=no]')?.addEventListener('click',()=>apply('no'));
    const q=document.querySelector('[data-filter-calcs]');if(q)q.addEventListener('input',()=>{const s=q.value.toLowerCase().trim();document.querySelectorAll('[data-calc-card]').forEach(c=>c.hidden=!!s&&!c.textContent.toLowerCase().includes(s));});
    addPreferenceControl();addRelated();bindTrackedLinks();
  });
})();