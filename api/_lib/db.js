import pg from "pg";
const { Pool } = pg;
let pool;
export function db(){ if(!pool){ pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:5,idleTimeoutMillis:10000,connectionTimeoutMillis:10000}); } return pool; }
export function json(res,status,payload){res.status(status).setHeader("Content-Type","application/json; charset=utf-8").setHeader("Cache-Control","no-store").json(payload);}
export function method(req,res,allowed){if(!allowed.includes(req.method)){res.setHeader("Allow",allowed.join(", "));json(res,405,{error:"Método não permitido"});return false;}return true;}
