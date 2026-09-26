const {test}=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{mkdtempSync,rmSync}=require('node:fs'),{tmpdir}=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto');
test('four authenticated clients: realtime, privacy, validation, idempotency and restart persistence',async t=>{
 const data=mkdtempSync(path.join(tmpdir(),'kaoru-test-')),port=32000+Math.floor(Math.random()*15000),base=`http://127.0.0.1:${port}`;let child;
 async function start(){child=spawn(process.execPath,['server.cjs'],{cwd:path.join(__dirname,'..'),env:{...process.env,DATA_DIR:data,PORT:String(port),PUBLIC_URL:''},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server timeout')),10000);child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code))});child.stdout.on('data',v=>{if(String(v).includes('Kaoru listo')){clearTimeout(timer);resolve()}});child.stderr.on('data',v=>{if(!String(v).includes('ExperimentalWarning')&&!String(v).includes('trace-warnings'))process.stderr.write(v)})})}
 async function stop(){await new Promise(r=>{child.once('exit',r);child.kill('SIGTERM')})}
 t.after(async()=>{if(child&&child.exitCode===null)await stop();rmSync(data,{recursive:true,force:true})});await start();
 async function call(route,b,cookie,headers={}){const r=await fetch(base+route,{method:b===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(b!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:b===undefined?undefined:JSON.stringify(b)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}}
 const users=[];for(let i=0;i<5;i++){const r=await call('/api/register',{username:'friend'+i,password:'test-password-123'});assert.equal(r.status,200);assert.ok(r.cookie.includes('kaoru='));users.push({cookie:r.cookie,user:r.data.user})}
 assert.equal((await call('/api/login',{username:'friend0',password:'wrong-password'})).status,401);
 assert.equal((await call('/api/me')).status,401);
 assert.equal((await call('/api/rooms',{},users[0].cookie,{Origin:'https://evil.invalid'})).status,403);
 const editorBoard=(await call('/api/editor/board',undefined,users[0].cookie)).data.board;editorBoard.title='Persistido desde editor';editorBoard.cards.community[0].text='Evento guardado en cuenta';assert.equal((await call('/api/editor/board',{board:editorBoard},users[0].cookie)).status,200);assert.equal((await call('/api/editor/board',undefined,users[0].cookie)).data.board.cards.community[0].text,'Evento guardado en cuenta');
 const made=await call('/api/rooms',{rounds:15,pot:true},users[0].cookie);assert.equal(made.status,201);assert.equal(made.data.settings.musicOrder.length,10);assert.equal(new Set(made.data.settings.musicOrder).size,10);assert.ok(made.data.settings.musicOrder.every(n=>Number.isInteger(n)&&n>=0&&n<10));assert.ok(Number.isFinite(made.data.settings.musicEpoch));assert.ok(Number.isFinite(made.data.serverNow));const initialMusic={order:[...made.data.settings.musicOrder],epoch:made.data.settings.musicEpoch};const code=made.data.code;const roomBoard=await call(`/api/rooms/${code}/board`,undefined,users[0].cookie);assert.equal(roomBoard.data.title,'Persistido desde editor');assert.equal(roomBoard.data.cards.community[0].text,'Evento guardado en cuenta');
 for(let i=1;i<4;i++)assert.equal((await call(`/api/rooms/${code}/join`,{},users[i].cookie)).status,200);
 assert.equal((await call(`/api/rooms/${code}/join`,{},users[4].cookie)).status,400);
 assert.equal((await call(`/api/rooms/${code}/board`,undefined,users[4].cookie)).status,403);
 assert.equal((await call(`/api/rooms/${code}/start`,{},users[1].cookie)).status,403);
 assert.equal((await call(`/api/rooms/${code}/start`,{},users[0].cookie)).status,400);
 const cancel=new AbortController(),events=await fetch(base+`/api/rooms/${code}/events`,{headers:{Cookie:users[1].cookie},signal:cancel.signal});assert.equal(events.status,200);const reader=events.body.getReader();let buffer='';
 async function event(){while(!buffer.includes('\n\n')){const {value,done}=await reader.read();if(done)throw Error('Stream ended');buffer+=Buffer.from(value).toString()}const pos=buffer.indexOf('\n\n'),raw=buffer.slice(0,pos);buffer=buffer.slice(pos+2);return JSON.parse(raw.split('\n').find(l=>l.startsWith('data: ')).slice(6))}
 let update=await event();assert.equal(update.members.length,4);
 for(let i=0;i<4;i++){await call(`/api/rooms/${code}/ready`,{ready:true},users[i].cookie);update=await event();assert.equal(update.members[i].ready,true)}
 let state=(await call(`/api/rooms/${code}/start`,{},users[0].cookie)).data;update=await event();assert.equal(update.state.players.length,4);assert.equal(update.state.decks,undefined);assert.equal(JSON.stringify(update).includes('hash'),false);
 assert.equal((await call(`/api/rooms/${code}/action`,{revision:state.revision,actionId:randomUUID(),action:{type:'roll'}},users[1].cookie)).status,400);
 const command={revision:state.revision,actionId:randomUUID(),action:{type:'roll',dice:[6,6],cash:999999}};
 const concurrent=await Promise.all([call(`/api/rooms/${code}/action`,command,users[0].cookie),call(`/api/rooms/${code}/action`,{...command,actionId:randomUUID()},users[0].cookie)]);assert.deepEqual(concurrent.map(x=>x.status).sort(),[200,409]);state=concurrent.find(x=>x.status===200).data;const winningCommand=concurrent[0].status===200?command:null;update=await event();assert.deepEqual(update,state);assert.ok(state.state.dice.every(n=>n>=1&&n<=6));assert.ok(state.state.players[0].cash<999999);
 const duplicate=(await call(`/api/rooms/${code}/action`,command,users[0].cookie)).data;if(winningCommand)assert.equal(duplicate.revision,state.revision);else assert.match(duplicate.error,/cambió/);
 assert.equal((await call(`/api/rooms/${code}/action`,{...command,actionId:randomUUID()},users[0].cookie)).status,409);
 assert.equal((await call('/api/profile',{name:'Cielo',frame:'data:image/png;base64,AAAA'},users[0].cookie)).status,400);
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aTu0AAAAASUVORK5CYII=';
 const saved=await call('/api/profile',{name:'Cielo',avatar:png,frame:png,token:png,adjust:{frame:{scale:1.3,x:5,y:-3}}},users[0].cookie);assert.equal(saved.status,200);update=await event();assert.equal(update.members[0].name,'Cielo');assert.equal(update.members[0].adjust.frame.scale,1.3);
 const img=await fetch(base+saved.data.user.assets.frame,{headers:{Cookie:users[1].cookie}});assert.equal(img.headers.get('content-type'),'image/png');assert.ok((await img.arrayBuffer()).byteLength>20);
 // A wardrobe remains private, can overwrite in place, and survives reconnects.
 const initialWardrobe=await call('/api/wardrobe',undefined,users[0].cookie);assert.equal(initialWardrobe.data.items.length,3);
 let skin=await call('/api/wardrobe/save',{kind:'token',name:'Jax',data:png,adjust:{scale:1.2,x:3,y:0}},users[0].cookie);assert.equal(skin.status,200);const skinId=skin.data.id;update=await event();
 assert.equal((await call('/api/wardrobe/equip',{id:skinId},users[1].cookie)).status,404);
 assert.equal((await call('/api/wardrobe/save',{id:skinId,kind:'token',name:'Robado',data:png},users[1].cookie)).status,404);
 assert.equal((await call('/api/wardrobe/delete',{id:skinId},users[1].cookie)).status,404);
 assert.equal((await call(`/api/wardrobe/${skinId}/image`,undefined,users[1].cookie)).status,404);
 let equipped=await call('/api/wardrobe/equip',{id:skinId},users[0].cookie);assert.equal(equipped.data.user.assetIds.token,skinId);update=await event();assert.equal(update.members[0].adjust.token.scale,1.2);
 skin=await call('/api/wardrobe/save',{id:skinId,kind:'token',name:'Jax actualizado',adjust:{scale:1.5,x:0,y:0}},users[0].cookie);assert.equal(skin.status,200);assert.equal(skin.data.id,skinId);assert.equal(skin.data.items.length,4);assert.equal(skin.data.user.adjust.token.scale,1.5);update=await event();
 // A failed profile upload must not partially replace any equipped image.
 const beforeBad=(await call('/api/me',undefined,users[0].cookie)).data.user;
 assert.equal((await call('/api/profile',{name:'No guardar',avatar:png,frame:'broken'},users[0].cookie)).status,400);
 assert.deepEqual((await call('/api/me',undefined,users[0].cookie)).data.user,beforeBad);
 const revision=update.revision;cancel.abort();await reader.cancel().catch(()=>{});await stop();await start();const restored=await call(`/api/rooms/${code}`,undefined,users[0].cookie);assert.equal(restored.status,200);assert.equal(restored.data.revision,revision);assert.deepEqual(restored.data.state,update.state);assert.deepEqual(restored.data.settings.musicOrder,initialMusic.order);assert.equal(restored.data.settings.musicEpoch,initialMusic.epoch);assert.equal(restored.data.members[0].name,'Cielo');
 const restoredWardrobe=await call('/api/wardrobe',undefined,users[0].cookie);assert.equal(restoredWardrobe.data.items.find(i=>i.id===skinId).name,'Jax actualizado');const restoredEditor=await call('/api/editor/board',undefined,users[0].cookie);assert.equal(restoredEditor.data.saved,true);assert.equal(restoredEditor.data.board.title,'Persistido desde editor');
 const deleted=await call('/api/wardrobe/delete',{id:skinId},users[0].cookie);assert.equal(deleted.status,200);assert.equal(deleted.data.items.length,3);assert.equal(deleted.data.user.assets.token,null);assert.equal(deleted.data.user.assetIds.token,undefined);

 assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/online.js')).status,200);const musicFile=await fetch(base+'/music/track-01.mp3');assert.equal(musicFile.status,200);assert.match(musicFile.headers.get('content-type')||'',/audio\/mpeg/);assert.equal((await fetch(base+'/editor/')).status,200);
},{timeout:30000});
