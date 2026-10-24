import {env} from 'cloudflare:workers';
export const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
export function passwordOnly(){return (env as any).ADMIN_AUTH_MODE==='password';}
export function userId(req:Request){return passwordOnly()?'selfhost-owner':req.headers.get('oai-authenticated-user-id')!;}
export function owner(req:Request){if(passwordOnly())return true;return !!req.headers.get('oai-authenticated-user-id')&&req.headers.get('oai-authenticated-user-email')?.toLowerCase()==='richard492069@gmail.com';}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
export function hex(a:ArrayBuffer|Uint8Array){return Array.from(new Uint8Array(a)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function random(){return hex(crypto.getRandomValues(new Uint8Array(32)));}
export async function digest(s:string){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));}
export async function hash(password:string,salt:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},key,256));}
export function equal(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
export function token(req:Request){return (req.headers.get('cookie')||'').match(/(?:^|;\s*)__Host-gwt_admin=([a-f0-9]{64})(?:;|$)/)?.[1]||'';}
export async function authenticated(req:Request){if(!owner(req))return false;const t=token(req);if(!t)return false;const row:any=await env.DB!.prepare('SELECT user_id,expires FROM sessions WHERE token=?').bind(await digest(t)).first();return !!row&&row.user_id===userId(req)&&row.expires>Date.now();}
export async function issue(req:Request){const t=random();await env.DB!.prepare('DELETE FROM sessions WHERE expires < ?').bind(Date.now()).run();await env.DB!.prepare('INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)').bind(await digest(t),userId(req),Date.now()+8*3600000).run();return '__Host-gwt_admin='+t+'; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800';}
export async function budget(req:Request){const now=Date.now(),id=userId(req)+':'+Math.floor(now/900000);const row:any=await env.DB!.prepare('INSERT INTO attempts(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(id,now+900000).first();return row.count<=8;}
export function passwordError(p:unknown){return typeof p!=='string'||p.length<12||p.length>128?'Use a password between 12 and 128 characters.':'';}
export function denied(status=403){return Response.json({error:status===401?'Please unlock the dashboard with your password.':'Access denied.'},{status,headers});}
