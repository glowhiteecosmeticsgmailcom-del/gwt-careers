import {jobSiteRequest} from '../../../lib/proxy';
// Read-only connectivity probe. No credentials, private data, or writes.
export async function GET(){try{const r=await jobSiteRequest('/api/settings');return Response.json({connected:r.ok},{status:r.ok?200:502,headers:{'Cache-Control':'no-store'}});}catch{return Response.json({connected:false},{status:502,headers:{'Cache-Control':'no-store'}});}}
