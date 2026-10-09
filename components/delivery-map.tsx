"use client";
import {useI18n} from "./language-provider";
import { useEffect, useRef, useState } from 'react';
import type { Point, DeliveryZone } from '@/lib/menu';
const toWorld = (p: Point, z: number) => { const n = 256 * 2 ** z, s = Math.sin(p.lat * Math.PI / 180); return { x: (p.lng + 180) / 360 * n, y: (.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n }; };
const fromWorld = (x: number, y: number, z: number): Point => { const n = 256 * 2 ** z; return { lng: x / n * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI }; };
export function DeliveryMap({ point, onChange, zones = [], drawing = false }: {
    point: Point | null;
    onChange: (p: Point) => void;
    zones?: DeliveryZone[];
    drawing?: boolean;
}) {
    const { t, locale } = useI18n();
    const [center, setCenter] = useState<Point>(point || { lat: 41.641, lng: 41.628 }), [zoom, setZoom] = useState(13), [width, setWidth] = useState(400), [error, setError] = useState('');
    const box = useRef<HTMLDivElement>(null);
    const height = 290;
    useEffect(() => { if (!box.current)
        return; const r = new ResizeObserver(([e]) => setWidth(e.contentRect.width)); r.observe(box.current); return () => r.disconnect(); }, []);
    const c = toWorld(center, zoom), left = c.x - width / 2, top = c.y - height / 2, tiles = [];
    for (let x = Math.floor(left / 256); x <= Math.floor((left + width) / 256); x++)
        for (let y = Math.floor(top / 256); y <= Math.floor((top + height) / 256); y++)
            if (y >= 0 && y < 2 ** zoom)
                tiles.push({ x, y });
    function move(dx: number, dy: number) { setCenter(fromWorld(c.x + dx, c.y + dy, zoom)); }
    function locate() { if (!navigator.geolocation) {
        setError("მდებარეობა მიუწვდომელია. მონიშნე რუკაზე.");
        return;
    } navigator.geolocation.getCurrentPosition(r => { const p = { lat: r.coords.latitude, lng: r.coords.longitude }; setCenter(p); onChange(p); setError(''); }, () => setError("მდებარეობა ვერ განისაზღვრა. მონიშნე რუკაზე."), { timeout: 10000 }); }
    return <div className="delivery-map-wrap"><div className="map-toolbar"><button type="button" onClick={() => setZoom(z => Math.min(18, z + 1))} aria-label={t("რუკის გადიდება")}>+</button><button type="button" onClick={() => setZoom(z => Math.max(11, z - 1))} aria-label={t("რუკის დაპატარავება")}>−</button><button type="button" onClick={() => move(0, -100)} aria-label={t("ჩრდილოეთით")}>↑</button><button type="button" onClick={() => move(-100, 0)} aria-label={t("დასავლეთით")}>←</button><button type="button" onClick={() => move(100, 0)} aria-label={t("აღმოსავლეთით")}>→</button><button type="button" onClick={() => move(0, 100)} aria-label={t("სამხრეთით")}>↓</button><button type="button" onClick={locate}>{t("ჩემი მდებარეობა")}</button></div><div ref={box} className="delivery-map" style={{ height }} role="button" tabIndex={0} aria-label={drawing ? t("რუკაზე დაწკაპუნებით დაამატე ზონის კუთხე") : t("მონიშნე მიტანის მისამართი რუკაზე")} onClick={e => { const r = e.currentTarget.getBoundingClientRect(); onChange(fromWorld(left + e.clientX - r.left, top + e.clientY - r.top, zoom)); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(center);
    } if (e.key === 'ArrowUp') {
        e.preventDefault();
        move(0, -60);
    } if (e.key === 'ArrowDown') {
        e.preventDefault();
        move(0, 60);
    } if (e.key === 'ArrowLeft') {
        e.preventDefault();
        move(-60, 0);
    } if (e.key === 'ArrowRight') {
        e.preventDefault();
        move(60, 0);
    } }}>
 {tiles.map(({ x, y }) => <img key={`${zoom}/${x}/${y}`} src={`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`} alt="" draggable={false} width={256} height={256} style={{ position: 'absolute', left: x * 256 - left, top: y * 256 - top, maxWidth: 'none' }} onError={() => setError("რუკა ვერ ჩაიტვირთა. კოორდინატები შეგიძლია ხელით მიუთითო.")}/>)}
 <svg className="map-overlay" width={width} height={height} aria-hidden="true">{zones.filter(z => drawing || z.enabled).map((z, i) => <polygon key={z.id} points={z.polygon.map(p => { const w = toWorld(p, zoom); return `${w.x - left},${w.y - top}`; }).join(' ')} fill={['#16857533', '#ec594933', '#d2a13133'][i % 3]} stroke={['#168575', '#dc5045', '#bb9429'][i % 3]} strokeWidth={2}/>)}{point && (() => { const w = toWorld(point, zoom); return <g><circle cx={w.x - left} cy={w.y - top} r={9} fill="#e54d40" stroke="white" strokeWidth={3}/><circle cx={w.x - left} cy={w.y - top} r={2} fill="white"/></g>; })()}<path d={`M${width / 2 - 7},${height / 2}h14M${width / 2},${height / 2 - 7}v14`} stroke="#243c37"/></svg></div><a className="map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap {t("ავტორები")}</a><p className="small-note">{drawing ? t("დაამატე მინიმუმ 3 კუთხე. ზონების გადაკვეთისას სიაში პირველი მოქმედებს.") : t("რუკაზე მონიშნე ზუსტი წერტილი. კლავიატურით: ისრები და Enter.")}</p>{error && <p role="status" className="small-note">{t(error)}</p>}{!drawing && <div className="form-grid"><label className="field">{t("განედი")}<input type="number" min="-85" max="85" step="any" value={point?.lat ?? ''} onChange={e => { if (e.target.value !== '')
        onChange({ lat: Number(e.target.value), lng: point?.lng ?? center.lng }); }}/></label><label className="field">{t("გრძედი")}<input type="number" min="-180" max="180" step="any" value={point?.lng ?? ''} onChange={e => { if (e.target.value !== '')
        onChange({ lat: point?.lat ?? center.lat, lng: Number(e.target.value) }); }}/></label></div>}</div>;
}
