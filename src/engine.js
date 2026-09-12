/* Life Atlas: dependency-free progress and achievement engine. */
const LifeEngine = (() => {
  const STATS = ['heart', 'soul', 'smile', 'strength'];
  const uid = () => 'q-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const baseNodes = [
    ['life',null,'Life','heart'], ['work','life','Work','work'], ['recreation','life','Recreation','recreation'],
    ['home','life','Home','home'], ['social','life','Social','social'], ['hobbies','life','Hobbies','hobbies'],
    ['university','work','University','work'], ['lab','university','Lab','lab'], ['teaching','university','Teaching','book'], ['obligations','university','Obligations','scroll'],
    ['grants','lab','Grants','trophy'], ['experiments','lab','Experiments','lab'], ['team','lab','Team','social'],
    ['rest','recreation','Rest & recharge','moon'], ['outdoors','recreation','Outdoors','leaf'],
    ['home-projects','home','Home projects','home'], ['daily-life','home','Daily life','spark'],
    ['friends','social','Friends','social'], ['family','social','Family','heart'],
    ['cycling','hobbies','Cycling','bike'], ['creative','hobbies','Creative projects','hobbies'], ['learning','hobbies','Learning','book']
  ].map(([id,parent,name,icon]) => ({id,parent,name,icon,weight:1}));
  const node = (s,id) => s.nodes.find(n => n.id === id);
  const children = (s,id) => s.nodes.filter(n => n.parent === id);
  function trail(s,id) { const out=[]; let n=node(s,id); while(n) {out.unshift(n); n=node(s,n.parent);} return out; }
  const belongs = (s,child,parent) => trail(s,child).some(n => n.id === parent);
  const tasksFor = (s,id) => s.tasks.filter(t => belongs(s,t.node,id));
  function score(s,id) {
    const parts = children(s,id).map(n=>({value:score(s,n.id),weight:n.weight})).filter(p=>p.value!==null);
    const direct = s.tasks.filter(t=>t.node===id);
    if(direct.length) parts.push({value:direct.reduce((sum,t)=>sum+t.progress*t.effort,0)/direct.reduce((sum,t)=>sum+t.effort,0),weight:1});
    return parts.length ? parts.reduce((sum,p)=>sum+p.value*p.weight,0)/parts.reduce((sum,p)=>sum+p.weight,0) : null;
  }
  function statScore(s,stat) { const list=s.tasks.filter(t=>t.stat===stat); return list.length?list.reduce((sum,t)=>sum+t.progress*t.effort,0)/list.reduce((sum,t)=>sum+t.effort,0):null; }
  const historyFor = (s,id) => s.history.filter(h=>h.trail.includes(id));
  const medal = (s,id) => { const c=historyFor(s,id).length; return c>=10?'Gold':c>=5?'Silver':c>=1?'Bronze':null; };
  const level = xp => { let n=1,base=0,next=200; while(xp>=base+next){base+=next;n++;next=200*n;}return {n,base,next,progress:(xp-base)/next*100}; };
  const definitions = [
    {id:'spark',name:'First spark',icon:'spark',description:'Complete your first quest.',target:1,xp:25,count:s=>s.history.length},
    {id:'momentum',name:'Momentum',icon:'bolt',description:'Complete 5 different quests.',target:5,xp:75,count:s=>s.history.length},
    {id:'big-leap',name:'Big leap',icon:'mountain',description:'Finish one large quest.',target:1,xp:60,count:s=>s.history.filter(h=>h.effort===5).length},
    {id:'wide-world',name:'A wider world',icon:'compass',description:'Finish quests in 3 life areas.',target:3,xp:75,count:s=>new Set(s.history.map(h=>h.area)).size},
    {id:'lab-legend',name:'Lab legend',icon:'lab',description:'Complete 5 lab quests.',target:5,xp:100,count:s=>historyFor(s,'lab').length},
    {id:'golden-heart',name:'Golden heart',icon:'heart',description:'Complete 3 Heart quests.',target:3,xp:75,count:s=>s.history.filter(h=>h.stat==='heart').length},
    {id:'all-rounder',name:'All-rounder',icon:'crown',description:'Finish a quest in every original life area.',target:5,xp:150,count:s=>['work','recreation','home','social','hobbies'].filter(id=>s.history.some(h=>h.area===id)).length},
    {id:'constellation',name:'Constellation',icon:'star',description:'Bring all active life areas to 100%, with at least 5 areas.',target:1,xp:250,count:s=>{const p=children(s,'life').map(n=>score(s,n.id)).filter(v=>v!==null);return p.length>=5&&p.every(v=>v===100)?1:0;}}
  ];
  function reconcile(s) {
    const notices=[];
    for(const t of s.tasks) {
      let entry=s.ledger.find(e=>e.id===t.id);
      if(!entry){entry={id:t.id,high:0,reward:t.reward};s.ledger.push(entry);}
      const previous=Math.floor(entry.reward*entry.high/100);
      entry.high=Math.max(entry.high,t.progress);
      const earned=Math.floor(entry.reward*entry.high/100)-previous;
      if(earned)notices.push({type:'xp',amount:earned});
      if(t.progress===100&&!s.history.some(h=>h.id===t.id)) {
        const path=trail(s,t.node);
        s.history.push({id:t.id,trail:path.map(n=>n.id),area:path[1]?.id||'life',stat:t.stat,effort:t.effort,at:new Date().toISOString()});
        notices.push({type:'complete',name:t.title});
      }
    }
    for(const a of definitions) if(!s.achievements.includes(a.id)&&a.count(s)>=a.target){s.achievements.push(a.id);notices.push({type:'achievement',name:a.name});}
    s.xp=s.ledger.reduce((sum,e)=>sum+Math.floor(e.high*e.reward/100),0)+definitions.filter(a=>s.achievements.includes(a.id)).reduce((sum,a)=>sum+a.xp,0);
    return notices;
  }
  function task(title,branch,progress,effort,stat) { return {id:uid(),title,node:branch,progress,effort,stat,reward:effort*20,due:''}; }
  function fresh(demo=true) {
    const s={version:1,demo,nodes:baseNodes.map(n=>({...n})),tasks:[],ledger:[],history:[],achievements:[],xp:0};
    if(demo)s.tasks=[
      task('Outline the next grant proposal','grants',60,5,'soul'),task('Build the grant budget','grants',25,3,'soul'),
      task('Finish the pilot experiment','experiments',75,5,'soul'),task('Organize the experiment notes','experiments',100,1,'soul'),
      task('Have a team check-in','team',100,1,'heart'),task('Prepare the next lecture','teaching',50,3,'soul'),task('Clear the university paperwork','obligations',25,1,'soul'),
      task('Take an evening off','rest',100,1,'smile'),task('Plan a weekend outdoors','outdoors',50,3,'strength'),
      task('Finish one small home project','home-projects',50,3,'heart'),task('Tidy one corner of the house','daily-life',100,1,'heart'),
      task('Arrange dinner with friends','friends',50,1,'smile'),task('Make time for family','family',75,1,'heart'),
      task('Complete a 40 km cycling goal','cycling',50,3,'strength'),task('Build the first life map','creative',65,5,'smile'),task('Learn one new technique','learning',25,3,'soul')
    ];
    reconcile(s); return s;
  }
  function validate(input) {
    const s=JSON.parse(JSON.stringify(input));
    const fail=()=>{throw new Error('This is not a valid Life Atlas backup.');};
    if(!s||s.version!==1||!Array.isArray(s.nodes)||!Array.isArray(s.tasks)||s.nodes.length>300||s.tasks.length>5000)fail();
    if(!Array.isArray(s.history)||!Array.isArray(s.ledger)||!Array.isArray(s.achievements)||s.history.length>20000||s.ledger.length>20000)fail();
    const validId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,90}$/.test(v);
    const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
    const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
    const ids=new Set();
    for(const n of s.nodes){if(!validId(n.id)||ids.has(n.id)||!text(n.name,60)||!number(n.weight,1,5)||!text(n.icon,30))fail();ids.add(n.id);}
    if(s.nodes.filter(n=>n.parent===null).length!==1||node(s,'life')?.parent!==null)fail();
    for(const n of s.nodes){let x=n,seen=new Set();while(x){if(seen.has(x.id)||seen.size>20)fail();seen.add(x.id);if(x.parent!==null&&!ids.has(x.parent))fail();x=node(s,x.parent);}}
    const tids=new Set();
    for(const t of s.tasks){if(!validId(t.id)||tids.has(t.id)||!text(t.title,160)||!ids.has(t.node)||![1,3,5].includes(t.effort)||!number(t.progress,0,100)||!STATS.includes(t.stat)||!number(t.reward,20,100)||typeof t.due!=='string'||(t.due&&!/^\d{4}-\d{2}-\d{2}$/.test(t.due)))fail();tids.add(t.id);}
    const lids=new Set();for(const e of s.ledger){if(!validId(e.id)||lids.has(e.id)||!number(e.high,0,100)||!number(e.reward,20,100))fail();lids.add(e.id);}
    const hids=new Set();for(const h of s.history){if(!validId(h.id)||hids.has(h.id)||!Array.isArray(h.trail)||h.trail.length>21||!h.trail.every(validId)||!validId(h.area)||!STATS.includes(h.stat)||![1,3,5].includes(h.effort)||typeof h.at!=='string')fail();hids.add(h.id);}
    if(!s.achievements.every(id=>definitions.some(a=>a.id===id))||new Set(s.achievements).size!==s.achievements.length)fail();
    s.demo=!!s.demo;reconcile(s);return s;
  }
  return {STATS,uid,node,children,trail,belongs,tasksFor,score,statScore,historyFor,medal,level,definitions,reconcile,task,fresh,validate};
})();
if(typeof module!=='undefined')module.exports=LifeEngine;
