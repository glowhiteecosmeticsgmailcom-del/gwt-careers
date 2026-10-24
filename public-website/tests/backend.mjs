import {build} from '../node_modules/.pnpm/esbuild@0.28.0/node_modules/esbuild/lib/main.js';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('drizzle/0000_lonely_leader.sql','utf8'));
globalThis.testEnv={ADMIN_BRIDGE_SECRET:'test-secret-which-is-at-least-32-chars',DB:{prepare(query){let args=[];const stmt=sql.prepare(query);return {bind(...v){args=v;return this;},async first(){return stmt.get(...args);},async all(){return {results:stmt.all(...args)};},async run(){return stmt.run(...args);}};}}};
async function moduleFor(file){const result=await build({entryPoints:[file],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'test-db',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'mock',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.testEnv;'}));}}]});return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));}
const jobs=await moduleFor('app/api/jobs/route.ts'),settings=await moduleFor('app/api/settings/route.ts');
const base='https://test.example';function req(path,body,auth=true,origin=base){return new Request(base+path,{method:body?'POST':'GET',headers:{...(auth?{'X-GWT-Admin-Key':'test-secret-which-is-at-least-32-chars'}:{}),origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});}
assert.equal((await jobs.POST(req('/api/jobs',{},false))).status,403);
assert.equal((await settings.POST(req('/api/settings',{},false,'https://other.example'))).status,403);
assert.equal((await jobs.GET(req('/api/jobs?admin=1',null,false))).status,403);
const outsider=req('/api/jobs?admin=1');outsider.headers.set('X-GWT-Admin-Key','incorrect');assert.equal((await jobs.GET(outsider)).status,403);
assert.equal((await settings.POST(req('/api/settings',{email:'bad',whatsapp:''}))).status,400);
assert.equal((await settings.POST(req('/api/settings',{email:'hr@example.com',whatsapp:'2348012345678'}))).status,200);
assert.equal((await (await settings.GET()).json()).email,'hr@example.com');
let job={title:'QA test',location:'Lagos',category:'Operations',summary:'Test role',requirements:['Qualification'],tasks:['Task'],status:'draft'};
const saved=await (await jobs.POST(req('/api/jobs',job))).json();job=saved.job;assert.ok(job.id);
assert.equal((await (await jobs.GET(req('/api/jobs'))).json()).jobs.length,0);
assert.equal((await (await jobs.GET(req('/api/jobs?admin=1'))).json()).jobs.length,1);
job.status='published';assert.equal((await jobs.POST(req('/api/jobs',job))).status,200);
assert.equal((await (await jobs.GET(req('/api/jobs'))).json()).jobs.length,1);
assert.equal((await settings.POST(req('/api/settings',{email:'',whatsapp:''}))).status,400);
job.status='closed';assert.equal((await jobs.POST(req('/api/jobs',job))).status,200);
assert.equal((await (await jobs.GET(req('/api/jobs'))).json()).jobs.length,0);
console.log('Passed: owner authorization, cross-origin protection, validation, saved contacts, draft isolation, publish/edit/close lifecycle.');
