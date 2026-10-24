import {proxy} from '../../../lib/proxy';
export function GET(req:Request){return proxy(req,'/api/settings');}
export function POST(req:Request){return proxy(req,'/api/settings');}
