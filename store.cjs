'use strict';
const {AsyncLocalStorage}=require('node:async_hooks');
const fs=require('node:fs'),path=require('node:path');
const schema=`
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT UNIQUE,hash TEXT,salt TEXT,profile TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT,expires BIGINT);
CREATE TABLE IF NOT EXISTS rooms(code TEXT PRIMARY KEY,host TEXT,board TEXT,members TEXT,settings TEXT,state TEXT,revision INTEGER);
CREATE TABLE IF NOT EXISTS actions(room TEXT,user_id TEXT,action_id TEXT,PRIMARY KEY(room,user_id,action_id));
CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,user_id TEXT,kind TEXT,name TEXT,data TEXT,adjust TEXT,version INTEGER);
CREATE TABLE IF NOT EXISTS board_configs(user_id TEXT PRIMARY KEY,board TEXT,updated BIGINT);
CREATE TABLE IF NOT EXISTS room_messages(id TEXT PRIMARY KEY,room TEXT,user_id TEXT,kind TEXT,text TEXT,sticker_id TEXT,created BIGINT);
CREATE TABLE IF NOT EXISTS stickers(id TEXT PRIMARY KEY,user_id TEXT,data TEXT,created BIGINT,last_used BIGINT,use_count INTEGER);
CREATE INDEX IF NOT EXISTS assets_user ON assets(user_id);
CREATE INDEX IF NOT EXISTS room_messages_room_created ON room_messages(room,created);
CREATE INDEX IF NOT EXISTS stickers_user_recent ON stickers(user_id,last_used);`;
function postgresSQL(sql){let index=0;return sql.replace(/\?/g,()=>'$'+(++index)).replaceAll("json_extract(state,'$.phase')","(state::jsonb->>'phase')")}
async function openStore(){
 if(process.env.DATABASE_URL){
  const {Pool}=require('pg'),context=new AsyncLocalStorage();
  const url=new URL(process.env.DATABASE_URL);for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(key);
  const ssl=process.env.PG_SSL==='false'?false:{rejectUnauthorized:true,...(process.env.DATABASE_CA?{ca:process.env.DATABASE_CA.replace(/\\n/g,'\n')}:{})};
  const pool=new Pool({connectionString:url.toString(),ssl,max:4,connectionTimeoutMillis:15000,idleTimeoutMillis:30000,options:'-c search_path=kaoru_private,pg_catalog'});
  pool.on('error',()=>console.error('La conexión con la base de datos se interrumpió.'));
  await pool.query('CREATE SCHEMA IF NOT EXISTS kaoru_private');await pool.query(schema);
  const query=async(sql,args=[])=>{try{return await (context.getStore()||pool).query(postgresSQL(sql),args)}catch(e){const safe=new Error(e.code==='23505'?'Ese registro ya existe.':'No se pudo acceder a la base de datos. Intenta de nuevo en un momento.');safe.status=e.code==='23505'?409:503;throw safe}};
  return {kind:'postgres',prepare(sql){return {get:async(...a)=>(await query(sql,a)).rows[0],all:async(...a)=>(await query(sql,a)).rows,run:async(...a)=>query(sql,a)}},exec:async(sql)=>query(sql),transaction:async fn=>{const client=await pool.connect();try{return await context.run(client,async()=>{await client.query('BEGIN');try{const result=await fn();await client.query('COMMIT');return result}catch(e){await client.query('ROLLBACK');throw e}})}finally{client.release()}},close:()=>pool.end()};
 }
 if(process.env.RENDER)throw Error('Configura DATABASE_URL de Supabase: Render gratuito no conserva SQLite.');
 const {DatabaseSync}=require('node:sqlite'),dir=process.env.DATA_DIR||path.join(__dirname,'data');fs.mkdirSync(dir,{recursive:true});const sqlite=new DatabaseSync(path.join(dir,'kaoru.sqlite'));sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');sqlite.exec(schema);
 return {kind:'sqlite',prepare:sql=>{const s=sqlite.prepare(sql);return {get:async(...a)=>s.get(...a),all:async(...a)=>s.all(...a),run:async(...a)=>s.run(...a)}},exec:async sql=>sqlite.exec(sql),transaction:async fn=>{sqlite.exec('BEGIN');try{const result=await fn();sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}},close:async()=>sqlite.close()};
}
module.exports={openStore,postgresSQL};
