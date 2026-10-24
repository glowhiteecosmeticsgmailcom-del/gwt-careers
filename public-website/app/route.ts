import html from '../lib/home-html';
export function GET(){return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});}
