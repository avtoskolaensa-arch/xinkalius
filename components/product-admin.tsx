"use client";
import {itemName,localizedProduct} from "@/lib/i18n-core";
import {useI18n} from "./language-provider";
import { translate } from "@/lib/i18n-core";
import type { ProductText } from "@/lib/menu";
import { useState } from "react";
import { Plus, Pencil, ImagePlus, Package, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AdminShell, ErrorNote, Loading } from "./site-shell";
import { api, useCatalog, productPayload } from "@/lib/client";
import { CATEGORIES, money, type Product } from "@/lib/menu";
const blank: Product = { id: "", name: "", description: "", ingredients: "", allergens: "", category: "khinkali", price: 0, cost: 0, image: "", available: true, minQuantity: 5, updatedAt: 0 };
export default function ProductAdmin() {
    const { t, locale } = useI18n();
    const { data, error, load } = useCatalog(true), [edit, setEdit] = useState<Product | null>(null), [price, setPrice] = useState(""), [cost, setCost] = useState(""), [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false), [failure, setFailure] = useState(""), [notice, setNotice] = useState("");
    function open(p: Product) { setEdit({ ...p, translations: { en: p.translations?.en || { name: translate(p.name, "en"), description: translate(p.description, "en"), ingredients: translate(p.ingredients, "en"), allergens: translate(p.allergens, "en") }, ru: p.translations?.ru || { name: translate(p.name, "ru"), description: translate(p.description, "ru"), ingredients: translate(p.ingredients, "ru"), allergens: translate(p.allergens, "ru") } } }); setPrice(p.price ? String(p.price / 100) : ""); setCost(String((p.cost || 0) / 100)); setFailure(""); }
    async function upload(file?: File) { if (!file || !edit)
        return; setUploading(true); setFailure(""); try {
        if (file.size > 6000000)
            throw new Error("ფოტო მაქსიმუმ 6 MB უნდა იყოს.");
        const f = new FormData();
        f.append("file", file);
        const r = await api<{
            image: string;
        }>("/api/images", { method: "POST", body: f });
        setEdit(p => p ? { ...p, image: r.image } : p);
    }
    catch (e) {
        setFailure((e as Error).message);
    }
    finally {
        setUploading(false);
    } }
    async function save(e: React.FormEvent) { e.preventDefault(); if (!edit || busy || uploading)
        return; setBusy(true); setFailure(""); try {
        const p = { ...edit, price: Math.round(Number(price) * 100), cost: Math.round(Number(cost) * 100) };
        if (!Number.isFinite(p.price) || p.price <= 0 || !Number.isFinite(p.cost) || p.cost < 0)
            throw new Error("შეამოწმე ფასი და თვითღირებულება.");
        await api(edit.id ? `/api/admin/products/${edit.id}` : "/api/admin/products", { method: edit.id ? "PATCH" : "POST", body: JSON.stringify(productPayload(p)) });
        setEdit(null);
        setNotice("პროდუქტი შენახულია — ცვლილება საიტსა და სალაროშიც გამოჩნდება.");
        await load();
    }
    catch (e) {
        setFailure((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function toggle(p: Product) { setBusy(true); setFailure(""); try {
        await api(`/api/admin/products/${p.id}`, { method: "PATCH", body: JSON.stringify({ ...productPayload(p), available: !p.available }) });
        await load();
    }
    catch (e) {
        setFailure((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    return <AdminShell active="/admin/products"><div className="page-heading"><div><p className="eyebrow">{t("შენი მენიუ")}</p><h1>{t("პროდუქტები")}</h1><p>{t("ფოტოები, ფასები და ხელმისაწვდომობა ერთ სივრცეში.")}</p></div><button className="primary" onClick={() => open(blank)}><Plus size={19}/>{" " + t("პროდუქტის დამატება") + ""}</button></div><ErrorNote message={error || (!edit ? failure : "")} onRetry={() => void load()}/>{notice && <p className="saved-note" role="status"><Check size={18}/>{t(notice)}</p>}{!data ? <Loading /> : <><div className="stats-row"><div><span>{t("მენიუში")}</span><strong>{data.products.length}</strong></div><div><span>{t("ხელმისაწვდომია")}</span><strong>{data.products.filter(p => p.available).length}</strong></div><div><span>{t("დროებით ამოწურულია")}</span><strong>{data.products.filter(p => !p.available).length}</strong></div></div><div className="table-card"><Table><TableHeader><TableRow><TableHead>{t("პროდუქტი")}</TableHead><TableHead>{t("კატეგორია")}</TableHead><TableHead>{t("თვითღირებულება")}</TableHead><TableHead>{t("ფასი / ცალი")}</TableHead><TableHead>{t("სხვაობა / ცალი")}</TableHead><TableHead>{t("იყიდება")}</TableHead><TableHead><span className="sr-only">{t("რედაქტირება")}</span></TableHead></TableRow></TableHeader><TableBody>{data.products.map(p => <TableRow key={p.id}><TableCell><div className="product-table-name">{p.image ? <img src={p.image} alt="" width="56" height="56"/> : <Package size={30}/>}<div><strong>{itemName(p,locale)}</strong><small>{"" + t("მინ.") + " "}{p.minQuantity}{" " + t("ცალი") + ""}</small></div></div></TableCell><TableCell>{t(CATEGORIES[p.category])}</TableCell><TableCell>{money(p.cost || 0)}</TableCell><TableCell><strong>{money(p.price)}</strong></TableCell><TableCell>{money(p.price - (p.cost || 0))}</TableCell><TableCell><Switch checked={p.available} disabled={busy} onCheckedChange={() => void toggle(p)} aria-label={t("{0}: ხელმისაწვდომობა", { "0": itemName(p,locale) })}/></TableCell><TableCell><button className="icon-button" onClick={() => open(p)} aria-label={t("{0}: რედაქტირება", { "0": itemName(p,locale) })}><Pencil size={18}/></button></TableCell></TableRow>)}</TableBody></Table></div><p className="small-note">{t("თვითღირებულება მომხმარებლის მენიუში არ ჩანს. სხვაობა წმინდა მოგება არ არის — დამატებითი ხარჯები ცალკე გასათვალისწინებელია. საწყისი მონაცემები საილუსტრაციოა.")}</p></>}
 <Dialog open={!!edit} onOpenChange={v => { if (!v && !busy && !uploading)
        setEdit(null); }}><DialogContent className="edit-dialog"><DialogHeader><DialogTitle>{edit?.id ? t("პროდუქტის რედაქტირება") : t("ახალი პროდუქტი")}</DialogTitle><DialogDescription>{t("ყველა ფასი მიუთითე ერთი ცალისთვის, ლარში.")}</DialogDescription></DialogHeader>{edit && <form onSubmit={save}><fieldset disabled={busy || uploading}><div className="image-editor">{edit.image ? <img src={edit.image} alt={t("პროდუქტის ფოტო")}/> : <ImagePlus size={38}/>}<div><label className="secondary upload-label"><ImagePlus size={18}/>{uploading ? t("იტვირთება…") : t("ფოტოს ატვირთვა")}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void upload(e.target.files?.[0])}/></label><p className="small-note">{t("JPG, PNG, WebP · მაქს. 6 MB")}</p>{edit.image && <button type="button" className="text-button" onClick={() => setEdit({ ...edit, image: "" })}>{t("ფოტოს მოხსნა")}</button>}</div></div><h3>{t("ძირითადი ტექსტი · KA")}</h3><div className="form-grid"><label className="field">{t("დასახელება")}<input required minLength={2} maxLength={80} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })}/></label><label className="field">{t("კატეგორია")}<Select value={edit.category} onValueChange={v => setEdit({ ...edit, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{t(v)}</SelectItem>)}</SelectContent></Select></label><label className="field">{t("გასაყიდი ფასი ₾")}<input required type="number" step="0.01" min="0.01" max="10000" value={price} onChange={e => setPrice(e.target.value)}/></label><label className="field">{t("თვითღირებულება ₾")}<input required type="number" step="0.01" min="0" max="10000" value={cost} onChange={e => setCost(e.target.value)}/></label></div><label className="field">{t("მოკლე აღწერა")}<input maxLength={200} value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })}/></label><label className="field">{t("შემადგენლობა")}<textarea maxLength={500} value={edit.ingredients} onChange={e => setEdit({ ...edit, ingredients: e.target.value })}/></label><label className="field">{t("ალერგენები")}<input maxLength={250} placeholder={t("მაგ.: ხორბალი, რძე")} value={edit.allergens} onChange={e => setEdit({ ...edit, allergens: e.target.value })}/></label><details className="translation-fields" open><summary>{t("პროდუქტის თარგმანები · EN / RU")}</summary>{(["en", "ru"] as const).map(lang => <section key={lang}><h3>{lang.toUpperCase()}</h3>{([['name', t("დასახელება")], ['description', t("მოკლე აღწერა")], ['ingredients', t("შემადგენლობა")], ['allergens', t("ალერგენები")]] as const).map(([field, label]) => <label className="field" key={field}>{label}<input required={field === 'name' || !!edit[field]} maxLength={field === 'name' ? 80 : field === 'description' ? 200 : field === 'ingredients' ? 500 : 250} value={edit.translations?.[lang]?.[field] || ''} onChange={e => setEdit({ ...edit, translations: { ...edit.translations!, [lang]: { ...edit.translations![lang], [field]: e.target.value } } })}/></label>)}</section>)}</details><div className="form-grid"><label className="field">{t("მინიმალური რაოდენობა")}<input required type="number" min="1" max="200" value={edit.minQuantity} onChange={e => setEdit({ ...edit, minQuantity: Number(e.target.value) })}/></label><div className="switch-field"><label htmlFor="product-available">{t("ხელმისაწვდომია")}</label><Switch id="product-available" checked={edit.available} onCheckedChange={v => setEdit({ ...edit, available: v })}/></div></div><ErrorNote message={failure}/><div className="dialog-actions"><button className="secondary" type="button" onClick={() => setEdit(null)}>{t("გაუქმება")}</button><button className="primary" type="submit" disabled={busy || uploading}>{busy ? t("ინახება…") : t("შენახვა")}</button></div></fieldset></form>}</DialogContent></Dialog></AdminShell>;
}
