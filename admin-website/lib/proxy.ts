import {env} from 'cloudflare:workers';
import {authenticated,sameOrigin,headers,denied} from './security';
const hostedOrigin='https://gwt-employments.nutmegbrook33.chatgpt.site';
export async function jobSiteRequest(path:string,method='GET',body?:string){
 const origin=new URL((env as any).PUBLIC_SITE_URL||hostedOrigin).origin;
 const outgoing:Record<string,string>={'Content-Type':'application/json','X-GWT-Admin-Key':(env as any).ADMIN_BRIDGE_SECRET||''};
 // Sites service access is separate from our application write authorization.
 // Never send this platform credential to an independently hosted domain.
 if(origin===hostedOrigin && (env as any).PUBLIC_SITE_SERVICE_TOKEN) outgoing['OAI-Sites-Authorization']='Bearer '+(env as any).PUBLIC_SITE_SERVICE_TOKEN;
 const upstream=await fetch(origin+path,{method,headers:outgoing,body,redirect:'manual'});
 if(upstream.status>=300 && upstream.status<400) throw new Error('Unexpected job site redirect');
 if(!(upstream.headers.get('content-type')||'').includes('application/json')) {
  console.error('Job site returned non-JSON response',upstream.status);
  throw new Error('Invalid job site response');
 }
 return upstream;
}
export async function proxy(req:Request,path:string){
 if(!await authenticated(req))return denied(401);
 if(req.method!=='GET'&&!sameOrigin(req))return denied();
 if(!(env as any).ADMIN_BRIDGE_SECRET)return Response.json({error:'Admin connection is not configured.'},{status:503,headers});
 try{
  let body:string|undefined;
  if(req.method!=='GET'){body=await req.text();if(body.length>65536)return Response.json({error:'This entry is too long.'},{status:413,headers});}
  const upstream=await jobSiteRequest(path,req.method,body);
  return new Response(await upstream.text(),{status:upstream.status,headers:{...headers,'Content-Type':'application/json'}});
 }catch(error){console.error('Job site connection failed',error instanceof Error?error.message:'Network error');return Response.json({error:'Unable to reach the job website. Please try again.'},{status:502,headers});}
}
