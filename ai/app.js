const API='https://xyfer-ai.xmeofrmda308.workers.dev';
const STORE='xyfer-ai-chats-v1';
const $=selector=>document.querySelector(selector);
let chats=load(),active=chats[0]?.id,busy=false;

function load(){try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return[]}}
function save(){localStorage.setItem(STORE,JSON.stringify(chats.slice(0,50)))}
function current(){return chats.find(chat=>chat.id===active)}
function createChat(){const chat={id:crypto.randomUUID(),title:'New chat',created:Date.now(),messages:[]};chats.unshift(chat);active=chat.id;save();return chat.id}
function escapeHtml(value){const div=document.createElement('div');div.textContent=value;return div.innerHTML}
function renderHistory(){$('#history').innerHTML=chats.map(chat=>`<button class="history-item${chat.id===active?' active':''}" data-id="${chat.id}" title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}</button>`).join('')}
function render(){const chat=current();$('#chat-title').textContent=chat.title;renderHistory();const area=$('#messages');if(!chat.messages.length){area.innerHTML=$('.welcome-template')?.innerHTML||welcome;bindSuggestions();return}area.innerHTML=chat.messages.map(message=>`<article class="message ${message.role==='assistant'?'ai':'user'}"><div class="avatar">${message.role==='assistant'?'X':'You'}</div><div class="bubble">${escapeHtml(message.content)}</div></article>`).join('');area.scrollTop=area.scrollHeight}
const welcome=$('#messages').innerHTML;
if(!active)active=createChat();
function bindSuggestions(){document.querySelectorAll('.suggestions button').forEach(button=>button.onclick=()=>{$('#prompt').value=button.textContent;resize();$('#prompt').focus()})}
function resize(){const input=$('#prompt');input.style.height='auto';input.style.height=Math.min(input.scrollHeight,160)+'px'}
async function send(text){const chat=current();chat.messages.push({role:'user',content:text});if(chat.title==='New chat')chat.title=text.slice(0,42)+(text.length>42?'…':'');save();render();busy=true;$('#send').disabled=true;const area=$('#messages');area.insertAdjacentHTML('beforeend','<article class="message ai typing" id="typing"><div class="avatar">X</div><div class="bubble"></div></article>');area.scrollTop=area.scrollHeight;try{const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:chat.messages.slice(-40)})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Request failed');chat.messages.push({role:'assistant',content:data.message})}catch(error){chat.messages.push({role:'assistant',content:`Sorry, I couldn't respond right now. ${error.message}`})}finally{busy=false;$('#send').disabled=false;save();render();$('#prompt').focus()}}
$('#composer').onsubmit=event=>{event.preventDefault();const text=$('#prompt').value.trim();if(!text||busy)return;$('#prompt').value='';resize();send(text)};
$('#prompt').oninput=resize;$('#prompt').onkeydown=event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();$('#composer').requestSubmit()}};
$('#new-chat').onclick=()=>{createChat();render();document.body.classList.remove('sidebar-open');$('#prompt').focus()};
$('#history').onclick=event=>{const item=event.target.closest('[data-id]');if(!item)return;active=item.dataset.id;render();document.body.classList.remove('sidebar-open')};
$('#delete-chat').onclick=()=>{chats=chats.filter(chat=>chat.id!==active);active=chats[0]?.id||createChat();save();render()};
$('#menu').onclick=()=>document.body.classList.add('sidebar-open');$('#close-sidebar').onclick=()=>document.body.classList.remove('sidebar-open');
render();
