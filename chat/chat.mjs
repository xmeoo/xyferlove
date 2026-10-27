import {joinRoom,selfId} from 'https://cdn.jsdelivr.net/npm/@trystero-p2p/nostr@0.26.0/+esm';

const $=selector=>document.querySelector(selector);
const messages=$('#messages'),empty=$('#empty'),nameInput=$('#name'),messageInput=$('#message'),sendButton=$('#send');
const peers=new Map(),blocked=new Set(),seen=new Set();
let lastSent=0;

function cleanName(value){return String(value||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,24)||'Guest'}
function randomName(){return `Guest-${crypto.getRandomValues(new Uint16Array(1))[0].toString(16).padStart(4,'0').slice(-4)}`}
let myName=cleanName(localStorage.getItem('xyfer-chat-name')||randomName());
nameInput.value=myName;

function setStatus(text,live=false){$('#status').textContent=text;$('#dot').classList.toggle('live',live)}
function updateOnline(){const count=peers.size+1;$('#online').textContent=`· ${count} online`}
function timeLabel(value){return new Date(value).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}
function remember(id){seen.add(id);if(seen.size>500)seen.delete(seen.values().next().value)}
function addSystem(text){empty.hidden=true;const item=document.createElement('div');item.className='system';item.textContent=text;messages.append(item);messages.scrollTop=messages.scrollHeight}
function addMessage(data,peerId,mine=false){
  if(!data||typeof data.id!=='string'||seen.has(data.id)||blocked.has(peerId))return;
  const text=typeof data.text==='string'?data.text.trim().slice(0,400):'';
  if(!text)return;
  remember(data.id);empty.hidden=true;
  const item=document.createElement('article');item.className='message'+(mine?' mine':'');item.dataset.peer=peerId;
  const meta=document.createElement('div');meta.className='meta';
  const author=document.createElement('span');author.className='name';author.textContent=mine?'You':cleanName(peers.get(peerId)?.name||data.name);
  const time=document.createElement('span');time.textContent=timeLabel(Number.isFinite(data.time)?data.time:Date.now());
  meta.append(author,time);
  if(!mine){const block=document.createElement('button');block.className='block';block.type='button';block.textContent='Block';block.title='Hide this person for this session';block.onclick=()=>{blocked.add(peerId);messages.querySelectorAll(`[data-peer="${CSS.escape(peerId)}"]`).forEach(node=>node.remove());addSystem(`${author.textContent} blocked for this session`)};meta.append(block)}
  const body=document.createElement('div');body.className='text';body.textContent=text;
  item.append(meta,body);messages.append(item);messages.scrollTop=messages.scrollHeight;
}

try{
  const room=joinRoom({appId:'io.github.xmeoo.xyferlove.public-chat.v1'},'public-lobby');
  const profileAction=room.makeAction('profile');
  const chatAction=room.makeAction('chat');
  const rates=new Map();
  room.onPeerJoin=peerId=>{peers.set(peerId,{name:'Guest'});updateOnline();profileAction.send({name:myName},{target:peerId})};
  room.onPeerLeave=peerId=>{peers.delete(peerId);rates.delete(peerId);updateOnline()};
  profileAction.onMessage=(data,{peerId})=>{if(peers.has(peerId)&&data&&typeof data.name==='string')peers.set(peerId,{name:cleanName(data.name)})};
  chatAction.onMessage=(data,{peerId})=>{const now=Date.now(),recent=(rates.get(peerId)||[]).filter(t=>now-t<10000);if(recent.length>=6)return;recent.push(now);rates.set(peerId,recent);addMessage(data,peerId)};
  setStatus('Connected',true);updateOnline();messageInput.disabled=false;sendButton.disabled=false;empty.innerHTML='No messages yet.<br>Say hello to everyone online.';
  $('#save-name').onclick=()=>{myName=cleanName(nameInput.value);nameInput.value=myName;localStorage.setItem('xyfer-chat-name',myName);profileAction.send({name:myName});addSystem('Name saved')};
  $('#clear').onclick=()=>{messages.replaceChildren(empty);empty.hidden=false;empty.innerHTML='Messages cleared on this device.<br>You are still connected.';seen.clear()};
  $('#composer').onsubmit=event=>{event.preventDefault();const text=messageInput.value.trim();const now=Date.now();if(!text||now-lastSent<750)return;lastSent=now;const data={id:`${selfId}-${now}-${crypto.randomUUID()}`,name:myName,text:text.slice(0,400),time:now};chatAction.send(data);addMessage(data,selfId,true);messageInput.value='';messageInput.focus()};
  addEventListener('pagehide',()=>room.leave());
}catch(error){console.error(error);setStatus('Chat unavailable');empty.innerHTML='The public room could not connect.<br>Check your network and reload this page.'}
