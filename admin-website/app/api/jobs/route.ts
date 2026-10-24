import {proxy} from '../../../lib/proxy';
export function GET(req:Request){return proxy(req,'/api/jobs?admin=1');}
export function POST(req:Request){return proxy(req,'/api/jobs');}
