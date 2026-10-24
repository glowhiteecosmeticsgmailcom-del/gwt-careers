import {env} from 'cloudflare:workers';
import {sameOrigin,token,digest,headers,denied} from '../../../lib/security';
export async function POST(req:Request){if(!sameOrigin(req))return denied();const t=token(req);if(t)await env.DB!.prepare('DELETE FROM sessions WHERE token=?').bind(await digest(t)).run();return Response.json({ok:true},{headers:{...headers,'Set-Cookie':'__Host-gwt_admin=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}});}
