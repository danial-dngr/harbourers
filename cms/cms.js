let data={version:'5.0',projects:[]},selected=-1,previewMode='desktop';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function p(){return data.projects[selected]}

function slugify(value){
  return String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'project';
}

function uniqueSlug(candidate,ignoreIndex=-1){
  const base=slugify(candidate);
  let slug=base,n=2;
  while(data.projects.some((project,index)=>index!==ignoreIndex&&project.id===slug)){
    slug=`${base}-${n++}`;
  }
  return slug;
}

function seq(){
  data.projects.forEach((x,i)=>{
    x.order=i+1;
    x.number=String(i+1).padStart(2,'0');
  });
}

function setStatus(message,type=''){
  const bar=$('#statusBar');
  bar.textContent=message;
  bar.className='status'+(type?' '+type:'');
}

function sync(){
  const x=p();
  if(!x||!$('#name'))return;

  x.name=$('#name').value;
  x.menuLabel=$('#menu').value;
  x.category=$('#cat').value;
  x.published=$('#pub').checked;
  x.id=uniqueSlug($('#slug').value||x.id||x.name,selected);
  $('#slug').value=x.id;

  document.querySelectorAll('.block').forEach((b,i)=>{
    const s=x.sections[i];
    b.querySelectorAll('[data-k]').forEach(el=>{
      let v=el.type==='number'?Number(el.value):el.value;
      if(el.type==='checkbox')v=el.checked;
      s[el.dataset.k]=v;
    });
  });
}

function moveProj(i,d){
  sync();
  const j=i+d;
  if(j<0||j>=data.projects.length)return;
  [data.projects[i],data.projects[j]]=[data.projects[j],data.projects[i]];
  selected=j;
  seq();
  setStatus('Project order changed. Export PROJECT INDEX when publishing.','warn');
  render();
}

function moveBlock(i,d){
  sync();
  const x=p(),j=i+d;
  if(j<0||j>=x.sections.length)return;
  [x.sections[i],x.sections[j]]=[x.sections[j],x.sections[i]];
  render();
}

function duplicateBlock(i){
  sync();
  const x=p();
  x.sections.splice(i+1,0,JSON.parse(JSON.stringify(x.sections[i])));
  render();
}

function generalLayout(s){return `<div class="layoutPanel"><div class="row3"><label>LAYOUT<select data-k="layoutMode"><option value="flow" ${s.layoutMode!=='free'?'selected':''}>FLOW</option><option value="free" ${s.layoutMode==='free'?'selected':''}>FREE</option></select></label><label>WIDTH<input data-k="width" value="${esc(s.width||'100%')}"></label><label>MOBILE WIDTH<input data-k="mobileWidth" value="${esc(s.mobileWidth||'100%')}"></label></div><div class="row3"><label>OFFSET X<input type="number" data-k="offsetX" value="${s.offsetX||0}"></label><label>OFFSET Y<input type="number" data-k="offsetY" value="${s.offsetY||0}"></label><label>ROTATE °<input type="number" step=".5" data-k="rotate" value="${s.rotate||0}"></label></div><div class="row3"><label>LEFT (FREE)<input data-k="left" value="${esc(s.left||'0%')}"></label><label>TOP (FREE)<input data-k="top" value="${esc(s.top??'0px')}"></label><label>Z INDEX<input type="number" data-k="zIndex" value="${s.zIndex??1}"></label></div><div class="row3"><label>TOP GAP<input type="number" data-k="marginTop" value="${s.marginTop||0}"></label><label>BOTTOM GAP<input type="number" data-k="marginBottom" value="${s.marginBottom??12}"></label><label>OVERLAP PX<input type="number" data-k="overlap" value="${s.overlap??-30}"></label></div><div class="row3"><label><input type="checkbox" data-k="fullBleed" ${s.fullBleed?'checked':''}> FULL BLEED</label><label><input type="checkbox" data-k="allowOverlap" ${s.allowOverlap?'checked':''}> OVERLAP</label><label><input type="checkbox" data-k="sticky" ${s.sticky?'checked':''}> STICKY</label></div></div>`}
function fields(s){if(s.type==='legacy-html')return `<label>ORIGINAL HTML<textarea data-k="html">${esc(s.html||'')}</textarea></label><p class="tiny">Keep this while migrating old projects. Replace with new blocks when ready.</p>`;if(s.type==='text')return `<label>TEXT<textarea data-k="text">${esc(s.text||'')}</textarea></label><div class="row3"><label>SIZE PX<input type="number" data-k="fontSize" value="${s.fontSize||11}"></label><label>LEADING<input type="number" step=".05" data-k="leading" value="${s.leading||1.4}"></label><label>TRACKING PX<input type="number" step=".1" data-k="tracking" value="${s.tracking??.3}"></label></div><div class="row3"><label>WRAP<select data-k="wrap"><option ${s.wrap==='normal'?'selected':''}>normal</option><option ${s.wrap==='pretty'?'selected':''}>pretty</option><option ${s.wrap==='balance'?'selected':''}>balance</option></select></label><label>ALIGN<select data-k="textAlign"><option>left</option><option ${s.textAlign==='center'?'selected':''}>center</option><option ${s.textAlign==='right'?'selected':''}>right</option><option ${s.textAlign==='justify'?'selected':''}>justify</option></select></label><label>COLUMNS<input type="number" min="1" max="4" data-k="columns" value="${s.columns||1}"></label></div><div class="row3"><label>CASE<select data-k="case"><option value="uppercase">UPPERCASE</option><option value="none" ${s.case==='none'?'selected':''}>AS TYPED</option><option value="lowercase" ${s.case==='lowercase'?'selected':''}>lowercase</option></select></label><label><input type="checkbox" data-k="vertical" ${s.vertical?'checked':''}> VERTICAL</label><label><input type="checkbox" data-k="marquee" ${s.marquee?'checked':''}> MARQUEE</label></div>${generalLayout(s)}`;if(s.type==='spacer')return `<label>HEIGHT PX<input type="number" data-k="height" value="${s.height||40}"></label>`+generalLayout(s);if(s.type==='embed')return `<label>HTML<textarea data-k="html">${esc(s.html||'')}</textarea></label>`+generalLayout(s);let f=`<label>FILE / URL<input data-k="src" value="${esc(s.src||'')}"></label>`;if(s.type==='svg')f+=`<label>INLINE SVG<textarea data-k="code">${esc(s.code||'')}</textarea></label>`;f+=`<div class="row3"><label>FIT<select data-k="fit"><option>contain</option><option ${s.fit==='cover'?'selected':''}>cover</option><option ${s.fit==='fill'?'selected':''}>fill</option></select></label><label>OPACITY<input type="number" min="0" max="1" step=".05" data-k="opacity" value="${s.opacity??1}"></label><label>ALT<input data-k="alt" value="${esc(s.alt||'')}"></label></div>`;if(['image','svg','lottie'].includes(s.type))f+=`<div class="row"><label>TEXT FLOW<select data-k="float"><option value="none">none</option><option ${s.float==='left'?'selected':''}>left</option><option ${s.float==='right'?'selected':''}>right</option></select></label><label>SHAPE<select data-k="shape"><option>box</option><option ${s.shape==='circle'?'selected':''}>circle</option><option ${s.shape==='ellipse'?'selected':''}>ellipse</option></select></label></div>`;return f+generalLayout(s)}
function preview(){const x=p(),v=$('#projectPreview');if(!x){v.innerHTML='';return}v.innerHTML=`<strong style="display:block;margin-bottom:14px">${esc(x.name)}</strong>`;(x.sections||[]).forEach(s=>{const b=document.createElement('div');b.className='preview-block'+(s.layoutMode==='free'?' preview-free':'')+(s.fullBleed?' preview-fullbleed':'');b.style.width=s.width||'100%';b.style.left=s.left||'0%';b.style.top=typeof s.top==='number'?s.top+'px':(s.top||'0px');b.style.transform=`translate(${s.offsetX||0}px,${s.offsetY||0}px) rotate(${s.rotate||0}deg)`;b.style.zIndex=s.zIndex??1;b.style.marginTop=(s.marginTop||0)+'px';b.style.marginBottom=(s.marginBottom??12)+'px';if(s.allowOverlap)b.style.marginTop=(s.overlap??-30)+'px';if(s.sticky){b.style.position='sticky';b.style.top='0'}if(s.type==='legacy-html')b.innerHTML=s.html||'';else if(s.type==='text'){b.classList.add('preview-text');b.style.fontSize=(s.fontSize||11)+'px';b.style.lineHeight=s.leading||1.4;b.style.letterSpacing=(s.tracking??.3)+'px';b.style.textAlign=s.textAlign||'left';b.style.textTransform=s.case||'uppercase';b.style.columnCount=s.columns||1;if(s.vertical)b.style.writingMode='vertical-rl';if(s.marquee){b.classList.add('preview-marquee');b.innerHTML='<span>'+esc(s.text||'')+'</span>'}else b.textContent=s.text||''}else if(s.type==='spacer'){b.style.height=(s.height||40)+'px'}else if(s.type==='embed')b.innerHTML=s.html||'';else if(s.type==='lottie'){const l=document.createElement('lottie-player');l.setAttribute('src',s.src||'');l.setAttribute('loop','');l.setAttribute('autoplay','');l.style.width='100%';b.appendChild(l)}else if(s.type==='svg'&&s.code){b.innerHTML=s.code}else{const el=document.createElement(s.type==='video'?'video':'img');el.src=s.src||'';el.style.width='100%';el.style.opacity=s.opacity??1;el.style.objectFit=s.fit||'contain';if(el.tagName==='VIDEO'){el.controls=true;el.muted=true;el.loop=true}b.appendChild(el)}v.appendChild(b)})}


function renderProjectsOnly(){
  const old=selected;
  const pl=$('#projects');
  pl.innerHTML='';

  data.projects.forEach((x,i)=>{
    const r=document.createElement('div');
    r.className='project-row'+(i===old?' active':'');
    r.innerHTML=`<button>${esc(x.number)} ${esc(x.name)}</button><button title="Move up">↑</button><button title="Move down">↓</button>`;
    r.children[0].onclick=()=>{sync();selected=i;render()};
    r.children[1].onclick=()=>moveProj(i,-1);
    r.children[2].onclick=()=>moveProj(i,1);
    pl.appendChild(r);
  });
}

function render(){
  renderProjectsOnly();
  const x=p();

  if(!x){
    $('#editor').innerHTML='<p>No project selected.</p>';
    preview();
    return;
  }

  $('#editor').innerHTML=`
    <div class="project-meta">
      GITHUB FILE: <strong>content/projects/${esc(x.id)}.json</strong>
    </div>

    <div class="row">
      <label>PROJECT NAME<input id="name" value="${esc(x.name)}"></label>
      <label>MENU LABEL<input id="menu" value="${esc(x.menuLabel||x.name)}"></label>
      <label>CATEGORY<input id="cat" value="${esc(x.category||'')}"></label>
      <label>PUBLISHED<input id="pub" type="checkbox" ${x.published!==false?'checked':''}></label>
    </div>

    <label>PROJECT FILE SLUG
      <input id="slug" value="${esc(x.id||slugify(x.name))}">
      <span class="slug-note">Exports as ${esc(x.id||slugify(x.name))}.json. If you change this, export the PROJECT INDEX too.</span>
    </label>

    <div class="project-actions">
      <button id="exportThisProject" class="primary">EXPORT THIS PROJECT</button>
      <button id="deleteProject" class="danger">REMOVE FROM PROJECT INDEX</button>
    </div>

    <div class="addbar">
      <button data-add="text">+ TEXT</button>
      <button data-add="image">+ IMAGE</button>
      <button data-add="video">+ VIDEO</button>
      <button data-add="svg">+ SVG</button>
      <button data-add="lottie">+ LOTTIE</button>
      <button data-add="embed">+ EMBED</button>
      <button data-add="spacer">+ SPACER</button>
    </div>

    <div id="blocks"></div>
  `;

  const bs=$('#blocks');

  (x.sections||[]).forEach((s,i)=>{
    const b=document.createElement('div');
    b.className='block'+(s.type==='legacy-html'?' legacy':'');
    b.innerHTML=`<div class="blockHead"><strong>${s.type.toUpperCase()}</strong><button data-dup>DUPLICATE</button><button data-up>↑</button><button data-down>↓</button><button data-del>DELETE</button></div><div class="blockBody">${fields(s)}</div>`;

    b.querySelector('[data-dup]').onclick=()=>duplicateBlock(i);
    b.querySelector('[data-up]').onclick=()=>moveBlock(i,-1);
    b.querySelector('[data-down]').onclick=()=>moveBlock(i,1);
    b.querySelector('[data-del]').onclick=()=>{sync();x.sections.splice(i,1);render()};

    b.querySelectorAll('[data-k]').forEach(el=>{
      el.oninput=()=>{sync();preview()};
      el.onchange=el.oninput;
    });

    bs.appendChild(b);
  });

  document.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>{
    sync();
    const t=btn.dataset.add;
    let s={type:t,layoutMode:'flow',width:'100%',mobileWidth:'100%',marginBottom:12};

    if(t==='text'){
      Object.assign(s,{text:'',wrap:'pretty',fontSize:11,leading:1.4,tracking:.3,textAlign:'left',columns:1,case:'uppercase'});
    }else if(t==='spacer'){
      s.height=40;
    }else if(t==='embed'){
      s.html='';
    }else{
      Object.assign(s,{src:'',alt:'',opacity:1,fit:'contain',float:'none',shape:'box'});
    }

    x.sections.push(s);
    render();
  });

  ['name','menu','cat','pub','slug'].forEach(id=>{
    $('#'+id).oninput=()=>{
      const before=x.id;
      sync();
      if(id==='slug'&&before!==x.id){
        setStatus('Slug changed. Export THIS PROJECT and the PROJECT INDEX when publishing.','warn');
      }
      renderProjectsOnly();
      preview();
    };
  });

  $('#exportThisProject').onclick=exportCurrentProject;

  $('#deleteProject').onclick=()=>{
    sync();
    const doomed=p();
    if(!confirm(`Remove "${doomed.name}" from the project index? Its JSON file will remain on GitHub unless you delete it manually.`))return;
    data.projects.splice(selected,1);
    selected=Math.min(selected,data.projects.length-1);
    seq();
    setStatus('Removed from CMS list. Export PROJECT INDEX to publish the removal.','warn');
    render();
  };

  preview();
}

function downloadJSON(filename,value){
  const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=filename;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function cleanProjectForExport(project){
  const clone=JSON.parse(JSON.stringify(project));
  delete clone.order;
  delete clone.number;
  return clone;
}

function exportCurrentProject(){
  sync();
  const project=p();
  if(!project)return;
  project.id=uniqueSlug(project.id||project.name,selected);
  downloadJSON(`${project.id}.json`,cleanProjectForExport(project));
  setStatus(`Exported ${project.id}.json. Upload it to content/projects/ on GitHub.`,'ok');
}

function exportIndex(){
  sync();
  seq();
  downloadJSON('projects.json',{
    version:'5.0',
    projects:data.projects.map(project=>project.id)
  });
  setStatus('Exported projects.json. Upload it as content/projects.json on GitHub.','ok');
}

async function loadSiteProjects(){
  setStatus('Loading project index and individual project files…');

  try{
    const manifestResponse=await fetch('../content/projects.json',{cache:'no-store'});
    if(!manifestResponse.ok)throw new Error(`Project index returned HTTP ${manifestResponse.status}`);

    const manifest=await manifestResponse.json();
    const slugs=Array.isArray(manifest.projects)?manifest.projects:[];

    const loaded=await Promise.all(slugs.map(async(slug,index)=>{
      const response=await fetch(`../content/projects/${encodeURIComponent(slug)}.json`,{cache:'no-store'});
      if(!response.ok)throw new Error(`${slug}.json returned HTTP ${response.status}`);
      const project=await response.json();

      return {
        ...project,
        id:project.id||slug,
        order:index+1,
        number:String(index+1).padStart(2,'0')
      };
    }));

    data={version:'5.0',projects:loaded};
    selected=loaded.length?0:-1;
    seq();
    render();
    setStatus(`Loaded ${loaded.length} separate project files. You can now export/edit one project without replacing the others.`,'ok');
  }catch(error){
    console.error(error);
    data={version:'5.0',projects:[]};
    selected=-1;
    render();
    setStatus(`Could not load site projects: ${error.message}`,'error');
  }
}

$('#newProject').onclick=()=>{
  sync();

  const id=uniqueSlug(`new-project-${Date.now().toString().slice(-5)}`);
  data.projects.push({
    id,
    name:'NEW PROJECT',
    menuLabel:'NEW PROJECT',
    category:'EXPERIMENTAL',
    published:true,
    sections:[]
  });

  seq();
  selected=data.projects.length-1;
  setStatus('New project created. Publish by exporting THIS PROJECT plus the PROJECT INDEX.','warn');
  render();
};

$('#loadSiteBtn').onclick=loadSiteProjects;
$('#exportProjectBtn').onclick=exportCurrentProject;
$('#exportIndexBtn').onclick=exportIndex;

$('#desktopBtn').onclick=()=>{
  $('#previewViewport').classList.remove('mobile');
  $('#desktopBtn').classList.add('active');
  $('#mobileBtn').classList.remove('active');
};

$('#mobileBtn').onclick=()=>{
  $('#previewViewport').classList.add('mobile');
  $('#mobileBtn').classList.add('active');
  $('#desktopBtn').classList.remove('active');
};

render();
loadSiteProjects();
