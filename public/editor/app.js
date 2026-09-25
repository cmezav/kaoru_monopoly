'use strict';
const $ = id => document.getElementById(id);
const Model=KaoruBoard;
let board=Model.initial();
let selected=0,selectedSpecial=null,dirty=false,db,drag,noticeTimer;const images=new Map();let revision=0;
const current=()=>selectedSpecial===null?board.streets[selected]:board.specialArtwork[selectedSpecial];
const defaultCards={chance:['Jax escondió tu dado. Retrocede tres casillas.','Caine cambia el escenario. Avanza hasta la próxima estación.','Luz abre un portal. Avanza hasta GO y cobra 150.','Te descubrieron haciendo trampa con el dado. Ve a la cárcel sin cobrar GO.','La cámara demuestra que no fuiste tú. Conserva esta carta para salir de la cárcel.','Eda te vendió algo que resultó ser basura. Paga 100 al banco.','Contrataste a I.M.P. y llegó la factura. Paga 200 al banco.','Rompiste una ventana en Piltover. Paga 150 por la reparación.','Perdiste el último tren. Retrocede a la estación anterior sin cobrar GO.','Encontraste un atajo. Avanza dos casillas y resuelve donde caigas.'],community:['El banco te cobró dos veces. Recupera 100.','Encontraste dinero en una chaqueta vieja. Cobra 50.','Es tu cumpleaños. Cada rival activo te entrega 50.','Compraste entradas para el grupo. Paga 50 a cada rival activo.','Ganaste un concurso de cosplay. Cobra 100.','Tu pedido llegó incompleto. El banco te devuelve 75.','Te llegó una multa que ignoraste semanas. Paga 100 al bote si está activado; de lo contrario, al banco.','Una tubería se rompió. Paga 50 por casa y 200 por hotel.','Recibiste un cupón. Conserva esta carta: reduce automáticamente tu próximo alquiler en 100, sin bajarlo de cero.','Te confundieron con otra persona. Ve a la cárcel sin cobrar GO.']};
function ensureCards(value){const cards=value.cards||{};value.cards={chance:defaultCards.chance.map((txt,i)=>({text:cards.chance?.[i]?.text||txt,image:cards.chance?.[i]?.image||null})),community:defaultCards.community.map((txt,i)=>({text:cards.community?.[i]?.text||txt,image:cards.community?.[i]?.image||null}))};return value}
async function ingestImage(file,maxW=1400,maxH=1400,quality=.88){if(!file)return null;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('Elige un PNG, JPG o WebP de hasta 8 MB.');const url=URL.createObjectURL(file);try{const im=await loadImage(url);if(im.width*im.height>40000000)throw new Error('Usa una imagen de hasta 40 megapíxeles.');const scale=Math.min(1,maxW/im.width,maxH/im.height);const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.width*scale));canvas.height=Math.max(1,Math.round(im.height*scale));canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);const src=canvas.toDataURL('image/webp',quality);images.set(src,await loadImage(src));return src}finally{URL.revokeObjectURL(url)}}
function renderCardsEditor(){const wrap=$('cardEditor');if(!wrap||!board.cards)return;wrap.replaceChildren();[['chance','Suerte'],['community','Evento']].forEach(([kind,label])=>board.cards[kind].forEach((card,index)=>{const section=document.createElement('section');section.className='card-edit';section.innerHTML=`<h3>${label} ${index+1}</h3><div class="card-shell"><div class="hero">${card.image?`<img src="${card.image}" alt="">`:'<span>Sube una imagen 16:9 para esta cartilla</span>'}</div><div class="body"><em>${label}</em><p>${card.text||''}</p></div></div><label>Imagen superior (PNG, JPG o WebP)<input type="file" accept="image/png,image/jpeg,image/webp"></label><label>Texto de la cartilla<textarea maxlength="420"></textarea></label><div class="mini-actions"><button type="button">Quitar imagen</button><button type="button">Restablecer texto</button></div>`;const file=section.querySelector('input[type=file]'),ta=section.querySelector('textarea'),remove=section.querySelectorAll('button')[0],reset=section.querySelectorAll('button')[1];ta.value=card.text||'';ta.oninput=()=>{card.text=ta.value;section.querySelector('.body p').textContent=card.text;changed()};file.onchange=async()=>{try{const src=await ingestImage(file.files[0],1280,720,.9);file.value='';if(!src)return;card.image=src;section.querySelector('.hero').innerHTML=`<img src="${src}" alt="">`;changed()}catch(e){notify(e.message)}};remove.onclick=()=>{card.image=null;section.querySelector('.hero').innerHTML='<span>Sube una imagen 16:9 para esta cartilla</span>';changed()};reset.onclick=()=>{card.text=defaultCards[kind][index];ta.value=card.text;section.querySelector('.body p').textContent=card.text;changed()};wrap.append(section)}))}
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
async function hydrate(value){const legacy=value.version<5;value=ensureCards(Model.migrate(value));validate(value);const assets=[...value.streets,...Object.values(value.specialArtwork),...value.cards.chance,...value.cards.community].filter(s=>s.image);const entries=await Promise.all(assets.map(async s=>[s.image,await loadImage(s.image)]));for(const [src,im]of entries)images.set(src,im);board=value;selected=0;selectedSpecial=null;sync();renderBoard();renderCardsEditor();if(legacy){changed();notify("Tablero actualizado: ahora las 40 casillas admiten imagen y los precios siguen la progresión clásica. Guarda la actualización.")}}
function validate(b){Model.validate(b);ensureCards(b);for(const kind of ['chance','community']){if(!Array.isArray(b.cards[kind])||b.cards[kind].length!==10)throw new Error('Las cartillas deben tener 10 entradas por mazo.');for(const card of b.cards[kind])if(!card||typeof card.text!=='string'||card.text.length>420||!(card.image===null||(typeof card.image==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(card.image)&&card.image.length<12000000)))throw new Error('Revisa las cartillas: texto o imagen inválidos.')}}
$('save').onclick=async()=>{try{validate(board);if(!db)db=await openDB();const savedRevision=revision;await new Promise((resolve,reject)=>{const tx=db.transaction('boards','readwrite');tx.objectStore('boards').put(structuredClone(board),'draft-v5');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});if(savedRevision===revision){dirty=false;$('save').textContent='Guardar cambios'}notify('Guardado en este navegador. Exporta para tener una copia.')}catch(e){notify('No se pudo guardar: '+e.message)}};
$('export').onclick=()=>{try{validate(board);const blob=new Blob([JSON.stringify(board,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='kaoru-tablero.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Tablero exportado con sus imágenes y encuadres.')}catch(e){notify(e.message)}};
$('load-included').onclick=async()=>{if(dirty&&!confirm('Esto reemplazará los cambios sin guardar por el tablero incluido. ¿Continuar?'))return;try{await hydrate(structuredClone(globalThis.KAORU_PRELOADED));changed();notify('Tu tablero incluido está listo. Guarda para conservarlo.')}catch(e){notify(e.message)}};
$('import').onclick=()=>$('json').click();$('json').onchange=async()=>{const file=$('json').files[0];$('json').value='';if(!file)return;if(file.size>50000000)return notify('El archivo supera los 50 MB.');if(dirty&&!confirm('Importar reemplazará tus cambios sin guardar. ¿Continuar?'))return;try{const value=JSON.parse(await file.text());await hydrate(value);changed();notify('Tablero importado. Guarda los cambios para conservarlo.')}catch(e){notify('No se pudo importar: '+e.message)}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
(async()=>{sync();renderBoard();renderCardsEditor();const initialRevision=revision;try{db=await openDB();const saved=await readSaved();if(revision===initialRevision){await hydrate(saved||globalThis.KAORU_PRELOADED||Model.initial());}}catch(e){if(!dirty&&globalThis.KAORU_PRELOADED)await hydrate(globalThis.KAORU_PRELOADED);notify('No se pudo recuperar el guardado local. Revisa el tablero y exporta una copia.')}})();
