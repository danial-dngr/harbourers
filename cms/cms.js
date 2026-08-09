
let data={version:2,projects:[]}, current=-1;
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function saveFromForm(){
 if(current<0)return; const p=data.projects[current];
 p.name=$('#pName').value;p.menuLabel=$('#pMenu').value;p.category=$('#pCat').value;p.published=$('#pPub').checked;
 document.querySelectorAll('.block').forEach((b,i)=>{const s=p.sections[i]; b.querySelectorAll('[data-k]').forEach(el=>s[el.dataset.k]=el.type==='number'?Number(el.value):el.value)});
}
function renderProjects(){const c=$('#projects');c.innerHTML='';data.projects.sort((a,b)=>a.order-b.order).forEach((p,i)=>{const d=document.createElement('div');d.className='project';d.innerHTML=`<button class="${i===current?'active':''}">${esc(p.name||'UNTITLED')}</button><span><button>↑</button><button>↓</button></span>`;d.children[0].onclick=()=>{saveFromForm();current=i;render()};d.children[1].children[0].onclick=()=>moveProject(i,-1);d.children[1].children[1].onclick=()=>moveProject(i,1);c.appendChild(d)})}
function moveProject(i,dir){saveFromForm();const j=i+dir;if(j<0||j>=data.projects.length)return;[data.projects[i],data.projects[j]]=[data.projects[j],data.projects[i]];data.projects.forEach((p,n)=>p.order=n+1);current=j;render()}
function blockHTML(s,i){let fields='';
 if(s.type==='text')fields=`<label>TEXT<textarea data-k="text">${esc(s.text)}</textarea></label><label>WRAP<select data-k="wrap"><option ${s.wrap==='normal'?'selected':''}>normal</option><option ${s.wrap==='pretty'?'selected':''}>pretty</option><option ${s.wrap==='balance'?'selected':''}>balance</option></select></label>`;
 else if(s.type==='spacer')fields=`<label>HEIGHT PX<input type="number" data-k="height" value="${s.height||40}"></label>`;
 else if(s.type==='svg')fields=`<label>SRC / ASSET PATH<input data-k="src" value="${esc(s.src)}"></label><label>OR INLINE SVG<textarea data-k="code">${esc(s.code)}</textarea></label>`;
 else fields=`<label>SRC / ASSET PATH<input data-k="src" value="${esc(s.src)}"></label><div class="row"><label>FLOAT<select data-k="float"><option>none</option><option ${s.float==='left'?'selected':''}>left</option><option ${s.float==='right'?'selected':''}>right</option></select></label><label>SHAPE<select data-k="shape"><option>box</option><option ${s.shape==='circle'?'selected':''}>circle</option><option ${s.shape==='ellipse'?'selected':''}>ellipse</option></select></label></div>`;
 return `<div class="block" data-i="${i}"><div class="block-head"><strong>${s.type.toUpperCase()}</strong><div class="block-controls"><button data-act="up">↑</button><button data-act="down">↓</button><button data-act="delete">DELETE</button></div></div>${fields}</div>`}
function render(){renderProjects();if(current<0||!data.projects[current])return;const p=data.projects[current];$('#editor').innerHTML=`<div class="row"><label>PROJECT NAME<input id="pName" value="${esc(p.name)}"></label><label>MENU LABEL<input id="pMenu" value="${esc(p.menuLabel||p.name)}"></label><label>CATEGORY<input id="pCat" value="${esc(p.category)}"></label><label>PUBLISHED <input id="pPub" type="checkbox" ${p.published!==false?'checked':''}></label></div><hr><div><button data-add="text">+ TEXT</button> <button data-add="image">+ IMAGE</button> <button data-add="video">+ VIDEO</button> <button data-add="svg">+ SVG</button> <button data-add="lottie">+ LOTTIE</button> <button data-add="spacer">+ SPACER</button></div><div id="blocks">${(p.sections||[]).map(blockHTML).join('')}</div>`;
 document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{saveFromForm();const t=b.dataset.add;p.sections.push(t==='text'?{type:'text',text:'',wrap:'pretty'}:t==='spacer'?{type:'spacer',height:40}:{type:t,src:'',float:'none',shape:'box'});render()});
 document.querySelectorAll('.block').forEach(b=>b.querySelectorAll('[data-act]').forEach(btn=>btn.onclick=()=>{saveFromForm();let i=+b.dataset.i,a=btn.dataset.act;if(a==='delete')p.sections.splice(i,1);else{let j=i+(a==='up'?-1:1);if(j>=0&&j<p.sections.length)[p.sections[i],p.sections[j]]=[p.sections[j],p.sections[i]];}render()}));
}
$('#newProject').onclick=()=>{saveFromForm();data.projects.push({id:'project-'+Date.now(),name:'NEW PROJECT',menuLabel:'NEW PROJECT',category:'EXPERIMENTAL',order:data.projects.length+1,published:true,sections:[]});current=data.projects.length-1;render()};
$('#loadBtn').onclick=()=>$('#fileInput').click();
$('#fileInput').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{data=JSON.parse(r.result);current=data.projects.length?0:-1;render()};r.readAsText(f)};
$('#exportBtn').onclick=()=>{saveFromForm();data.projects.forEach((p,i)=>p.order=i+1);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='projects.json';a.click();URL.revokeObjectURL(a.href)};
render();
