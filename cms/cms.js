
let data={version:'3.0',projects:[]}, selected=-1;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function current(){ return data.projects[selected]; }
function resequence(){
  data.projects.forEach((p,i)=>{
    p.order=i+1;
    p.number=String(i+1).padStart(2,'0');
  });
}
function sync(){
  const p=current(); if(!p || !$('#name')) return;
  p.name=$('#name').value;
  p.menuLabel=$('#menuLabel').value;
  p.category=$('#category').value;
  p.published=$('#published').checked;
  document.querySelectorAll('.block').forEach((box,i)=>{
    const s=p.sections[i];
    box.querySelectorAll('[data-key]').forEach(el=>{
      let value=el.type==='number'?Number(el.value):el.value;
      if(el.type==='checkbox') value=el.checked;
      s[el.dataset.key]=value;
    });
  });
}
function moveProject(i,d){
  sync(); const j=i+d; if(j<0||j>=data.projects.length)return;
  [data.projects[i],data.projects[j]]=[data.projects[j],data.projects[i]];
  selected=j; resequence(); render();
}
function moveBlock(i,d){
  sync(); const p=current(),j=i+d; if(j<0||j>=p.sections.length)return;
  [p.sections[i],p.sections[j]]=[p.sections[j],p.sections[i]];
  render();
}
function blockFields(s){
  if(s.type==='legacy-html') return `<label>ORIGINAL LEGACY HTML<textarea data-key="html">${esc(s.html||'')}</textarea></label>`;
  if(s.type==='text') return `<label>TEXT<textarea data-key="text">${esc(s.text||'')}</textarea></label><label>WRAP<select data-key="wrap"><option ${s.wrap==='normal'?'selected':''}>normal</option><option ${s.wrap==='pretty'?'selected':''}>pretty</option><option ${s.wrap==='balance'?'selected':''}>balance</option></select></label>`;
  if(s.type==='spacer') return `<label>HEIGHT PX<input type="number" data-key="height" value="${Number(s.height||40)}"></label>`;
  if(s.type==='embed') return `<label>HTML<textarea data-key="html">${esc(s.html||'')}</textarea></label>`;
  let x=`<label>FILE / URL<input data-key="src" value="${esc(s.src||'')}"></label>`;
  if(s.type==='svg') x+=`<label>OPTIONAL INLINE SVG<textarea data-key="code">${esc(s.code||'')}</textarea></label>`;
  x+=`<div class="row"><label>WIDTH<input data-key="width" value="${esc(s.width||'100%')}"></label><label>ALT TEXT<input data-key="alt" value="${esc(s.alt||'')}"></label></div>`;
  if(['image','svg','lottie'].includes(s.type)){
    x+=`<div class="row"><label>TEXT FLOW<select data-key="float"><option value="none">none</option><option ${s.float==='left'?'selected':''}>left</option><option ${s.float==='right'?'selected':''}>right</option></select></label><label>SHAPE<select data-key="shape"><option>box</option><option ${s.shape==='circle'?'selected':''}>circle</option><option ${s.shape==='ellipse'?'selected':''}>ellipse</option></select></label></div>`;
  }
  return x;
}
function render(){
  const list=$('#projects'); list.innerHTML='';
  data.projects.forEach((p,i)=>{
    const row=document.createElement('div');
    row.className='project-row'+(i===selected?' active':'');
    row.innerHTML=`<button class="select">${esc(p.number)} ${esc(p.name)}</button><button>↑</button><button>↓</button>`;
    row.children[0].onclick=()=>{sync();selected=i;render()};
    row.children[1].onclick=()=>moveProject(i,-1);
    row.children[2].onclick=()=>moveProject(i,1);
    list.appendChild(row);
  });
  const p=current();
  if(!p){ $('#editor').innerHTML='Open <code>content/projects.json</code>.'; return; }
  $('#editor').innerHTML=`
    <div class="row">
      <label>PROJECT NAME<input id="name" value="${esc(p.name)}"></label>
      <label>MENU LABEL<input id="menuLabel" value="${esc(p.menuLabel||p.name)}"></label>
      <label>CATEGORY<input id="category" value="${esc(p.category||'')}"></label>
      <label>PUBLISHED<input id="published" type="checkbox" ${p.published!==false?'checked':''}></label>
    </div>
    <div class="addbar">
      <button data-add="text">+ TEXT</button><button data-add="image">+ IMAGE</button>
      <button data-add="video">+ VIDEO</button><button data-add="svg">+ SVG</button>
      <button data-add="lottie">+ LOTTIE</button><button data-add="embed">+ EMBED</button>
      <button data-add="spacer">+ SPACER</button>
    </div>
    <div id="blocks"></div>`;
  const blocks=$('#blocks');
  (p.sections||[]).forEach((s,i)=>{
    const block=document.createElement('div');
    block.className='block'+(s.type==='legacy-html'?' legacy':'');
    block.innerHTML=`<div class="block-head"><strong>${s.type.toUpperCase()}</strong><div class="block-controls"><button data-up>↑</button><button data-down>↓</button><button data-delete>DELETE</button></div></div>${blockFields(s)}`;
    block.querySelector('[data-up]').onclick=()=>moveBlock(i,-1);
    block.querySelector('[data-down]').onclick=()=>moveBlock(i,1);
    block.querySelector('[data-delete]').onclick=()=>{sync();p.sections.splice(i,1);render()};
    blocks.appendChild(block);
  });
  document.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>{
    sync(); const t=btn.dataset.add; let s={type:t};
    if(t==='text') Object.assign(s,{text:'',wrap:'pretty'});
    else if(t==='spacer') s.height=40;
    else if(t==='embed') s.html='';
    else Object.assign(s,{src:'',width:'100%',alt:'',float:'none',shape:'box'});
    p.sections.push(s); render();
  });
}
$('#newProject').onclick=()=>{
  sync(); data.projects.push({
    id:'project-'+Date.now(),name:'NEW PROJECT',menuLabel:'NEW PROJECT',
    number:'',category:'EXPERIMENTAL',order:data.projects.length+1,published:true,
    sections:[]
  }); resequence(); selected=data.projects.length-1; render();
};
$('#openBtn').onclick=()=>$('#fileInput').click();
$('#fileInput').onchange=e=>{
  const f=e.target.files[0]; if(!f)return;
  const reader=new FileReader();
  reader.onload=()=>{data=JSON.parse(reader.result);selected=data.projects.length?0:-1;resequence();render()};
  reader.readAsText(f);
};
$('#exportBtn').onclick=()=>{
  sync(); resequence();
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='projects.json';a.click();
  URL.revokeObjectURL(a.href);
};
render();
