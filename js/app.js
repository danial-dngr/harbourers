
(() => {
'use strict';
const openPreviews = {};
let gridMode=false, zIndex=20, projectData={};
const $=s=>document.querySelector(s);
const isMobile=()=>matchMedia('(max-width:800px)').matches;
const grid=$('#gridContainer'), mobile=$('#mobileStackContainer'), list=$('#projectList');

function media(section){
  const src=section.src||'';
  let el;
  if(section.type==='video'){ el=document.createElement('video'); el.src=src; el.controls=true; el.loop=true; el.muted=true; el.playsInline=true; el.autoplay=true; }
  else if(section.type==='svg'){
    if((section.code||'').trim().startsWith('<svg')){ const w=document.createElement('div'); w.innerHTML=section.code; return w.firstElementChild||w; }
    el=document.createElement('img'); el.src=src;
  } else if(section.type==='lottie'){
    el=document.createElement('lottie-player'); el.className='lottie-player'; el.setAttribute('src',src); el.setAttribute('background','transparent'); el.setAttribute('speed','1'); el.setAttribute('loop',''); el.setAttribute('autoplay','');
  } else { el=document.createElement('img'); el.src=src; el.alt=section.alt||''; el.loading='lazy'; el.draggable=false; }
  if(section.float && section.float!=='none'){ el.classList.add('project-media-float',section.float); if(section.shape) el.classList.add(section.shape); }
  return el;
}
function renderSection(s){
  const box=document.createElement('div'); box.className='project-section';
  if(s.type==='text'){ box.classList.add('project-text','wrap-'+(s.wrap||'pretty')); box.innerHTML=(s.text||'').replace(/\n/g,'<br>'); }
  else if(s.type==='spacer'){ box.classList.add('project-spacer'); box.style.height=(Number(s.height)||40)+'px'; }
  else if(s.type==='embed'){ const f=document.createElement('iframe'); f.src=s.src||''; f.loading='lazy'; box.appendChild(f); }
  else box.appendChild(media(s));
  return box;
}
function closePreview(name){
  const p=openPreviews[name]; if(!p)return; p.remove(); delete openPreviews[name];
  list.querySelector(`[data-project="${CSS.escape(name)}"]`)?.classList.remove('is-active');
}
function makeDraggable(el){
  let drag=false,sx=0,sy=0,l=0,t=0;
  el.addEventListener('mousedown',e=>{
    if(gridMode||isMobile()||e.target.closest('button,img,video,lottie-player,.project-text'))return;
    drag=true;sx=e.clientX;sy=e.clientY;l=el.offsetLeft;t=el.offsetTop;el.style.zIndex=++zIndex;el.style.cursor='grabbing';
  });
  addEventListener('mousemove',e=>{if(!drag)return; el.style.transform='none'; el.style.left=(l+e.clientX-sx)+'px'; el.style.top=(t+e.clientY-sy)+'px';});
  addEventListener('mouseup',()=>{drag=false;el.style.cursor='default';});
}
function openProject(name){
  if(openPreviews[name]){ openPreviews[name].style.zIndex=++zIndex; return; }
  const d=projectData[name]; if(!d)return;
  const p=document.createElement('div'); p.className='preview'; p.dataset.project=name; p.style.zIndex=++zIndex;
  const close=document.createElement('button'); close.className='close-button'; close.title='Close'; close.onclick=()=>closePreview(name);
  const title=document.createElement('div'); title.className='preview-title'; title.textContent=name;
  const sections=document.createElement('div'); sections.className='project-sections';
  (d.sections||[]).forEach(s=>sections.appendChild(renderSection(s)));
  p.append(close,title,sections); openPreviews[name]=p;
  list.querySelector(`[data-project="${CSS.escape(name)}"]`)?.classList.add('is-active');
  if(isMobile()){ mobile.appendChild(p); }
  else if(gridMode){ grid.appendChild(p); p.classList.add('in-grid'); p.style.gridColumn='span 4'; p.style.gridRow='span 24'; }
  else { document.body.appendChild(p); p.style.left=(20+Math.random()*Math.max(20,innerWidth-650))+'px'; p.style.top=(80+Math.random()*Math.max(20,innerHeight*.8-500))+'px'; p.style.transform='none'; }
  makeDraggable(p);
}
function rebuildMode(){
  Object.values(openPreviews).forEach(p=>{
    if(isMobile()){p.classList.remove('in-grid');mobile.appendChild(p);}
    else if(gridMode){p.classList.add('in-grid');grid.appendChild(p);p.style.gridColumn='span 4';p.style.gridRow='span 24';}
    else{p.classList.remove('in-grid');document.body.appendChild(p);p.style.position='absolute';p.style.width='600px';p.style.height='auto';}
  });
}
function heading(){
  const h=$('#projectMenuHeading'); if(!h)return;
  if(list.scrollTop<4){h.textContent='PROJECTS';return;}
  const top=list.getBoundingClientRect().top; let a=list.querySelector('li');
  list.querySelectorAll('li').forEach(i=>{if(i.getBoundingClientRect().top<=top+10)a=i;});
  h.textContent=(a?.dataset.category||'PROJECTS').toUpperCase();
}
function setupContact(){
  const overlay=$('#contactPanel'), toggle=$('#contactToggleBtn'), close=$('#closeContactBtn'), canvas=$('#contactCanvas');
  if(!overlay||!toggle||!canvas)return;
  const ctx=canvas.getContext('2d'); let drawing=false,last=null,colour='#111111',tool='pen';
  const seed=()=>{ctx.fillStyle='#f4f0e5';ctx.fillRect(0,0,canvas.width,canvas.height)}; seed();
  toggle.onclick=()=>overlay.classList.toggle('active'); close.onclick=()=>overlay.classList.remove('active');
  document.querySelectorAll('.draw-tool').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('.draw-tool').forEach(x=>x.classList.toggle('active',x===b));});
  document.querySelectorAll('.colour-swatch').forEach(b=>b.onclick=()=>colour=b.dataset.colour);
  const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*canvas.width,y:(e.clientY-r.top)/r.height*canvas.height}};
  canvas.addEventListener('mousedown',e=>{drawing=true;last=point(e)});
  canvas.addEventListener('mousemove',e=>{if(!drawing)return;const p=point(e);ctx.strokeStyle=tool==='eraser'?'#f4f0e5':colour;ctx.lineWidth=tool==='eraser'?22:5.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p});
  addEventListener('mouseup',()=>drawing=false);
  $('#clearDrawingBtn')?.addEventListener('click',seed);
  $('#downloadDrawingBtn')?.addEventListener('click',()=>{const a=document.createElement('a');a.download='harbourer-contact-drawing.png';a.href=canvas.toDataURL();a.click()});
}
async function init(){
  const payload=await HARBOURER_CONTENT.load();
  payload.projects.filter(p=>p.published!==false).sort((a,b)=>a.order-b.order).forEach((p,i)=>{
    projectData[p.name]=p; const li=document.createElement('li'); li.dataset.project=p.name; li.dataset.category=p.category||'PROJECTS';
    li.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span>${p.menuLabel||p.name}`; li.onclick=()=>openProject(p.name); list.appendChild(li);
  });
  $('#invertBtn')?.addEventListener('click',()=>document.body.classList.toggle('dark-mode'));
  $('#gridBtn')?.addEventListener('click',()=>{if(isMobile())return;gridMode=!gridMode;grid.classList.toggle('active',gridMode);rebuildMode()});
  $('#closeAllBtn')?.addEventListener('click',()=>Object.keys(openPreviews).forEach(closePreview));
  list.addEventListener('scroll',heading,{passive:true});
  addEventListener('resize',rebuildMode);
  $('#copyrightYear') && ($('#copyrightYear').textContent=new Date().getFullYear());
  setupContact();
}
init().catch(err=>{console.error(err); list.innerHTML='<li>CONTENT COULD NOT LOAD. RUN VIA A LOCAL SERVER OR GITHUB PAGES.</li>';});
})();
