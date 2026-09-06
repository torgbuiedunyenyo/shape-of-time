import {expect,it} from "vitest";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
it("remembers a dismissed reading guide across processes without clearing reading history", async()=>{
 const directory=await mkdtemp(join(tmpdir(),"shape-guide-"));
 const run=(body:string)=>{const r=spawnSync(process.execPath,["--experimental-webstorage","--localstorage-file="+join(directory,"storage"),"--import","tsx","--input-type=module","-e",`import assert from 'node:assert/strict';import {hasSeenReadingGuide,rememberReadingGuide} from './src/client/tour-state.ts';${body}`],{encoding:"utf8"});expect(r.status,r.stderr).toBe(0);};
 try{
  run("assert.equal(hasSeenReadingGuide(),false);localStorage.setItem('existing-reading-place','chapter-and-anchor');rememberReadingGuide();assert.equal(hasSeenReadingGuide(),true);");
  run("assert.equal(hasSeenReadingGuide(),true);assert.equal(localStorage.getItem('existing-reading-place'),'chapter-and-anchor');");
 }finally{await rm(directory,{recursive:true,force:true});}
});
