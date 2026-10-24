import {build} from '../node_modules/.pnpm/esbuild@0.28.0/node_modules/esbuild/lib/main.js';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('drizzle/0000_stormy_morg.sql','utf8'));
globalThis.testEnv={DB:{prepare(query){let args=[];const stmt=sql.prepare(query);return {bind(...v){args=v;return this;},async first(){return stmt.get(...args);},async all(){return {results:stmt.all(...args)};},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}};}};},async batch(items){for(const i of items)await i.run();}}};
async function mod(file){const r=await build({entryPoints:[file],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'mock',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'mock',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.testEnv;'}));}}]});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));}
const auth=await mod('app/api/auth/route.ts'),password=await mod('app/api/password/route.ts'),logout=await mod('app/api/logout/route.ts'),sec=await mod('lib/security.ts');
const base='https://admin.example';let cookie='';function req(body,owner=true,origin=base){return new Request(base+'/api/auth',{method:'POST',headers:{'Content-Type':'application/json',origin,cookie,...owner?{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'richard492069@gmail.com'}:{}},body:JSON.stringify(body)});}
assert.equal((await auth.POST(req({},false))).status,403);assert.equal((await auth.POST(req({},true,'https://evil.example'))).status,403);
assert.equal((await auth.POST(req({mode:'setup',password:'short',confirm:'short'}))).status,400);
const pw='test-only-long-passphrase';let r=await auth.POST(req({mode:'setup',password:pw,confirm:pw}));assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];assert.ok(r.headers.get('set-cookie').includes('HttpOnly'));assert.equal(await sec.authenticated(req({})),true);
assert.equal((await auth.POST(req({mode:'setup',password:pw,confirm:pw}))).status,409);
assert.equal((await auth.POST(req({mode:'login',password:'wrong-password-123'}))).status,401);
const stored=sql.prepare('SELECT hash FROM credentials').get().hash;assert.notEqual(stored,pw);
r=await password.POST(req({current:pw,password:'second-long-passphrase',confirm:'second-long-passphrase'}));assert.equal(r.status,200);assert.equal(await sec.authenticated(req({})),false);cookie=r.headers.get('set-cookie').split(';')[0];assert.equal(await sec.authenticated(req({})),true);
assert.equal((await logout.POST(req({}))).status,200);assert.equal(await sec.authenticated(req({})),false);
sql.exec('DELETE FROM attempts');for(let i=0;i<8;i++)assert.equal((await auth.POST(req({mode:'login',password:'incorrect-long-password'}))).status,401);assert.equal((await auth.POST(req({mode:'login',password:'incorrect-long-password'}))).status,429);
console.log('Passed: owner-only setup, origin protection, password hashing, duplicate setup rejection, wrong-password rejection, sessions, password change, logout, rate limiting.');
sql.exec('DELETE FROM credentials; DELETE FROM sessions; DELETE FROM attempts;');globalThis.testEnv.ADMIN_AUTH_MODE='password';globalThis.testEnv.ADMIN_SETUP_TOKEN='test-setup-token-at-least-32-characters';cookie='';
assert.equal((await auth.POST(req({mode:'setup',password:pw,confirm:pw},false))).status,403);
r=await auth.POST(req({mode:'setup',password:pw,confirm:pw,setupToken:globalThis.testEnv.ADMIN_SETUP_TOKEN},false));assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];assert.equal(await sec.authenticated(req({},false)),true);
console.log('Passed: independent hosting setup requires a private token; password-only sessions work without ChatGPT headers.');
const proxyModule=await mod('lib/proxy.ts');
globalThis.testEnv.ADMIN_BRIDGE_SECRET='test-bridge-secret';globalThis.testEnv.PUBLIC_SITE_SERVICE_TOKEN='test-service-token';
let sent;globalThis.fetch=async(url,options)=>{sent={url,options};return Response.json({ok:true});};
r=await proxyModule.proxy(req({email:'hr@example.com'},false),'/api/settings');assert.equal(r.status,200);assert.equal(sent.options.headers['OAI-Sites-Authorization'],'Bearer test-service-token');assert.equal(sent.options.headers['X-GWT-Admin-Key'],'test-bridge-secret');assert.equal(sent.options.redirect,'manual');
globalThis.testEnv.PUBLIC_SITE_URL='https://jobs.example';await proxyModule.jobSiteRequest('/api/settings');assert.equal(sent.options.headers['OAI-Sites-Authorization'],undefined);
let fetched=false;globalThis.fetch=async()=>{fetched=true;return Response.json({});};cookie='';assert.equal((await proxyModule.proxy(req({},false),'/api/settings')).status,401);assert.equal(fetched,false);
console.log('Passed: authenticated proxy sends both authorization layers, never forwards Sites token to other hosts, rejects unauthenticated requests.');

globalThis.fetch=async()=>new Response(null,{status:302,headers:{Location:"https://other.example"}});
await assert.rejects(()=>proxyModule.jobSiteRequest("/api/settings"),/Unexpected job site redirect/);
console.log("Passed: redirects are rejected without following or forwarding credentials.");
