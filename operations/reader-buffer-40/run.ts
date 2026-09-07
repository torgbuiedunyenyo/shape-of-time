import assert from 'node:assert/strict';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {db,pool} from '../../src/server/db/index.ts';
import {budget} from '../../src/server/providers/operations.ts';
import type {Anchor,Book,Intent} from '../../src/shared/types.ts';
if (!process.argv.includes('--run')) throw Error('This paid run is paused. Read operations/reader-buffer-40/README.md before explicitly resuming with --run.');
const dir='.local/reader-buffer-40',path=dir+'/ledger.json',base='https://shape-of-time-production.up.railway.app/api/';
const pin='21f659fcad3e8b385a7f72e60f892761c34fc95f86f9075752590ac57451ad90';
type Entry={number:number,category:'core'|'side',group?:number,body:Record<string,unknown>,id?:string,status?:string,submittedAt?:string,completedAt?:string,resultWorkId?:string,newPublications?:string[]};
type Ledger={createdAt:string,mechanism:string,editionKey:string,rootWorkId:string,groups:Record<number,{workId?:string,source?:Anchor,sourceWorkId?:string}>,entries:Entry[],complete:boolean};
async function api<T>(route:string,body?:unknown):Promise<T>{const r=await fetch(base+route,{...(body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`Reader API ${r.status}: ${await r.text()}`);return r.json() as Promise<T>;}
await mkdir(dir,{recursive:true});
let ledger:Ledger;
try { ledger=JSON.parse(await readFile(path,'utf8')); }
catch(e) { if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;
 const library=await api<{edition:{root_work_id:string,reading_key:string}}>('library');
 ledger={createdAt:new Date().toISOString(),mechanism:pin,editionKey:library.edition.reading_key,rootWorkId:library.edition.root_work_id,groups:{0:{workId:'work-c989cdfd80a48e2aa32cfd9517b326b1'},1:{workId:'work-1829a8ae7c5690472d620b886f48d787'}},entries:[],complete:false};
}
async function save(){await writeFile(path+'.tmp',JSON.stringify(ledger,null,2)+'\n',{mode:0o600});await rename(path+'.tmp',path);}
await save();
try {
 for(let n=1;n<=40;n++){
  let entry=ledger.entries.find(e=>e.number===n);if(entry?.completedAt)continue;
  try{await readFile(dir+'/hold');console.log('HELD between requests');break;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  const edition=await db.selectFrom('editions').select(['mechanism','created_at']).where('id','=','shape-of-time').executeTakeFirstOrThrow();
  assert.equal(edition.mechanism?.hash,pin);assert.equal('shape-of-time:'+new Date(edition.created_at).toISOString(),ledger.editionKey);
  if(!entry){
   const b=await budget('shape-of-time');if(b.unknown)throw Error('Uncertain provider spending; inspect before continuing');if(b.remaining<12)throw Error('Allowance running low; inspect and extend recorded budget before continuing');
   const category=n%2?'core':'side',group=category==='side'?(n/2-1)%5:undefined;
   let workId=ledger.rootWorkId, source:Anchor|undefined;
   if(group!==undefined){
    if(!ledger.groups[group]){
     const root=await api<Book>('works/'+ledger.rootWorkId);
     const used=new Set(Object.values(ledger.groups).map(g=>g.workId));
     const offered=root.openings.find(o=>!used.has(o.target_work_id));
     if(offered)ledger.groups[group]={workId:offered.target_work_id};
     else {
      const usedImages=new Set([...root.openings.map(o=>o.source.assetId),...Object.values(ledger.groups).map(g=>g.source?.assetId)]);
      const picked=root.publications.flatMap(p=>p.blocks.map(b=>({p,b}))).find(({b})=>b.kind==='figure'&&b.assetId&&!usedImages.has(b.assetId));
      if(!picked)throw Error('Need to inspect actual story for another useful reachable source');
      ledger.groups[group]={sourceWorkId:ledger.rootWorkId,source:{publicationId:picked.p.id,blockId:picked.b.id,assetId:picked.b.assetId}};
     }
     await save();
    }
    const g=ledger.groups[group];workId=g.workId??g.sourceWorkId!;if(!g.workId)source=g.source;
   }
   const book=await api<Book>('works/'+workId);
   entry={number:n,category,group,body:{key:`reader-buffer-40-20260907-${n.toString().padStart(2,'0')}`,kind:source?'explore':'continue',workId,...(source?{source}:{afterPublicationId:book.publications.at(-1)!.id})}};
   ledger.entries.push(entry);await save();
  }
  if(!entry.id){entry.submittedAt??=new Date().toISOString();await save();const result=await api<Intent>('intents',entry.body);entry.id=result.id;entry.status=result.status;await save();console.log(JSON.stringify({submitted:entry.number,category:entry.category,group:entry.group,id:entry.id,status:entry.status}));}
  for(;;){
   const intent=await api<Intent>('intents/'+entry.id);
   if(intent.status!==entry.status){entry.status=intent.status;await save();console.log(JSON.stringify({number:n,status:intent.status}));}
   if(['paused','failed','cancelled'].includes(intent.status))throw Error(`Request ${entry.id} ${intent.status}: ${intent.error}`);
   if(intent.status==='done'){
    assert(intent.result_work_id);const book=await api<Book>('works/'+intent.result_work_id);assert(book.publications.length);
    entry.resultWorkId=intent.result_work_id;entry.completedAt=new Date().toISOString();entry.newPublications=book.publications.filter(p=>new Date(p.created_at)>=new Date(entry!.submittedAt!)).map(p=>p.id);
    if(entry.group!==undefined)ledger.groups[entry.group].workId=intent.result_work_id;
    await save();console.log(JSON.stringify({completed:n,category:entry.category,title:book.work.title,publications:entry.newPublications.length,budget:await budget('shape-of-time')}));break;
   }
   await new Promise(r=>setTimeout(r,15000));
  }
 }
 ledger.complete=ledger.entries.length===40&&ledger.entries.every(e=>!!e.completedAt);await save();console.log(JSON.stringify({complete:ledger.complete,core:ledger.entries.filter(e=>e.completedAt&&e.category==='core').length,side:ledger.entries.filter(e=>e.completedAt&&e.category==='side').length}));
} finally {await pool.end();}
