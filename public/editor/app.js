'use strict';
const $ = id => document.getElementById(id);
const Model=KaoruBoard;
let board=Model.initial();
let selected=0,selectedSpecial=null,dirty=false,db,drag,noticeTimer;const images=new Map();let revision=0;
const current=()=>selectedSpecial===null?board.streets[selected]:board.specialArtwork[selectedSpecial];
const defaultCardDefs={
  chance:[
    {title:'Jax · Dado escondido',text:'Jax escondió tu dado. Retrocede tres casillas.',effect:'back',amount:3},
    {title:'Caine · Cambio de escenario',text:'Caine cambia el escenario. Avanza hasta la próxima estación.',effect:'station'},
    {title:'Luz · Portal a GO',text:'Luz abre un portal. Avanza hasta GO y cobra 150.',effect:'go'},
    {title:'Trampa con el dado · Cárcel',text:'Te descubrieron haciendo trampa con el dado. Ve a la cárcel sin cobrar GO.',effect:'jail'},
    {title:'Cámara · Salida de la cárcel',text:'La cámara demuestra que no fuiste tú. Conserva esta carta para salir de la cárcel.',effect:'pass'},
    {title:'Eda · Compra basura',text:'Eda te vendió algo que resultó ser basura. Paga 100 al banco.',effect:'pay',amount:100},
    {title:'I.M.P. · Factura',text:'Contrataste a I.M.P. y llegó la factura. Paga 200 al banco.',effect:'pay',amount:200},
    {title:'Piltover · Ventana rota',text:'Rompiste una ventana en Piltover. Paga 150 por la reparación.',effect:'pay',amount:150},
    {title:'Último tren · Estación anterior',text:'Perdiste el último tren. Retrocede a la estación anterior sin cobrar GO.',effect:'backStation'},
    {title:'Atajo · Avanza 2',text:'Encontraste un atajo. Avanza dos casillas y resuelve donde caigas.',effect:'forward',amount:2}
  ],
  community:[
    {title:'Banco · Cobro duplicado',text:'El banco te cobró dos veces. Recupera 100.',effect:'receive',amount:100},
    {title:'Chaqueta vieja · Dinero encontrado',text:'Encontraste dinero en una chaqueta vieja. Cobra 50.',effect:'receive',amount:50},
    {title:'Cumpleaños · Cada rival te entrega 50',text:'Es tu cumpleaños. Cada rival activo te entrega 50.',effect:'birthday',amount:50},
    {title:'Entradas para el grupo · Paga a las rivales',text:'Compraste entradas para el grupo. Paga 50 a cada rival activo.',effect:'everyone',amount:50},
    {title:'Concurso de cosplay · Premio',text:'Ganaste un concurso de cosplay. Cobra 100.',effect:'receive',amount:100},
    {title:'Pedido incompleto · Devolución',text:'Tu pedido llegó incompleto. El banco te devuelve 75.',effect:'receive',amount:75},
    {title:'Multa atrasada',text:'Te llegó una multa que ignoraste semanas. Paga 100 al bote si está activado; de lo contrario, al banco.',effect:'fine',amount:100},
    {title:'Tubería rota · Reparaciones',text:'Una tubería se rompió. Paga 50 por casa y 200 por hotel.',effect:'repairs'},
    {title:'Cupón · Descuento de alquiler',text:'Recibiste un cupón. Conserva esta carta: reduce automáticamente tu próximo alquiler en 100, sin bajarlo de cero.',effect:'discount'},
    {title:'Persona equivocada · Cárcel',text:'Te confundieron con otra persona. Ve a la cárcel sin cobrar GO.',effect:'jail'}
  ]
};
const effectOptions=[
  ['none','Solo muestra el mensaje'],['receive','El banco te da dinero'],['pay','Pagas dinero al banco'],['fine','Pagas al bote (o al banco si no hay bote)'],['birthday','Cada rival te paga'],['everyone','Pagas a cada rival'],['forward','Avanzas N casillas'],['back','Retrocedes N casillas'],['go','Avanzas a GO y cobras 150'],['station','Avanzas a la próxima estación'],['backStation','Retrocedes a la estación anterior'],['jail','Vas a la cárcel'],['pass','Guardas una salida de la cárcel'],['discount','Guardas cupón de alquiler (-100)'],['repairs','Pagas 50 por casa y 200 por hotel']
];
const amountEffects=new Set(['receive','pay','fine','birthday','everyone','forward','back']);
const validEffects=new Set(effectOptions.map(([v])=>v));
const defaultSpecialCards={
  '0':{label:'GO · Salida',text:'Llegaste a GO. El banco te entrega {amount}.'},
  '4':{label:'Impuesto',text:'Impuesto. Paga {amount} al banco.'},
  '10':{label:'Cárcel / Visita',text:'Solo estás de visita. Por ahora no pasa nada.'},
  '20':{label:'Parada libre',text:'Parada libre. {potText}'},
  '30':{label:'Ve a la cárcel',text:'Ve directamente a la cárcel. No cobras GO.'},
  '38':{label:'Impuesto de lujo',text:'Impuesto de lujo. Paga {amount} al banco.'}
};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function normalizeCard(source={},fallback={},custom=false){
  return {
    title:typeof source.title==='string'&&source.title.trim()?source.title.trim():(fallback.title||'Nueva carta'),
    text:typeof source.text==='string'&&source.text.trim()?source.text:(fallback.text||'Escribe aquí lo que ocurre.'),
    image:typeof source.image==='string'?source.image:null,
    x:Number.isFinite(Number(source.x))?clamp(Number(source.x),0,1):.5,
    y:Number.isFinite(Number(source.y))?clamp(Number(source.y),0,1):.5,
    zoom:Number.isFinite(Number(source.zoom))?clamp(Number(source.zoom),1,4):1,
    effect:validEffects.has(source.effect)?source.effect:(fallback.effect||'none'),
    amount:Number.isFinite(Number(source.amount))?clamp(Math.floor(Number(source.amount)),0,1000000):(Number(fallback.amount)||0),
    custom:source.custom===true||custom
  };
}
function ensureCards(value){
  const cards=value.cards||{};value.cards={};
  for(const kind of ['chance','community']){
    const src=Array.isArray(cards[kind])?cards[kind]:[];
    const defs=defaultCardDefs[kind];
    value.cards[kind]=defs.map((def,i)=>normalizeCard(src[i]||{},def,false));
    for(let i=defs.length;i<src.length;i++)value.cards[kind].push(normalizeCard(src[i],{},true));
  }
  const special=value.specialCards||{};
  value.specialCards=Object.fromEntries(Object.entries(defaultSpecialCards).map(([pos,def])=>[pos,{label:def.label,text:special[pos]?.text||def.text,image:special[pos]?.image||null,x:Number.isFinite(Number(special[pos]?.x))?clamp(Number(special[pos].x),0,1):.5,y:Number.isFinite(Number(special[pos]?.y))?clamp(Number(special[pos].y),0,1):.5,zoom:Number.isFinite(Number(special[pos]?.zoom))?clamp(Number(special[pos].zoom),1,4):1}]));
  return value;
}
async function ingestImage(file,maxW=1400,maxH=1400,quality=.88){if(!file)return null;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('Elige un PNG, JPG o WebP de hasta 8 MB.');const url=URL.createObjectURL(file);try{const im=await loadImage(url);if(im.width*im.height>40000000)throw new Error('Usa una imagen de hasta 40 megapíxeles.');const scale=Math.min(1,maxW/im.width,maxH/im.height);const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.width*scale));canvas.height=Math.max(1,Math.round(im.height*scale));canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);const src=canvas.toDataURL('image/webp',quality);images.set(src,await loadImage(src));return src}finally{URL.revokeObjectURL(url)}}
function applyCardImage(hero,card){const im=hero.querySelector('img');if(!im)return;im.style.objectPosition=`${card.x*100}% ${card.y*100}%`;im.style.transform=`scale(${card.zoom})`;im.style.transformOrigin=`${card.x*100}% ${card.y*100}%`}
function createDeckCard(kind){ensureCards(board);if(board.cards[kind].length>=40)return notify('Máximo 40 cartas por mazo.');board.cards[kind].push(normalizeCard({title:'Nueva carta',text:'Escribe aquí lo que ocurre.',effect:'receive',amount:100,custom:true},{},true));changed();renderCardsEditor();notify(`Nueva carta de ${kind==='chance'?'Suerte':'Evento'} creada. Elige su efecto para que funcione en partida.`)}
function renderCardsEditor(){
  const wrap=$('cardEditor');if(!wrap)return;ensureCards(board);wrap.replaceChildren();
  const title=(text,kind)=>{const h=document.createElement('div');h.className='card-group-title';h.innerHTML=`<h3>${text}</h3>${kind?`<button type="button" class="add-card">＋ Crear carta de ${kind==='chance'?'Suerte':'Evento'}</button>`:''}`;if(kind)h.querySelector('button').onclick=()=>createDeckCard(kind);wrap.append(h)};
  const add=(card,label,resetText,opts={})=>{
    const section=document.createElement('section');section.className='card-edit';
    const functional=!!opts.kind;
    section.innerHTML=`<div class="card-edit-head"><h3>${label}</h3>${opts.custom?'<button type="button" class="danger delete-card">Eliminar</button>':''}</div><div class="card-shell"><div class="hero card-crop" tabindex="0">${card.image?`<img src="${card.image}" alt="">`:'<span>Sube una imagen 16:9 para esta cartilla</span>'}</div><div class="body"><em>${label}</em><p>${card.text||''}</p></div></div><label>Imagen superior (PNG, JPG o WebP)<input class="card-file" type="file" accept="image/png,image/jpeg,image/webp"></label><div class="card-position"><label>Zoom <input class="card-zoom" type="range" min="1" max="4" step="0.01"></label><label>Horizontal <input class="card-x" type="range" min="0" max="1" step="0.001"></label><label>Vertical <input class="card-y" type="range" min="0" max="1" step="0.001"></label></div>${functional?`<label>Nombre de la carta<input class="card-title" maxlength="80"></label><div class="card-effect-row"><label>Efecto en la partida<select class="card-effect">${effectOptions.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label><label class="amount-field">Cantidad / casillas<input class="card-amount" type="number" min="0" max="1000000" step="1"></label></div>`:''}<label>Texto de la cartilla<textarea class="card-text" maxlength="420"></textarea></label><div class="mini-actions"><button type="button" class="remove-image">Quitar imagen</button><button type="button" class="reset-card">Restablecer texto</button></div>`;
    const hero=section.querySelector('.hero'),file=section.querySelector('.card-file'),ta=section.querySelector('.card-text'),remove=section.querySelector('.remove-image'),reset=section.querySelector('.reset-card'),zoom=section.querySelector('.card-zoom'),x=section.querySelector('.card-x'),y=section.querySelector('.card-y');
    ta.value=card.text||'';zoom.value=card.zoom;x.value=card.x;y.value=card.y;applyCardImage(hero,card);
    const refreshImage=()=>{applyCardImage(hero,card);changed()};
    ta.oninput=()=>{card.text=ta.value;section.querySelector('.body p').textContent=card.text;changed()};
    file.onchange=async()=>{try{const src=await ingestImage(file.files[0],1600,1000,.92);file.value='';if(!src)return;card.image=src;card.x=.5;card.y=.5;card.zoom=1;hero.innerHTML=`<img src="${src}" alt="">`;zoom.value=1;x.value=.5;y.value=.5;applyCardImage(hero,card);changed()}catch(e){notify(e.message)}};
    remove.onclick=()=>{card.image=null;card.x=.5;card.y=.5;card.zoom=1;hero.innerHTML='<span>Sube una imagen 16:9 para esta cartilla</span>';zoom.value=1;x.value=.5;y.value=.5;changed()};
    reset.onclick=()=>{card.text=resetText;ta.value=card.text;section.querySelector('.body p').textContent=card.text;changed()};
    zoom.oninput=()=>{card.zoom=Number(zoom.value);refreshImage()};x.oninput=()=>{card.x=Number(x.value);refreshImage()};y.oninput=()=>{card.y=Number(y.value);refreshImage()};
    let dragCard=null;hero.onpointerdown=e=>{if(!card.image)return;dragCard={x:e.clientX,y:e.clientY};hero.setPointerCapture(e.pointerId);hero.classList.add('dragging')};hero.onpointermove=e=>{if(!dragCard)return;const r=hero.getBoundingClientRect(),dx=e.clientX-dragCard.x,dy=e.clientY-dragCard.y;card.x=clamp(card.x-dx/Math.max(1,r.width)/Math.max(1,card.zoom),0,1);card.y=clamp(card.y-dy/Math.max(1,r.height)/Math.max(1,card.zoom),0,1);x.value=card.x;y.value=card.y;dragCard={x:e.clientX,y:e.clientY};applyCardImage(hero,card);changed()};for(const ev of ['pointerup','pointercancel','lostpointercapture'])hero.addEventListener(ev,()=>{dragCard=null;hero.classList.remove('dragging')});
    hero.onkeydown=e=>{const step=e.shiftKey?.05:.015;if(e.key==='ArrowLeft')card.x=clamp(card.x-step,0,1);else if(e.key==='ArrowRight')card.x=clamp(card.x+step,0,1);else if(e.key==='ArrowUp')card.y=clamp(card.y-step,0,1);else if(e.key==='ArrowDown')card.y=clamp(card.y+step,0,1);else return;e.preventDefault();x.value=card.x;y.value=card.y;applyCardImage(hero,card);changed()};
    if(functional){const titleInput=section.querySelector('.card-title'),effect=section.querySelector('.card-effect'),amount=section.querySelector('.card-amount'),amountField=section.querySelector('.amount-field');titleInput.value=card.title;effect.value=card.effect;amount.value=card.amount;const syncEffect=()=>{amountField.hidden=!amountEffects.has(effect.value);card.effect=effect.value;if(amountEffects.has(card.effect)&&!Number.isFinite(Number(card.amount)))card.amount=0;changed()};titleInput.oninput=()=>{card.title=titleInput.value;changed()};effect.onchange=syncEffect;amount.oninput=()=>{card.amount=clamp(Math.floor(Number(amount.value)||0),0,1000000);changed()};amountField.hidden=!amountEffects.has(card.effect);if(opts.custom){section.querySelector('.delete-card').onclick=()=>{if(!confirm('¿Eliminar esta carta del mazo?'))return;board.cards[opts.kind].splice(opts.index,1);changed();renderCardsEditor()}}}
    wrap.append(section)
  };
  title('Casillas especiales');for(const [pos,def] of Object.entries(defaultSpecialCards))add(board.specialCards[pos],def.label,def.text);
  title('Cartas de Suerte que existen en la partida','chance');board.cards.chance.forEach((card,i)=>add(card,`Suerte · ${card.title}`,defaultCardDefs.chance[i]?.text||card.text,{kind:'chance',index:i,custom:i>=defaultCardDefs.chance.length}));
  title('Cartas de Evento que existen en la partida','community');board.cards.community.forEach((card,i)=>add(card,`Evento · ${card.title}`,defaultCardDefs.community[i]?.text||card.text,{kind:'community',index:i,custom:i>=defaultCardDefs.community.length}));
}
function notify(message){$('status').textContent=message;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('status').textContent='',4500)}
function changed(){dirty=true;revision++;$('save').textContent='Guardar cambios •'}
function imageFor(src){if(!src)return null;return images.get(src)}
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('La imagen no se pudo leer.'));im.src=src})}
function draw(canvas,street){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);const im=imageFor(street.image);if(!im)return;ctx.drawImage(im,...Model.cropRect(im.width,im.height,canvas.width,canvas.height,street.zoom,street.x,street.y))}
function coords(i){return Model.coords(i)}
function streetPosition(index){const tile=Model.tiles().find(t=>t.type==='street'&&t.street===index);return tile?tile.position:0}
function currentPosition(){return selectedSpecial===null?streetPosition(selected):selectedSpecial}
function canvasSize(position,preview=false){
  const base=preview?600:300;
  if(position%10===0)return [base,base];
  if((position>10&&position<20)||(position>30&&position<40))return [Math.round(base*.62),base];
  return [base,Math.round(base*.62)];
}
function shapeCanvas(canvas,position,preview=false){const [w,h]=canvasSize(position,preview);if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h}
function syncPreviewShape(){const position=currentPosition(),preview=$('preview'),[w,h]=canvasSize(position,true);if(preview.width!==w)preview.width=w;if(preview.height!==h)preview.height=h;$('crop').style.aspectRatio=`${w} / ${h}`}

function renderBoard(){
  document.querySelectorAll('.tile').forEach(x=>x.remove());
  for(const tile of Model.tiles()){
    const [row,col]=coords(tile.position);
    const el=document.createElement('button');
    el.className='tile';
    if(tile.position%10===0)el.classList.add('corner');
    el.style.gridArea=`${row}/${col}`;
    if(tile.type!=='street'){
      el.classList.add('special',tile.type);
      const icon=document.createElement('b');icon.textContent=tile.symbol;
      const label=document.createElement('span');label.textContent=tile.name;
      el.append(icon,label);
      el.title=tile.description;
      el.dataset.special=tile.position;
      el.classList.toggle('selected',selectedSpecial===tile.position);
      el.setAttribute('aria-pressed',String(selectedSpecial===tile.position));
      el.setAttribute('aria-label',`Editar imagen de ${tile.name}`);
      const art=board.specialArtwork[tile.position];
      if(art.image){
        el.classList.add('has-image');
        const canvas=document.createElement('canvas');
        canvas.className='art';
        shapeCanvas(canvas,tile.position);
        el.prepend(canvas);
        draw(canvas,art);
      }
      el.onclick=()=>{selectedSpecial=tile.position;sync();renderBoard()};
    }else{
      const idx=tile.street,s=board.streets[idx];
      el.dataset.street=idx;
      el.classList.toggle('selected',selectedSpecial===null&&idx===selected);
      el.setAttribute('aria-label',`Editar ${s.name}, grupo ${s.groupId+1}`);
      el.setAttribute('aria-pressed',String(selectedSpecial===null&&idx===selected));
      const stripe=document.createElement('div');stripe.className='stripe';stripe.style.background=s.color;
      const canvas=document.createElement('canvas');canvas.className='art';shapeCanvas(canvas,tile.position);
      const title=document.createElement('span');title.className='title';title.textContent=s.name;
      const cost=document.createElement('span');cost.className='cost';cost.textContent=`$${s.price}`;
      el.append(canvas,stripe,title,cost);
      draw(canvas,s);
      el.onclick=()=>{selected=idx;selectedSpecial=null;sync();renderBoard()};
    }
    $('board').append(el);
  }
  $('count').textContent=`${[...board.streets,...Object.values(board.specialArtwork)].filter(s=>s.image).length} / 40 imágenes`;
  document.querySelector('.center h2').textContent=board.title;
}
function redraw(){syncPreviewShape();draw($('preview'),current());const canvas=document.querySelector(selectedSpecial===null?`[data-street="${selected}"] canvas`:`[data-special="${selectedSpecial}"] canvas`);if(canvas)draw(canvas,current());$('zoom-value').value=`${current().zoom.toFixed(1)}×`;for(const [id,key] of [['zoom','zoom'],['pan-x','x'],['pan-y','y']])$(id).value=current()[key];$('crop-hint').style.display=current().image?'none':'flex'}
function showRules(position){const tile=Model.specials[position];$('special-title').textContent=tile.name;$('special-description').textContent=tile.description;$('special-dialog').showModal()}
function sync(){const special=selectedSpecial!==null;$('street-fields').hidden=special;$('street-economy').hidden=special;$('special-info').hidden=!special;$('editor-kind').textContent=special?'PERSONALIZAR CASILLA':'PERSONALIZAR CALLE';if(special){$('selected-label').textContent=Model.specials[selectedSpecial].name;$('special-summary').textContent=Model.specials[selectedSpecial].description;$('board-title').value=board.title;redraw();return}const s=current();$('selected-label').textContent=`Calle ${selected+1}`;for(const key of ['name','series','color','price','rent','groupRent','buildCost'])$(key).value=s[key];for(let i=0;i<5;i++)$('upgrade-'+i).value=s.upgradeRents[i];$('group-label').textContent=`Grupo ${s.groupId+1} · ${Model.groupSizes[s.groupId]} calles`;const siblings=board.streets.filter(t=>t.groupId===s.groupId).map(t=>t.name).join(' · ');$('group-members').textContent=siblings;$('board-title').value=board.title;redraw()}
for(const key of ['name','series','color','price','rent','groupRent','buildCost'])$(key).addEventListener('input',()=>{if(['price','rent','groupRent','buildCost'].includes(key)){if(!$(key).validity.valid||$(key).value==='')return;current()[key]=Number($(key).value)}else if(key==='color'){for(const s of board.streets.filter(t=>t.groupId===current().groupId))s.color=$(key).value}else current()[key]=$(key).value;changed();renderBoard();$('group-members').textContent=board.streets.filter(t=>t.groupId===current().groupId).map(t=>t.name).join(' · ')});
for(let i=0;i<5;i++)$('upgrade-'+i).oninput=()=>{const input=$('upgrade-'+i);if(!input.validity.valid||input.value==='')return;current().upgradeRents[i]=Number(input.value);changed()};
$('special-help').onclick=()=>showRules(selectedSpecial);
$('close-special').onclick=()=>$('special-dialog').close();
$('board-title').oninput=()=>{board.title=$('board-title').value;changed();document.querySelector('.center h2').textContent=board.title};
for(const [id,key] of [['zoom','zoom'],['pan-x','x'],['pan-y','y']])$(id).oninput=()=>{current()[key]=Number($(id).value);changed();redraw()};
$('reset').onclick=()=>{Object.assign(current(),{zoom:1,x:.5,y:.5});changed();redraw()};
$('remove').onclick=()=>{Object.assign(current(),{image:null,zoom:1,x:.5,y:.5});changed();renderBoard();redraw()};
$('image').onchange=async()=>{const file=$('image').files[0],target=current();$('image').value='';if(!file)return;try{const src=await ingestImage(file,1400,1400,.88);Object.assign(target,{image:src,zoom:1,x:.5,y:.5});changed();renderBoard();redraw();notify('Imagen lista. Arrastra para elegir el encuadre.')}catch(e){notify(e.message)}};
function pan(dx,dy){const s=current(),im=imageFor(s.image);if(!im)return;const rect=$('crop').getBoundingClientRect(),scale=Math.max(rect.width/im.width,rect.height/im.height)*s.zoom,overflowX=im.width*scale-rect.width,overflowY=im.height*scale-rect.height;if(overflowX>0.01)s.x=Math.max(0,Math.min(1,s.x-dx/overflowX));if(overflowY>0.01)s.y=Math.max(0,Math.min(1,s.y-dy/overflowY));changed();redraw()}
$('crop').onpointerdown=e=>{if(!current().image)return;drag={x:e.clientX,y:e.clientY};$('crop').setPointerCapture(e.pointerId)};$('crop').onpointermove=e=>{if(!drag)return;pan(e.clientX-drag.x,e.clientY-drag.y);drag={x:e.clientX,y:e.clientY}};for(const type of ['pointerup','pointercancel','lostpointercapture'])$('crop').addEventListener(type,()=>drag=null);
$('crop').onkeydown=e=>{const keys={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]};if(keys[e.key]){e.preventDefault();pan(...keys[e.key])}};
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('kaoru-studio',1);req.onupgradeneeded=()=>req.result.createObjectStore('boards');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function readSaved(){return new Promise((resolve,reject)=>{const store=db.transaction('boards').objectStore('boards');const keys=['draft-v5','draft-v4','draft-v3','draft-v2','draft'];function next(){const key=keys.shift();if(!key)return resolve(null);const req=store.get(key);req.onsuccess=()=>req.result?resolve(req.result):next();req.onerror=()=>reject(req.error)}next()})}
async function hydrate(value){const legacy=value.version<5;value=ensureCards(Model.migrate(value));validate(value);const assets=[...value.streets,...Object.values(value.specialArtwork),...value.cards.chance,...value.cards.community,...Object.values(value.specialCards)].filter(s=>s.image);const entries=await Promise.all(assets.map(async s=>[s.image,await loadImage(s.image)]));for(const [src,im]of entries)images.set(src,im);board=value;selected=0;selectedSpecial=null;sync();renderBoard();renderCardsEditor();if(legacy){changed();notify("Tablero actualizado: ahora las 40 casillas admiten imagen y los precios siguen la progresión clásica. Guarda la actualización.")}}
function validate(b){Model.validate(b);ensureCards(b);const imgOk=card=>card.image===null||(typeof card.image==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(card.image)&&card.image.length<12000000);const cropOk=card=>Number.isFinite(card.zoom)&&card.zoom>=1&&card.zoom<=4&&[card.x,card.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1);const validCard=card=>card&&typeof card.text==='string'&&card.text.length<=420&&imgOk(card)&&cropOk(card);for(const kind of ['chance','community']){if(!Array.isArray(b.cards[kind])||b.cards[kind].length<1||b.cards[kind].length>40)throw new Error('Cada mazo debe tener entre 1 y 40 cartas.');for(const card of b.cards[kind])if(!validCard(card)||typeof card.title!=='string'||card.title.length>80||!validEffects.has(card.effect)||!Number.isInteger(card.amount)||card.amount<0||card.amount>1000000)throw new Error('Revisa las cartas: título, efecto, cantidad, texto, imagen o encuadre inválidos.')}for(const [pos,card]of Object.entries(b.specialCards))if(!defaultSpecialCards[pos]||!validCard(card))throw new Error('Revisa las cartillas de casillas especiales.')}
$('save').onclick=async()=>{try{validate(board);if(!db)db=await openDB();const savedRevision=revision;await new Promise((resolve,reject)=>{const tx=db.transaction('boards','readwrite');tx.objectStore('boards').put(structuredClone(board),'draft-v5');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});if(savedRevision===revision){dirty=false;$('save').textContent='Guardar cambios'}notify('Guardado en este navegador. Exporta para tener una copia.')}catch(e){notify('No se pudo guardar: '+e.message)}};
$('export').onclick=()=>{try{validate(board);const blob=new Blob([JSON.stringify(board,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='kaoru-tablero.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Tablero exportado con sus imágenes y encuadres.')}catch(e){notify(e.message)}};
$('load-included').onclick=async()=>{if(dirty&&!confirm('Esto reemplazará los cambios sin guardar por el tablero incluido. ¿Continuar?'))return;try{await hydrate(structuredClone(globalThis.KAORU_PRELOADED));changed();notify('Tu tablero incluido está listo. Guarda para conservarlo.')}catch(e){notify(e.message)}};
$('import').onclick=()=>$('json').click();$('json').onchange=async()=>{const file=$('json').files[0];$('json').value='';if(!file)return;if(file.size>50000000)return notify('El archivo supera los 50 MB.');if(dirty&&!confirm('Importar reemplazará tus cambios sin guardar. ¿Continuar?'))return;try{const value=JSON.parse(await file.text());await hydrate(value);changed();notify('Tablero importado. Guarda los cambios para conservarlo.')}catch(e){notify('No se pudo importar: '+e.message)}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
(async()=>{sync();renderBoard();renderCardsEditor();const initialRevision=revision;try{db=await openDB();const saved=await readSaved();if(revision===initialRevision){await hydrate(saved||globalThis.KAORU_PRELOADED||Model.initial());}}catch(e){if(!dirty&&globalThis.KAORU_PRELOADED)await hydrate(globalThis.KAORU_PRELOADED);notify('No se pudo recuperar el guardado local. Revisa el tablero y exporta una copia.')}})();
