import {afterAll, beforeAll, expect, it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {db,json,pool} from '../src/server/db/index.js';
import {migrate} from '../src/server/db/migrate.js';
import {enqueue} from '../src/server/library/store.js';
import {app} from '../src/server/app.js';

const edition=randomUUID();
beforeAll(async()=>{
  await migrate();
  await db.insertInto('editions').values({id:edition,title:'Reader queue checks',source:json({}),root_work_id:null,budget_usd:0}).execute();
});
afterAll(async()=>{
  await db.deleteFrom('intents').where('edition_id','=',edition).execute();
  await db.deleteFrom('editions').where('id','=',edition).execute();
  await pool.end();
});
it('reports the work ahead of a waiting opening and reveals a blocking failure instead of promising progress',async()=>{
  const first=await enqueue(edition,'explore',null,{},randomUUID());
  await db.updateTable('intents').set({status:'running',created_at:'2026-01-01T00:00:00Z'}).where('id','=',first.id).execute();
  const second=await enqueue(edition,'explore',null,{},randomUUID());
  await db.updateTable('intents').set({created_at:'2026-01-01T00:01:00Z'}).where('id','=',second.id).execute();
  const target=await enqueue(edition,'explore',null,{},randomUUID());
  const prep=await enqueue(edition,'prepare',null,{},randomUUID());
  const status=async()=> (await app.request('/api/intents/'+target.id)).json();
  expect((await status()).queue).toEqual({ahead:2,blocked:false});
  await db.updateTable('intents').set({status:'paused',error:'Provider outcome needs reconciliation'}).where('id','=',first.id).execute();
  expect((await status()).queue).toEqual({ahead:2,blocked:true});
  await db.updateTable('intents').set({status:'done'}).where('id','in',[first.id,second.id]).execute();
  expect((await status()).queue).toEqual({ahead:0,blocked:false});
  await db.updateTable('intents').set({status:'failed'}).where('id','=',prep.id).execute();
  expect((await status()).queue).toEqual({ahead:0,blocked:true});
});
it('rejects reader directions and title-led creation at the public request boundary',async()=>{
  for(const body of [
    {key:randomUUID(),kind:'begin',workId:null,angle:'Make them fight'},
    {key:randomUUID(),kind:'title',workId:null,title:'My directed premise'},
  ]){
    const response=await app.request('/api/intents',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({error:'Please check the request.'});
  }
  expect(await db.selectFrom('intents').select('id').where('kind','=','title').where('edition_id','=',edition).execute()).toEqual([]);
});
