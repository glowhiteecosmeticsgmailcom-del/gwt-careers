import {env} from 'cloudflare:workers';
import html from '../lib/admin-html';
import {login} from '../lib/login';
import {owner,authenticated,headers,passwordOnly} from '../lib/security';
export async function GET(req:Request){if(!owner(req))return new Response('<a href="/signin-with-chatgpt?return_to=/" target="_top">Sign in with your owner ChatGPT account</a>',{status:403,headers:{...headers,'Content-Type':'text/html'}});try{const ok=await authenticated(req);const existing=await env.DB!.prepare("SELECT id FROM credentials WHERE id='owner'").first();return new Response(ok?html.replaceAll('https://gwt-employments.nutmegbrook33.chatgpt.site',((env as any).PUBLIC_SITE_URL||'https://gwt-employments.nutmegbrook33.chatgpt.site').replace(/["<>]/g,'')):login(!existing,passwordOnly()),{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});}catch{return new Response('The dashboard is temporarily unavailable. Please try again.',{status:503,headers});}}
