import {json,method} from "../_lib/db.js";import {requireAdmin,clearSession} from "../_lib/auth.js";
export default async function handler(req,res){if(!method(req,res,["GET","DELETE"]))return;if(req.method==="DELETE"){clearSession(res);return json(res,200,{ok:true});}const admin=await requireAdmin(req,res);if(admin)return json(res,200,{admin});}
