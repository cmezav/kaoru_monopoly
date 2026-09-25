/* Shared editor data. This is a board definition, not the multiplayer game engine. */
(function(root){
'use strict';
const colors=['#93bc48','#62b5ec','#ba487c','#eda72e','#43b491','#ab7143','#a480ef','#ed785f'];
const groupSizes=[2,3,3,3,3,3,3,2];
const groupIds=groupSizes.flatMap((n,i)=>Array(n).fill(i));
const classicPrices=[60,60,100,100,120,140,140,160,180,180,200,220,220,240,260,260,280,300,300,320,350,400];
const specials={};
function special(position,type,name,symbol,description){specials[position]={type,name,symbol,description}}
special(0,'go','GO · SALIDA','↑','Cobras 150 al llegar o pasar por Salida hacia delante, salvo movimientos que indiquen lo contrario.');
special(10,'jail','CÁRCEL / VISITA','▥','Caer aquí con el dado es solo visita. Si estás encarcelada, puedes pagar 150, usar una carta o intentar sacar 6; tras el tercer intento fallido se paga y se avanza.');
special(20,'parking','PARADA LIBRE','☀','Descanso: no cobra ni entrega dinero en las reglas clásicas. Los impuestos no forman un premio en esta esquina.');
special(30,'goToJail','VE A LA CÁRCEL','↪','Te trasladas directamente a Cárcel, sin cobrar Salida, y termina tu turno.');
for(const [p,n]of [[5,'ESTACIÓN 1'],[15,'ESTACIÓN 2'],[25,'ESTACIÓN 3'],[35,'ESTACIÓN 4']])special(p,'transport',n,'▰','Transporte comprable. El alquiler de esta versión es 50 / 100 / 200 / 400 según poseas 1 / 2 / 3 / 4 estaciones. No admite casas ni hoteles.');
for(const p of [7,22,36])special(p,'chance','SUERTE','?','Roba del mazo de Suerte y resuelve su efecto: dinero, movimiento, cárcel u otro evento. Puede beneficiar o perjudicar.');
for(const p of [2,17,33])special(p,'community','EVENTO','✉','Roba una carta de Evento y aplica su efecto. Es un mazo independiente de Suerte y puede ayudarte o castigarte.');
special(4,'tax','IMPUESTO','−','Pago fuerte al banco: 300 en esta versión.');
special(38,'tax','IMPUESTO DE LUJO','−','Pago al banco: 200 en esta versión.');
special(12,'utility','ELECTRICIDAD','ϟ','Servicio comprable. Alquiler: dado ×16 si el dueño tiene un servicio y ×40 si posee Agua y Electricidad. Sin edificios.');
special(28,'utility','AGUA','≈','Servicio comprable del mismo conjunto que Electricidad. Alquiler: dado ×16 con un servicio y ×40 con ambos. Sin edificios.');
const imagePositions=Object.keys(specials).map(Number).sort((a,b)=>a-b);
function emptyArtwork(){return Object.fromEntries(imagePositions.map(p=>[p,{image:null,zoom:1,x:.5,y:.5}]))}

/* GO está abajo a la izquierda. Las posiciones aumentan en sentido horario:
   suben por la izquierda, recorren la parte superior, bajan por la derecha
   y regresan por la parte inferior. */
function coords(i){
  if(i<0||i>39||!Number.isInteger(i))throw new Error('Posición inválida');
  if(i<=10)return [11-i,1];
  if(i<=20)return [1,i-9];
  if(i<=30)return [i-19,11];
  return [11,41-i];
}
function tiles(){let street=0;return Array.from({length:40},(_,position)=>specials[position]?{position,...specials[position]}:{position,type:'street',street:street++})}
function upgrades(s){return {groupRent:s.rent*2,buildCost:50+Math.floor(s.groupId/2)*50,upgradeRents:[s.rent*3,s.rent*5,s.rent*8,s.rent*12,s.rent*17]}}
function initial(){return {version:5,specialArtwork:emptyArtwork(),title:'Mi multiverso',layout:'classic-40',ruleset:'kaoru-classic-inspired',streets:groupIds.map((groupId,i)=>{const s={name:`Calle ${i+1}`,series:'',color:colors[groupId],groupId,price:classicPrices[i],rent:10+i*2,image:null,zoom:1,x:.5,y:.5};return {...s,...upgrades(s)}})}}

function migrate(value){
  if(!value)return value;
  if(value.version===5)return value;
  if([3,4].includes(value.version)){
    const b=structuredClone(value);
    if(!Array.isArray(b.streets)||b.streets.length!==22)throw new Error('El tablero debe tener 22 calles.');
    b.version=5;
    b.specialArtwork={...emptyArtwork(),...(b.specialArtwork||{})};
    b.layout='classic-40';
    b.ruleset='kaoru-classic-inspired';
    b.streets=b.streets.map((s,i)=>({...s,price:classicPrices[i]}));
    return b;
  }
  if(![1,2].includes(value.version))return value;
  const b=structuredClone(value);
  if(!Array.isArray(b.streets)||b.streets.length!==20)throw new Error('El tablero anterior debe tener 20 calles.');
  const originalVersion=b.version;
  b.version=5;
  b.specialArtwork=emptyArtwork();
  b.layout='classic-40';
  b.ruleset='kaoru-classic-inspired';
  const defaults=initial();
  b.streets=b.streets.map((s,i)=>{
    const next={...s,groupId:groupIds[i],price:classicPrices[i]};
    return originalVersion===1?{...next,...upgrades(next)}:next;
  });
  b.streets.push(...defaults.streets.slice(20));
  b.streets.forEach((s,i)=>s.price=classicPrices[i]);
  for(let groupId=0;groupId<8;groupId++){
    const group=b.streets.filter(s=>s.groupId===groupId);
    const color=group[0].color;
    for(const street of group)street.color=color;
  }
  return b;
}

function validate(b){
  if(!b||b.version!==5||b.layout!=='classic-40'||b.ruleset!=='kaoru-classic-inspired'||typeof b.title!=='string'||b.title.length>60||!Array.isArray(b.streets)||b.streets.length!==22)throw new Error('El archivo no es un tablero Kaoru v5 válido.');
  if(!b.specialArtwork||Object.keys(b.specialArtwork).length!==18||!imagePositions.every(p=>Object.hasOwn(b.specialArtwork,p)))throw new Error('Faltan imágenes configurables de las casillas especiales.');
  for(const a of Object.values(b.specialArtwork)){
    if(!a||!Number.isFinite(a.zoom)||a.zoom<1||a.zoom>4||![a.x,a.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||!(a.image===null||(typeof a.image==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(a.image)&&a.image.length<12000000)))throw new Error('Imagen o encuadre especial inválido.');
  }
  const money=n=>Number.isInteger(n)&&n>=0&&n<=1000000;
  for(const [i,s]of b.streets.entries()){
    if(!s||!['name','series'].every(k=>typeof s[k]==='string'&&s[k].length<=40)||!/^#[a-f\d]{6}$/i.test(s.color)||s.groupId!==groupIds[i]||!['price','rent','groupRent','buildCost'].every(k=>money(s[k]))||!Array.isArray(s.upgradeRents)||s.upgradeRents.length!==5||!s.upgradeRents.every(money)||s.groupRent<s.rent||s.upgradeRents.some((n,j)=>n<(j?s.upgradeRents[j-1]:s.groupRent))||!Number.isFinite(s.zoom)||s.zoom<1||s.zoom>4||![s.x,s.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||!(s.image===null||(typeof s.image==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s.image)&&s.image.length<12000000)))throw new Error(`Revisa la calle ${i+1}: datos inválidos o alquileres que disminuyen al mejorar.`);
    const first=b.streets.find(t=>t.groupId===s.groupId);
    if(first.color!==s.color)throw new Error('Las calles de un grupo deben compartir color.');
  }
}
function cropRect(iw,ih,width,height,zoom,x,y){const scale=Math.max(width/iw,height/ih)*zoom;const w=iw*scale,h=ih*scale;return [-(w-width)*x,-(h-height)*y,w,h]}
const api={imagePositions,emptyArtwork,colors,groupSizes,groupIds,classicPrices,specials,coords,tiles,initial,migrate,validate,cropRect};
if(typeof module!=='undefined')module.exports=api;else root.KaoruBoard=api;
})(globalThis);
