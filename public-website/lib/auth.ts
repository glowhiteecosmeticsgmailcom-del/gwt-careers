import {env} from 'cloudflare:workers';
// Management requests come only from the separate admin server, never browsers.
export function isAdmin(req:Request){const expected=(env as any).ADMIN_BRIDGE_SECRET;const supplied=req.headers.get('X-GWT-Admin-Key')||'';if(typeof expected!=='string'||expected.length<32||supplied.length!==expected.length)return false;let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^supplied.charCodeAt(i);return diff===0;}
export function guard(req:Request){if(!isAdmin(req))return Response.json({error:'Access denied.'},{status:403,headers:noCache});return null;}
export const noCache={'Cache-Control':'no-store'};
