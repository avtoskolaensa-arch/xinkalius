import {DEFAULT_SETTINGS} from '../../lib/menu.ts';
import {QUEUE_SQL,preparation} from '../../lib/operations.ts';
let sqlite,owner='owner-a';
export function configure(db,nextOwner='owner-a'){sqlite=db;owner=nextOwner;}
export function getDb(){return {prepare(sql){let params=[];const statement={bind(...p){params=p;return statement;},async first(){return sqlite.prepare(sql).get(...params)??null;},async all(){return {results:sqlite.prepare(sql).all(...params)};},async run(){const r=sqlite.prepare(sql).run(...params);return {meta:{changes:Number(r.changes)}};}};return statement;},async batch(statements){return Promise.all(statements.map(s=>s.all()));}};}
export async function currentOwner(){return owner;}
export function sameOrigin(request){return request.headers.get('origin')===new URL(request.url).origin;}
export function fail(error,status=400){return Response.json({error},{status});}
export function apiError(e){throw e;}
export async function readBody(r){return r.json();}
export function publicOrder(row,admin=false){const{owner_id,request_key,request_hash,items_json,...rest}=row;return{...rest,items:JSON.parse(items_json).map(({cost,...item})=>admin?{...item,cost}:item)};}
export async function payloadHash(v){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))).map(v=>v.toString(16).padStart(2,'0')).join('');}
export async function getCatalog(who){const products=sqlite.prepare('SELECT * FROM products WHERE owner_id=?').all(who).map(p=>({...p,available:!!p.available,minQuantity:p.min_quantity,translations:JSON.parse(p.translations)}));const row=sqlite.prepare('SELECT value FROM store_settings WHERE owner_id=?').get(who);const settings={...DEFAULT_SETTINGS,...JSON.parse(row?.value||'{}')},units=sqlite.prepare(QUEUE_SQL).get(who).units;return{products,settings,workload:{units,prepMinutes:preparation(settings,units)}};}
export async function ensureStore(){}
