(() => {
  'use strict';
  const E=LifeEngine,root=document.getElementById('life-atlas'),$=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
  const KEY='life-atlas-v1',preview=window.LIFE_ATLAS_PREVIEW===true;
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons={heart:'♥',soul:'✦',smile:'☀',strength:'ϟ',work:'🏛',recreation:'☀',home:'⌂',social:'♟',hobbies:'🎨',lab:'🔬',book:'📖',scroll:'📜',trophy:'🏆',moon:'☾',leaf:'🌿',spark:'✦',bike:'🚲',bolt:'ϟ',mountain:'⛰',compass:'✥',crown:'♛',star:'★'};
  const atlas={work:'0% 0%',recreation:'50% 0%',home:'100% 0%',social:'0% 100%',hobbies:'50% 100%',lab:'100% 100%'};
  const colors={life:'#ff7caa',work:'#62e4cc',recreation:'#ffd17c',home:'#bda0ff',social:'#ff9e8b',hobbies:'#8fb9ff'};
  const statColors={heart:'#ff87ab',soul:'#baa0ff',smile:'#ffd17c',strength:'#62e4cc'};
  let state,focus='life',activeView='map',storageBlocked=false,toastTimer;
  try {state=preview?E.fresh():E.validate(JSON.parse(localStorage.getItem(KEY)||'null'));}
  catch(error){
    state=E.fresh();
    if(!preview){try{if(localStorage.getItem(KEY)){storageBlocked=true;warn('Saved data could not be loaded. Import a valid backup or start an empty world to continue saving.');}}catch{storageBlocked=true;warn('Browser storage is unavailable. You can still use the app and export a backup.');}}
  }
  function warn(message){$('#save-warning').textContent=message;$('#save-warning').hidden=false;}
  function persist(){
    if(preview){$('#save-state').textContent='Interactive preview · changes last while open';return;}
    if(storageBlocked){$('#save-state').textContent='Not saved · export a backup';return;}
    try{localStorage.setItem(KEY,JSON.stringify(state));$('#save-state').textContent='Saved in this browser';$('#save-warning').hidden=true;}
    catch{storageBlocked=true;warn('Your browser could not save this update. Export a backup before closing.');$('#save-state').textContent='Not saved · export a backup';}
  }
  function toast(message){clearTimeout(toastTimer);const t=$('#toast');t.textContent=message;t.classList.add('visible');toastTimer=setTimeout(()=>t.classList.remove('visible'),4200);}
  function celebrate(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const stage=$('#celebration');stage.replaceChildren();
    for(let i=0;i<28;i++){const p=document.createElement('i');p.className='confetti';const a=Math.PI*2*i/28;p.style.setProperty('--dx',Math.cos(a)*(140+Math.random()*200)+'px');p.style.setProperty('--dy',Math.sin(a)*220+150+'px');p.style.setProperty('--particle-color',[colors.work,colors.life,colors.recreation][i%3]);stage.appendChild(p);}
    setTimeout(()=>stage.replaceChildren(),1300);
  }
  function commit(focusInfo){
    const notices=E.reconcile(state);persist();render();
    if(focusInfo){const section=$('#'+activeView+'-view');section.querySelector('['+focusInfo.attribute+'="'+focusInfo.id+'"]')?.focus({preventScroll:true});}
    const earned=notices.filter(n=>n.type==='xp').reduce((sum,n)=>sum+n.amount,0),badges=notices.filter(n=>n.type==='achievement');
    if(badges.length){toast('Achievement unlocked: '+badges.map(n=>n.name).join(' · '));celebrate();}
    else if(notices.some(n=>n.type==='complete')){toast('Quest complete! '+(earned?'+'+earned+' XP':''));celebrate();}
    else if(earned)toast('+'+earned+' XP · progress saved');
  }
  function color(id){const top=E.trail(state,id)[1]?.id||id;return colors[top]||colors.work;}
  function pct(value){return value===null?'—':Math.round(value)+'%';}
  function icon(name){return icons[name]||'✦';}
  function art(name,progress){
    const content=atlas[name]?'<span class="art art-empty"></span><span class="art art-full"></span>':name==='heart'?'<span class="art art-heart art-empty"></span><span class="art art-heart art-full"></span>':'<span class="art symbol-art art-empty">'+icon(name)+'</span><span class="art symbol-art art-full">'+icon(name)+'</span>';
    return '<span class="art-window" style="--art-position:'+(atlas[name]||'0% 0%')+';--progress:'+progress+'">'+content+'</span>';
  }
  function graphic(name,progress,rank,expand){
    const p=progress===null?0:progress;
    return '<span class="node-graphic"><svg class="progress-ring" viewBox="0 0 140 140" aria-hidden="true"><circle class="ring-track" cx="70" cy="70" r="65"/><circle class="ring-value" cx="70" cy="70" r="65" pathLength="100" stroke-dasharray="'+p+' 100"/></svg>'+art(name,p)+(rank?'<span class="node-rank '+rank.toLowerCase()+'" aria-label="'+rank+' achievement badge">'+(rank==='Gold'?'♛':'★')+'</span>':'')+(expand?'<span class="expand-mark" aria-hidden="true">+</span>':'')+'</span>';
  }
  function renderMap(){
    const map=$('#world-map'),w=map.clientWidth;if(!w)return;
    const center=E.node(state,focus)||E.node(state,'life'),branches=E.children(state,center.id),direct=state.tasks.filter(t=>t.node===center.id);
    let items=branches.map(n=>({id:n.id,name:n.name,icon:n.icon,p:E.score(state,n.id),rank:E.medal(state,n.id),type:'branch',color:color(n.id)}));
    if(!branches.length)items=direct.map(t=>({id:t.id,name:t.title,icon:t.progress===100?'star':'scroll',p:t.progress,type:'task',color:color(t.node)}));
    else if(direct.length)items.push({id:'journal',name:'Direct quests',icon:'scroll',p:direct.reduce((s,t)=>s+t.progress*t.effort,0)/direct.reduce((s,t)=>s+t.effort,0),type:'journal',color:color(focus)});
    if(items.length>8)items=[...items.slice(0,7),{id:'journal',name:'All quests',icon:'book',p:null,type:'journal',color:color(focus)}];
    const mobile=w<540,cx=w/2,ry=mobile?210:200,rx=Math.min((w-(mobile?114:176))/2,285);
    let cy=mobile?335:310;
    const n=items.length;
    const angles=n===1?[-90]:n===2?[-90,90]:n===3?[-90,30,150]:n===4?[-90,0,90,180]:Array.from({length:n},(_,i)=>-90+i*360/n);
    let list=items.map((it,i)=>({...it,x:cx+Math.cos(angles[i]*Math.PI/180)*rx,y:cy+Math.sin(angles[i]*Math.PI/180)*ry}));
    if(mobile&&n<=5){const left=57,right=w-57;const layouts={1:[[cx,90]],2:[[cx,90],[cx,520]],3:[[cx,90],[right,510],[left,510]],4:[[left,130],[right,130],[right,510],[left,510]],5:[[cx,83],[right,205],[right,515],[left,515],[left,205]]};list=items.map((it,i)=>({...it,x:layouts[n][i][0],y:layouts[n][i][1]}));}
    if(n>5){cy=130;const cols=mobile?2:3;list=items.map((it,i)=>({...it,x:w*(i%cols+.5)/cols,y:350+Math.floor(i/cols)*200}));map.style.height=(460+Math.ceil(n/cols)*200)+'px';}else map.style.height='';
    const cp=E.score(state,center.id),cr=E.medal(state,center.id);
    $('#world-nodes').innerHTML='<div class="world-node core '+(cp===100?'complete-node':'')+'" style="left:'+cx+'px;top:'+cy+'px;--node-color:'+color(center.id)+';--progress:'+(cp||0)+'" aria-label="'+esc(center.name)+' '+pct(cp)+'">'+graphic(center.icon,cp,cr,false)+'<span class="node-name">'+esc(center.name)+'</span><span class="node-number">'+pct(cp)+'</span></div>'+list.map(it=>'<button class="world-node '+(it.p===100?'complete-node':'')+'" data-'+(it.type==='branch'?'focus':it.type==='task'?'edit':'journal')+'="'+it.id+'" style="left:'+it.x+'px;top:'+it.y+'px;--node-color:'+it.color+';--progress:'+(it.p||0)+'" aria-label="'+esc(it.name)+', '+pct(it.p)+(it.type==='branch'?', explore branch':'')+'">'+graphic(it.icon,it.p,it.rank,it.type==='branch')+'<span class="node-name">'+esc(it.name)+'</span><span class="node-number">'+pct(it.p)+'</span></button>').join('');
    const svg=$('#connections');svg.setAttribute('viewBox','0 0 '+w+' '+map.clientHeight);svg.replaceChildren();
    for(const it of list){const dx=it.x-cx,dy=it.y-cy,len=Math.hypot(dx,dy),r1=mobile?78:103,r2=mobile?57:78;const x1=cx+dx/len*r1,y1=cy-20+dy/len*r1,x2=it.x-dx/len*r2,y2=it.y-20-dy/len*r2;const d='M '+x1+' '+y1+' Q '+(x1+x2)/2+' '+((y1+y2)/2+16)+' '+x2+' '+y2;for(const kind of ['base-link','lit-link']){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);p.setAttribute('class',kind);if(kind==='lit-link'){p.setAttribute('pathLength','100');p.setAttribute('stroke-dasharray',(it.p||0)+' 100');p.style.setProperty('--node-color',it.p===100?colors.recreation:it.color);}svg.appendChild(p);}}
    if(!items.length){const empty=document.createElement('p');empty.className='map-caption';empty.textContent='Your first quest will light up this branch.';$('#world-nodes').appendChild(empty);}
    $('#breadcrumbs').innerHTML=E.trail(state,center.id).map((n,i)=>(i?'<span class="secondary">/</span>':'')+'<button data-crumb="'+n.id+'">'+esc(n.name)+'</button>').join('');
  }
  function sortedTasks(id){return E.tasksFor(state,id).slice().sort((a,b)=>(a.progress===100)-(b.progress===100)||(a.due||'9999').localeCompare(b.due||'9999'));}
  function taskCard(t){
    const branch=E.node(state,t.node),done=t.progress===100;
    return '<article class="quest-card '+(done?'done':'')+'"><div class="quest-top"><button class="quest-check '+(done?'done':'')+'" data-toggle="'+t.id+'" aria-label="'+(done?'Mark incomplete: ':'Complete: ')+esc(t.title)+'" aria-pressed="'+done+'">'+(done?'✓':'')+'</button><div><button class="quest-name" data-edit="'+t.id+'">'+esc(t.title)+'</button><div class="quest-meta"><span>'+esc(branch?.name||'Quest')+'</span><span>·</span><span class="xp-tag">'+t.reward+' XP quest</span><span aria-label="'+t.stat+'">'+icon(t.stat)+'</span>'+(t.due?'<span>Due '+esc(t.due)+'</span>':'')+'</div></div></div><label class="quest-progress"><span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)">Progress for '+esc(t.title)+'</span><input type="range" min="0" max="100" step="5" value="'+t.progress+'" data-progress="'+t.id+'" aria-label="Progress for '+esc(t.title)+'"><output>'+Math.round(t.progress)+'%</output></label></article>';
  }
  function empty(){return '<div class="empty-state"><span>✦</span>No quests here yet.<br>Add a small step to begin.</div>';}
  function renderPanel(){
    const n=E.node(state,focus),list=sortedTasks(focus),done=list.filter(t=>t.progress===100).length;
    $('#panel-path').textContent=focus==='life'?'YOUR WORLD':E.trail(state,focus).slice(0,-1).map(x=>x.name).join(' / ');
    $('#panel-title').textContent=focus==='life'?'Next quests':n.name+' quests';
    $('#branch-summary').innerHTML='<div class="branch-summary"><span>'+done+' of '+list.length+' quests complete</span><span>'+pct(E.score(state,focus))+'</span></div>';
    $('#focus-quests').innerHTML=list.slice(0,4).map(taskCard).join('')||empty();
    $('#all-quests').textContent='View all '+list.length+' quests';
    const next=E.definitions.filter(a=>!state.achievements.includes(a.id)).sort((a,b)=>b.count(state)/b.target-a.count(state)/a.target)[0];
    $('#next-achievement').innerHTML=next?'<div class="next-badge"><span class="badge-symbol">'+icon(next.icon)+'</span><div><p class="eyebrow">NEXT ACHIEVEMENT</p><h3>'+next.name+'</h3><p>'+next.description+' '+Math.min(next.target,next.count(state))+'/'+next.target+'</p></div></div>':'<div class="next-badge"><span class="badge-symbol">♛</span><div><h3>A complete constellation</h3><p>Every achievement earned.</p></div></div>';
  }
  function renderJournal(){
    const area=$('#area-filter').value||'life',filter=$('#status-filter').value;
    const list=sortedTasks(E.node(state,area)?area:'life').filter(t=>filter==='all'||(filter==='done'?t.progress===100:t.progress<100));
    $('#quest-journal').innerHTML=list.map(taskCard).join('')||empty();
  }
  function renderAchievements(){
    $('#achievement-count').textContent=state.achievements.length+' / '+E.definitions.length+' unlocked';
    $('#achievement-grid').innerHTML=E.definitions.map(a=>{const earned=state.achievements.includes(a.id),count=Math.min(a.target,a.count(state));return '<article class="achievement-card '+(earned?'unlocked':'locked')+'"><span class="badge-symbol" aria-hidden="true">'+icon(a.icon)+'</span><h3>'+a.name+'</h3><p>'+a.description+'</p><div class="xp-track"><span style="width:'+(earned?100:count/a.target*100)+'%"></span></div><div class="achievement-bottom"><span>'+(earned?'✓ Unlocked':count+' / '+a.target)+'</span><small>+'+a.xp+' XP</small></div></article>';}).join('');
  }
  function branchOptions(includeRoot=true){return state.nodes.filter(n=>includeRoot||n.id!=='life').map(n=>'<option value="'+n.id+'">'+esc(E.trail(state,n.id).map(x=>x.name).join(' / '))+'</option>').join('');}
  function render(){
    if(!E.node(state,focus))focus='life';
    const lev=E.level(state.xp);$('#level-number').textContent=lev.n;$('#level-title').textContent='Level '+lev.n;$('#xp-label').textContent=state.xp+' XP';$('#xp-fill').style.width=lev.progress+'%';$('#next-level').textContent=(lev.base+lev.next-state.xp)+' XP to level '+(lev.n+1);$('#quest-count').textContent=state.tasks.filter(t=>t.progress<100).length;
    $('#world-mode').textContent=state.demo?'EXAMPLE WORLD · TRY THE QUESTS':'YOUR WORLD';$('#demo-action').textContent=state.demo?'Start my own world':'Settings & backups';
    $('#vitals').innerHTML=E.STATS.map(stat=>{const p=E.statScore(state,stat);return '<div style="--stat-color:'+statColors[stat]+'"><div class="vital-label"><b>'+icon(stat)+' '+stat[0].toUpperCase()+stat.slice(1)+'</b><span>'+pct(p)+'</span></div><div class="vital-track" role="progressbar" aria-label="'+stat+' quest completion" aria-valuenow="'+Math.round(p||0)+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+(p||0)+'%"></span></div></div>';}).join('');
    const previous=$('#area-filter').value;$('#area-filter').innerHTML=branchOptions();$('#area-filter').value=E.node(state,previous)?previous:'life';
    renderMap();renderPanel();renderJournal();renderAchievements();
  }
  function setView(view){activeView=view;for(const v of ['map','quests','achievements'])$('#'+v+'-view').hidden=v!==view;$$('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false');});if(view==='map')renderMap();}
  function setFocus(id,skipSingle=true){focus=id;if(skipSingle){let c=E.children(state,focus);while(c.length===1&&!state.tasks.some(t=>t.node===focus)){focus=c[0].id;c=E.children(state,focus);}}setView('map');render();}
  function show(id){$('#'+id).showModal();}
  function openQuest(id){
    const t=state.tasks.find(t=>t.id===id);$('#quest-form').reset();$('#quest-id').value=t?.id||'';$('#quest-dialog-title').textContent=t?'Edit quest':'A new quest';$('#quest-title').value=t?.title||'';$('#quest-branch').innerHTML=branchOptions();$('#quest-branch').value=t?.node||(focus==='life'?(E.node(state,'grants')?'grants':'life'):focus);$('#quest-effort').value=t?.effort||3;$('#quest-stat').value=t?.stat||(E.trail(state,focus)[1]?.id==='work'?'soul':'heart');$('#quest-due').value=t?.due||'';$('#delete-quest').hidden=!t;$('#reward-note').textContent=t?'Reward fixed at '+t.reward+' XP. Changing task size changes its progress weight.':'XP is earned as you make progress.';show('quest-dialog');$('#quest-title').focus();
  }
  function startFresh(){if(!window.confirm('Start an empty world? This replaces the current quests, XP, and achievements in this browser. Export a backup first if you want to keep them.'))return;state=E.fresh(false);focus='life';storageBlocked=false;$$('dialog[open]').forEach(d=>d.close());commit();setView('map');toast('Your world is ready. Add your first quest.');}
  function renderBranchEditor(){
    $('#branch-editor').innerHTML=state.nodes.filter(n=>n.id!=='life').map(n=>'<div class="branch-row" style="margin-left:'+Math.min(3,E.trail(state,n.id).length-2)*10+'px"><input data-rename="'+n.id+'" value="'+esc(n.name)+'" maxlength="60" aria-label="Rename '+esc(n.name)+'"><select data-weight="'+n.id+'" aria-label="Weight of '+esc(n.name)+'">'+[1,2,3,4,5].map(w=>'<option value="'+w+'" '+(n.weight===w?'selected':'')+'>'+w+'×</option>').join('')+'</select><button class="delete-branch" data-remove-branch="'+n.id+'" aria-label="Delete '+esc(n.name)+'">×</button></div>').join('');$('#branch-parent').innerHTML=branchOptions();$('#branch-parent').value=focus;
  }
  root.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.view)setView(b.dataset.view);
    if(b.dataset.focus)setFocus(b.dataset.focus);
    if(b.dataset.crumb)setFocus(b.dataset.crumb,false);
    if(b.dataset.edit)openQuest(b.dataset.edit);
    if(b.dataset.journal){$('#area-filter').value=focus;renderJournal();setView('quests');}
    if(b.dataset.toggle){const t=state.tasks.find(t=>t.id===b.dataset.toggle);t.progress=t.progress===100?0:100;commit({attribute:'data-toggle',id:t.id});}
    if(b.classList.contains('add-quest'))openQuest();
    if(b.classList.contains('close-dialog'))b.closest('dialog').close();
    if(b.classList.contains('settings-trigger'))show('settings-dialog');
    if(b.dataset.removeBranch){const id=b.dataset.removeBranch,branch=E.node(state,id),count=E.tasksFor(state,id).length;if(window.confirm('Delete “'+branch.name+'”, its subbranches, and '+count+' quests? Earned XP and badges will remain.')){const ids=state.nodes.filter(n=>E.belongs(state,n.id,id)).map(n=>n.id);state.nodes=state.nodes.filter(n=>!ids.includes(n.id));state.tasks=state.tasks.filter(t=>!ids.includes(t.node));if(ids.includes(focus))focus='life';commit();renderBranchEditor();}}
  });
  root.addEventListener('input',event=>{const el=event.target;if(el.dataset.progress)el.closest('label').querySelector('output').textContent=el.value+'%';});
  root.addEventListener('change',event=>{
    const el=event.target;
    if(el.dataset.progress){const t=state.tasks.find(t=>t.id===el.dataset.progress);t.progress=Number(el.value);commit({attribute:'data-progress',id:t.id});}
    if(el.dataset.rename){const n=E.node(state,el.dataset.rename);if(el.value.trim())n.name=el.value.trim();else el.value=n.name;commit();renderBranchEditor();}
    if(el.dataset.weight){E.node(state,el.dataset.weight).weight=Number(el.value);commit();}
  });
  $('#quest-form').addEventListener('submit',event=>{
    event.preventDefault();const title=$('#quest-title').value.trim();if(!title){$('#quest-title').setCustomValidity('Add a title for this quest.');$('#quest-title').reportValidity();return;}
    let t=state.tasks.find(t=>t.id===$('#quest-id').value);
    if(!t){t=E.task(title,$('#quest-branch').value,0,Number($('#quest-effort').value),$('#quest-stat').value);state.tasks.push(t);}
    t.title=title;t.node=$('#quest-branch').value;t.effort=Number($('#quest-effort').value);t.stat=$('#quest-stat').value;t.due=$('#quest-due').value;$('#quest-dialog').close();commit();toast('Quest saved.');
  });
  $('#quest-title').addEventListener('input',()=>$('#quest-title').setCustomValidity(''));
  $('#delete-quest').addEventListener('click',()=>{const id=$('#quest-id').value;if(!window.confirm('Delete this quest? Earned XP and achievements will remain.'))return;state.tasks=state.tasks.filter(t=>t.id!==id);$('#quest-dialog').close();commit();toast('Quest deleted.');});
  $('#all-quests').addEventListener('click',()=>{$('#area-filter').value=focus;renderJournal();setView('quests');});
  $('#area-filter').addEventListener('change',renderJournal);$('#status-filter').addEventListener('change',renderJournal);
  $('#how-it-works').addEventListener('click',()=>show('help-dialog'));
  $('#demo-action').addEventListener('click',()=>state.demo?startFresh():show('settings-dialog'));
  $('#fresh-world').addEventListener('click',startFresh);
  $('#manage-branches').addEventListener('click',()=>{renderBranchEditor();show('branches-dialog');});
  $('#branch-form').addEventListener('submit',event=>{event.preventDefault();const name=$('#branch-name').value.trim();if(!name)return;if(state.nodes.length>=300){toast('This world has reached its 300-branch limit.');return;}if(E.trail(state,$('#branch-parent').value).length>=20){toast('Add this branch closer to the center of your map.');return;}state.nodes.push({id:E.uid(),parent:$('#branch-parent').value,name,icon:$('#branch-icon').value,weight:1});$('#branch-name').value='';commit();renderBranchEditor();toast('Branch added.');});
  $('#export-data').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='life-atlas-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup exported.');});
  $('#import-data').addEventListener('click',()=>$('#backup-file').click());
  $('#backup-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>8*1024*1024)throw new Error('This backup is too large (maximum 8 MB).');const restored=E.validate(JSON.parse(await file.text()));if(!window.confirm('Replace this world with the imported backup?'))return;state=restored;focus='life';storageBlocked=false;$('#settings-dialog').close();commit();toast('Your world has been restored.');}catch(error){toast(error.message||'The backup could not be imported.');}finally{event.target.value='';}});
  $('.brand').addEventListener('click',event=>{event.preventDefault();setFocus('life',false);});
  new ResizeObserver(()=>{if(activeView==='map')renderMap();}).observe($('#world-map'));
  render();persist();
})();
