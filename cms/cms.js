
let data={version:'2.1',projects:[]},selected=-1;
const $=s=>document.querySelector(s);
const escapeHtml=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function project(){return data.projects[selected]}
function resequence(){data.projects.forEach((p,i)=>{p.order=i+1;p.number=String(i+1).padStart(2,'0')})}
function saveFields(){
  const p=project(); if(!p)return;
  p.name=$('#name').value;p.menuLabel=$('#menuLabel').value;p.category=$('#category').value;p.published=$('#published').checked;
  document.querySelectorAll('.block').forEach((box,i)=>{
    const s=p.sections[i];
    box.querySelectorAll('[data-key]').forEach(el=>{
      let v=el.type==='number'?Number(el.value):el.value;
      if(el.type==='checkbox')v=el.checked;
      s[el.dataset.key]=v;
    });
  });
}
function moveProject(i,d){saveFields();const n=i+d;if(n<0||n>=data.projects.length)return;[data.projects[i],data.projects[n]]=[data.projects[n],data.projects[i]];selected=n;resequence();render()}
function moveSection(i,d){saveFields();const p=project(),n=i+d;if(n<0||n>=p.sections.length)return;[p.sections[i],p.sections[n]]=[p.sections[n],p.sections[i]];render()}
function blockFields(s){
  if(s.type==='text') return `<label>TEXT<textarea data-key="text">${escapeHtml(s.text||'')}</textarea></label><div class="row"><label>TEXT WRAP<select data-key="wrap"><option ${s.wrap==='normal'?'selected':''}>normal</option><option ${s.wrap==='pretty'?'selected':''}>pretty</option><option ${s.wrap==='balance'?'selected':''}>balance</option></select></label></div>`;
  if(s.type==='spacer') return `<label>HEIGHT PX<input type="number" data-key="height" value="${Number(s.height||40)}"></label>`;
  if(s.type==='embed') return `<label>RAW HTML<textarea data-key="html">${escapeHtml(s.html||'')}</textarea></label>`;
  let out=`<label>ASSET PATH / URL<input data-key="src" value="${escapeHtml(s.src||'')}"></label>`;
  if(s.type==='svg') out+=`<label>OPTIONAL INLINE SVG<textarea data-key="code">${escapeHtml(s.code||'')}</textarea></label>`;
  out+=`<div class="row"><label>WIDTH<input data-key="width" value="${escapeHtml(s.width||'100%')}"></label><label>ALT TEXT<input data-key="alt" value="${escapeHtml(s.alt||'')}"></label></div>`;
  if(['image','svg','lottie'].includes(s.type)) out+=`<div class="row"><label>TEXT FLOW<select data-key="float"><option value="none">none</option><option ${s.float==='left'?'selected':''}>left</option><option ${s.float==='right'?'selected':''}>right</option></select></label><label>SHAPE<select data-key="shape"><option>box</option><option ${s.shape==='circle'?'selected':''}>circle</option><option ${s.shape==='ellipse'?'selected':''}>ellipse</option></select></label></div>`;
  return out;
}
function render(){
  const pl=$('#projectList');pl.innerHTML='';
  data.projects.forEach((p,i)=>{
    const r=document.createElement('div');r.className='project-row'+(i===selected?' active':'');
    r.innerHTML=`<button>${escapeHtml(p.number)} ${escapeHtml(p.name)}</button><button>↑</button><button>↓</button>`;
    r.children[0].onclick=()=>{saveFields();selected=i;render()};
    r.children[1].onclick=()=>moveProject(i,-1);r.children[2].onclick=()=>moveProject(i,1);pl.appendChild(r);
  });
  const p=project(); if(!p){$('#editor').innerHTML='Open <code>content/projects.json</code>.';return}
  $('#editor').innerHTML=`<div class="row"><label>PROJECT NAME<input id="name" value="${escapeHtml(p.name)}"></label><label>MENU LABEL<input id="menuLabel" value="${escapeHtml(p.menuLabel||p.name)}"></label><label>CATEGORY<input id="category" value="${escapeHtml(p.category||'')}"></label><label>PUBLISHED<input id="published" type="checkbox" ${p.published!==false?'checked':''}></label></div><div class="addbar"><button data-add="text">+ TEXT</button><button data-add="image">+ IMAGE</button><button data-add="video">+ VIDEO</button><button data-add="svg">+ SVG</button><button data-add="lottie">+ LOTTIE</button><button data-add="embed">+ EMBED</button><button data-add="spacer">+ SPACER</button></div><div id="blocks"></div>`;
  const blocks=$('#blocks');
  (p.sections||[]).forEach((s,i)=>{
    const b=document.createElement('div');b.className='block';
    b.innerHTML=`<div class="block-head"><strong>${s.type.toUpperCase()}</strong><div class="controls"><button data-up>↑</button><button data-down>↓</button><button data-delete>DELETE</button></div></div>${blockFields(s)}`;
    b.querySelector('[data-up]').onclick=()=>moveSection(i,-1);b.querySelector('[data-down]').onclick=()=>moveSection(i,1);b.querySelector('[data-delete]').onclick=()=>{saveFields();p.sections.splice(i,1);render()};blocks.appendChild(b);
  });
  document.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>{
    saveFields();const t=btn.dataset.add;let s={type:t};
    if(t==='text')Object.assign(s,{text:'',wrap:'pretty'});
    else if(t==='spacer')s.height=40;
    else if(t==='embed')s.html='';
    else Object.assign(s,{src:'',width:'100%',alt:'',float:'none',shape:'box'});
    p.sections.push(s);render();
  });
}
$('#newProject').onclick=()=>{saveFields();data.projects.push({id:'project-'+Date.now(),name:'NEW PROJECT',menuLabel:'NEW PROJECT',number:'',category:'EXPERIMENTAL',order:data.projects.length+1,published:true,sections:[]});resequence();selected=data.projects.length-1;render()};
$('#openBtn').onclick=()=>$('#fileInput').click();
$('#fileInput').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{data=JSON.parse(r.result);selected=data.projects.length?0:-1;resequence();render()};r.readAsText(f)};
$('#exportBtn').onclick=()=>{saveFields();resequence();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='projects.json';a.click();URL.revokeObjectURL(a.href)};
render();
