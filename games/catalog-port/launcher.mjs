const htmlRoot='https://gn-math.dev/s/EE0_FEFXflkxUx5iECccXCcNRB9_GDdDXysSex5LLgFQGDgFPFIDP1U8DFQnJF8MOBh9';
const files={90:['Granny','90-fix3.html'],196:['ULTRAKILL','196-fix2.html'],262:['Half-Life','262-fix.html'],286:['Endoparasitic','286-fix.html'],468:['Hollow Knight','468-fix2.html'],557:['Getting Over It','557-fix2.html'],560:['Deltatraveler','560-fix2.html'],585:['Fallout','585-fix.html'],588:['Super Mario 64','588-fix.html'],589:['Sonic CD','589-fix3.html'],590:['Sonic Mania','590-fix3.html'],591:['Slime Rancher','591-fix2.html'],623:['Celeste','623-fix2.html'],626:['Doom 3','626-fix2.html'],628:['Pizza Tower: Scoutdigo','628-fix2.html'],669:['Terraria','669-fix.html'],695:['Duck Life 8','695-fix.html'],705:['Iron Lung','705-fix2.html'],706:['Fear & Hunger','706-fix2.html'],716:['Clover Pit','716-fix3.html'],718:['Untitled Goose Game','718-fix.html'],723:['Brotato','723-fix.html'],752:['Bad Piggies','752-fix.html'],754:['Minecraft Pocket Edition','754-fix2.html'],771:['Hollow Knight: Silksong','771-fix2.html'],776:['Your Only Move is Hustle','776-fix.html'],789:['Stardew Valley','789-fix2.html'],790:['Helltaker','790-fix.html'],791:["Who's Your Daddy?",'791-fix2.html'],803:['Bendy and the Ink Machine: All Chapters','803-fix2.html'],814:['MiSide','814.html'],819:['20 Minutes Till Dawn','819-fix2.html'],825:['Cruelty Squad','825.html'],826:['Just Shapes & Beats','826-f.html'],827:['Totally Accurate Battle Simulator','827-f.html'],842:['Plants vs. Zombies GOTY','842.html']};
const id=Number(new URLSearchParams(location.search).get('id'));
const entry=files[id];
const title=document.querySelector('#title'),status=document.querySelector('#status'),bar=document.querySelector('#bar'),icon=document.querySelector('#icon'),retry=document.querySelector('#retry'),loader=document.querySelector('#loader'),game=document.querySelector('#game');
if(entry){title.textContent=entry[0];document.title=entry[0];icon.src=`../../assets/icons/catalog/${id}.webp`}else{title.textContent='Unknown game';status.textContent='This game is not in the catalog';retry.hidden=true}
function format(bytes){return bytes<1048576?`${Math.round(bytes/1024)} KB`:`${(bytes/1048576).toFixed(1)} MB`}
function withBase(html,url){const base=`<base href="${url.slice(0,url.lastIndexOf('/')+1)}">`;return /<base\b[^>]*>/i.test(html)?html.replace(/<base\b[^>]*>/i,base):html.replace(/<head[^>]*>/i,match=>match+base)}
async function start(){
  if(!entry)return;
  retry.style.display='none';bar.style.width='0';status.textContent='Downloading game launcher…';
  try{
    const url=`${htmlRoot}/${entry[1]}`;
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)throw new Error(`Download failed (${response.status})`);
    const total=Number(response.headers.get('content-length'))||0,reader=response.body.getReader(),chunks=[];let received=0;
    while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.length;bar.style.width=total?`${Math.min(100,received/total*100)}%`:'35%';status.textContent=total?`Downloading launcher · ${format(received)} / ${format(total)}`:`Downloading launcher · ${format(received)}`}
    const bytes=new Uint8Array(received);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
    status.textContent='Starting game download…';bar.style.width='100%';
    game.srcdoc=withBase(new TextDecoder().decode(bytes),url);game.hidden=false;loader.hidden=true;
    parent.postMessage({type:'xyfer-game-loading'},location.origin);
  }catch(error){console.error(error);status.textContent=error.message||'Unable to download this game';retry.style.display='block';parent.postMessage({type:'xyfer-game-error'},location.origin)}
}
retry.onclick=start;
start();
