/* Executes the real app against a small DOM adapter. This is not browser/visual QA. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const shell=fs.readFileSync(__dirname+'/../src/shell.html','utf8');
class Element {
 constructor(id=''){this.id=id;this.dataset={};this.value='';this.hidden=false;this.textContent='';this.handlers={};this.open=false;this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){},contains(){return false;}};}
 set innerHTML(value){this.html=value;if(value.startsWith('<option')){this.options=[...value.matchAll(/value="([^"]+)"/g)].map(x=>x[1]);if(!this.options.includes(this.value))this.value=this.options[0]||'';}}
 get innerHTML(){return this.html||'';}
 get clientWidth(){return 700;}get clientHeight(){return parseFloat(this.style.height)||630;}
 addEventListener(type,fn){this.handlers[type]=fn;}setAttribute(){}appendChild(){}replaceChildren(){}focus(){}reset(){}
 querySelector(){return null;}closest(){return this;}showModal(){this.open=true;}close(){this.open=false;}
}
const elements=new Map([...shell.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element(m[1])]));
const root=elements.get('life-atlas'),brand=new Element('brand');
const navs=['map','quests','achievements'].map(v=>{const e=new Element();e.dataset.view=v;return e;});
root.querySelector=selector=>selector==='.brand'?brand:selector.startsWith('#')?elements.get(selector.slice(1))||null:null;
root.querySelectorAll=selector=>selector==='[data-view]'?navs:selector==='dialog[open]'?[...elements.values()].filter(e=>e.open):[];
elements.get('status-filter').value='all';
const store=new Map(),context={document:{getElementById:id=>elements.get(id),createElement:()=>new Element(),createElementNS:()=>new Element()},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},window:{LIFE_ATLAS_PREVIEW:false,confirm:()=>true,matchMedia:()=>({matches:true})},ResizeObserver:class{observe(){}},setTimeout:()=>1,clearTimeout(){},console,crypto:require('node:crypto').webcrypto,Blob,URL};
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname+'/../src/engine.js','utf8')+'\n'+fs.readFileSync(__dirname+'/../src/app.js','utf8'),context);
const state=()=>JSON.parse(store.get('life-atlas-v1'));
const click=dataset=>{const b=new Element();b.dataset=dataset;root.handlers.click({target:b});};
assert.ok(elements.get('world-nodes').innerHTML.includes('Recreation'));
click({focus:'work'});assert.equal(elements.get('panel-title').textContent,'University quests');
click({focus:'lab'});assert.ok(elements.get('world-nodes').innerHTML.includes('Grants'));
const t=state().tasks[0],before=state().xp;
const slider=new Element();slider.dataset.progress=t.id;slider.value='100';root.handlers.change({target:slider});
assert.equal(state().tasks.find(x=>x.id===t.id).progress,100);assert.ok(state().xp>before);
const earned=state().xp;click({toggle:t.id});click({toggle:t.id});assert.equal(state().xp,earned);
click({edit:t.id});assert.equal(elements.get('quest-title').value,t.title);
elements.get('quest-title').value='Updated title';elements.get('quest-form').handlers.submit({preventDefault(){}});assert.equal(state().tasks.find(x=>x.id===t.id).title,'Updated title');
for(const id of ['work','recreation','home','social','hobbies'])click({removeBranch:id});
assert.equal(state().nodes.length,1);assert.equal(state().tasks.length,0);
const add=new Element();add.classList.contains=x=>x==='add-quest';root.handlers.click({target:add});
assert.equal(elements.get('quest-branch').value,'life');elements.get('quest-title').value='A new beginning';elements.get('quest-form').handlers.submit({preventDefault(){}});
assert.equal(state().tasks.length,1);assert.equal(state().tasks[0].node,'life');
console.log('Passed: real app startup, hierarchy navigation, progress saving, XP replay prevention, task editing, branch deletion, and creation in an empty map. Visual layout and native browser APIs are not tested by this adapter.');
