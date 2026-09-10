(()=>{
const $=id=>document.getElementById(id);
function setupGuide(){
  const wrap=document.querySelector('.floorplan-wrap');
  if(!wrap)return;
  document.querySelectorAll('.cm-help-fab').forEach(x=>x.remove());
  document.querySelectorAll('#floorplanSvg .fp-assist-overlay').forEach(x=>x.remove());
  document.getElementById('fpAssistTip')?.remove();
  const guide=wrap.querySelector('.cm-guide');
  if(!guide)return;
  guide.hidden=true;
  let toggle=wrap.querySelector('.fp-help-toggle');
  if(!toggle){
    toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='fp-help-toggle';
    toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML='<span>Ayuda para dibujar el plano</span><span class="fp-help-chevron" aria-hidden="true">⌄</span>';
    wrap.insertBefore(toggle,guide);
    toggle.addEventListener('click',()=>{
      const open=guide.hidden;
      guide.hidden=!open;
      toggle.setAttribute('aria-expanded',String(open));
      toggle.classList.toggle('open',open);
      window.cmTrack?.('floorplan_help_toggle',{open});
    });
  }
  const close=guide.querySelector('.cm-guide-close');
  if(close){
    close.textContent='Cerrar';
    close.onclick=e=>{
      e.preventDefault();
      guide.hidden=true;
      toggle.setAttribute('aria-expanded','false');
      toggle.classList.remove('open');
    };
  }
}
function injectStyles(){
  if($('fpAssistStyles'))return;
  const s=document.createElement('style');
  s.id='fpAssistStyles';
  s.textContent='.fp-help-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px 0 4px;padding:9px 12px;border:1px solid #ded5cb;border-radius:10px;background:rgba(255,255,255,.65);color:#5f5851;font:700 .84rem/1.2 system-ui;cursor:pointer}.fp-help-toggle:hover{background:#fff;color:#302c28}.fp-help-chevron{font-size:1.05rem;transition:transform .18s ease;opacity:.7}.fp-help-toggle.open .fp-help-chevron{transform:rotate(180deg)}';
  document.head.appendChild(s);
}
document.addEventListener('DOMContentLoaded',()=>{
  injectStyles();
  setTimeout(setupGuide,0);
  $('modePlan')?.addEventListener('click',()=>setTimeout(setupGuide,0));
});
})();