/* Дневник зала — версия 2.0 */
'use strict';
const APP_VERSION = '2.0';

/* ================= helpers ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => (n == null || isNaN(n)) ? '?' : Number(n).toLocaleString('ru-RU', {maximumFractionDigits: 1});
const fmtT = kg => kg >= 1000 ? fmt(Math.round(kg / 100) / 10) + ' т' : fmt(Math.round(kg)) + ' кг';
const MON = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONN = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const WD = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const WDL = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
const GROUPS = ['Грудь','Спина','Ноги','Плечи','Бицепс','Трицепс','Пресс','Другое'];
const MAIN_GROUPS = GROUPS.slice(0, 7);
const GCLS = {'Грудь':'g-chest','Спина':'g-back','Ноги':'g-legs','Плечи':'g-sh','Бицепс':'g-biceps','Трицепс':'g-tri','Пресс':'g-abs'};
const gcls = g => GCLS[g] || 'g-other';
const gvar = g => 'var(--' + gcls(g) + ')';
const pd = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const dLong = s => { const d = pd(s); return d.getDate() + ' ' + MON[d.getMonth()]; };
const dShort = s => { const d = pd(s); return d.getDate() + ' ' + MONS[d.getMonth()]; };
const today0 = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const daysAgo = s => Math.round((today0() - pd(s)) / 864e5);
const key = n => String(n || '').trim().toLowerCase();
const repsMid = it => it.reps == null ? null : (it.repsMax ? (it.reps + it.repsMax) / 2 : it.reps);
const repsTop = it => it.reps == null ? null : (it.repsMax || it.reps);
const repsText = it => it.reps == null ? '?' : (it.repsMax && it.repsMax !== it.reps ? it.reps + '–' + it.repsMax : String(it.reps));
const setText = it => fmt(it.weight) + ' × ' + repsText(it) + (it.sets ? ' × ' + it.sets : '');
function e1rm(it){ const r = repsMid(it); if (!it.weight || !r) return null; return r === 1 ? it.weight : it.weight * (1 + r / 30); }
function vol(it){ const r = repsMid(it); if (!it.weight || !r) return null; return it.weight * (it.perHand ? 2 : 1) * r * (it.sets || 1); }
const newId = date => 'w-' + date + '-' + Math.random().toString(36).slice(2, 7);
function plural(n, one, few, many){ const a = Math.abs(n) % 100, b = a % 10; if (a > 10 && a < 20) return many; if (b > 1 && b < 5) return few; if (b === 1) return one; return many; }
function agoText(s){ const d = daysAgo(s); if (d <= 0) return 'сегодня'; if (d === 1) return 'вчера'; return d + ' ' + plural(d, 'день', 'дня', 'дней') + ' назад'; }
const monday = d => { const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; };
const weekKey = s => iso(monday(pd(s)));
const ls = {
  get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
};
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;
function toast(t){ const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, 2800); }

/* ================= data ================= */
const STORE = 'dnevnik-zala:v1';
const SEED = [
  {id:'w-2026-10-06', date:'2026-10-06', items:[
    {name:'Жим горизонтальный', group:'Грудь', weight:50, reps:6, perHand:false},
    {name:'Жим гантелей на наклонной', group:'Грудь', weight:18, reps:10, perHand:true},
    {name:'Сгибание сидя', group:'Бицепс', weight:12.5, reps:10, repsMax:12, perHand:false},
    {name:'Молот сидя', group:'Бицепс', weight:10, reps:null, perHand:true}]},
  {id:'w-2026-10-13', date:'2026-10-13', items:[
    {name:'Жим горизонтальный', group:'Грудь', weight:50, reps:null, perHand:false},
    {name:'Жим гантелей на наклонной', group:'Грудь', weight:18, reps:10, perHand:true},
    {name:'Сгибание сидя', group:'Бицепс', weight:12.5, reps:10, repsMax:12, perHand:false},
    {name:'Молот сидя', group:'Бицепс', weight:12, reps:null, perHand:true}]},
  {id:'w-2026-10-20', date:'2026-10-20', items:[
    {name:'Жим горизонтальный', group:'Грудь', weight:50, reps:8, perHand:false},
    {name:'Разведение рук', group:'Грудь', weight:38, reps:10, repsMax:12, perHand:false},
    {name:'Жим гантелей на наклонной', group:'Грудь', weight:14, reps:10, sets:3, perHand:true},
    {name:'Сгибание сидя', group:'Бицепс', weight:15, reps:12, perHand:false},
    {name:'Молот сидя', group:'Бицепс', weight:12, reps:10, perHand:true},
    {name:'Сгибание стоя с супинацией', group:'Бицепс', weight:12, reps:20, perHand:true}]}
];
let mine = [], owner = '', aliases = {};
let settings = {accent: 'red', goal: 3, sound: true};
let view = null;           // чужие тренировки по ссылке
let workouts = [];         // что сейчас на экране
const open = new Set();
const exState = {};        // настройки графика по упражнению

function load(){
  const raw = ls.get(STORE);
  if (raw) { try { const o = JSON.parse(raw); mine = Array.isArray(o.workouts) ? o.workouts : []; owner = o.owner || ''; aliases = o.aliases || {}; settings = {...settings, ...(o.settings || {})}; return; } catch (e) {} }
  mine = SEED.map(w => ({...w, items: w.items.map(i => ({...i}))}));
  persist();
}
function persist(){
  if (!ls.set(STORE, JSON.stringify({v: 2, owner, aliases, settings, workouts: mine}))) toast('Не удалось сохранить на телефоне. Проверьте свободное место.');
}
function cleanItem(i){
  const n = v => (typeof v === 'number' && isFinite(v)) ? v : null;
  const it = {name: String(i.name || '').trim().slice(0, 80), group: GROUPS.includes(i.group) ? i.group : 'Другое', weight: n(i.weight), reps: n(i.reps), perHand: !!i.perHand};
  if (n(i.repsMax)) it.repsMax = n(i.repsMax);
  if (n(i.sets)) it.sets = n(i.sets);
  return it;
}
const sigOf = w => JSON.stringify([w.date, (w.items || []).map(i => [key(i.name), i.weight, i.reps ?? null, i.repsMax ?? null, i.sets ?? null])]);
function mergeIn(list){
  const have = new Set(mine.map(sigOf));
  let added = 0;
  for (const w of list || []) {
    if (!w || typeof w.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(w.date) || !Array.isArray(w.items)) continue;
    const items = w.items.map(cleanItem).filter(i => i.name && i.weight);
    if (!items.length) continue;
    const nw = {id: newId(w.date), date: w.date, items};
    const s = sigOf(nw); if (have.has(s)) continue;
    have.add(s); mine.push(nw); added++;
  }
  if (added) persist();
  return added;
}
const sorted = list => list.slice().sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

/* ================= derived ================= */
function exercises(list = workouts){
  const m = new Map();
  for (const w of list) for (const it of (w.items || [])) {
    const k = key(it.name); if (!k) continue;
    if (!m.has(k)) m.set(k, {k, name: it.name.trim(), group: it.group || 'Другое', perHand: !!it.perHand, hist: []});
    const e = m.get(k);
    e.name = it.name.trim(); e.group = it.group || e.group; e.perHand = !!it.perHand;
    e.hist.push({...it, date: w.date, wid: w.id, e: e1rm(it), vol: vol(it)});
  }
  return m;
}
function isPR(hist, i){
  const cur = hist[i].e; if (cur == null) return false;
  const prev = hist.slice(0, i).map(h => h.e).filter(v => v != null);
  return prev.length > 0 && cur > Math.max(...prev) + 0.01;
}
function prsOn(date, m){ const out = new Set(); for (const e of m.values()) e.hist.forEach((h, i) => { if (h.date === date && isPR(e.hist, i)) out.add(e.k); }); return out; }
function prCount(m){ let n = 0; for (const e of m.values()) e.hist.forEach((h, i) => { if (isPR(e.hist, i)) n++; }); return n; }
function delta(prev, cur){
  if (!prev) return {t: 'Первая запись', c: 'neu'};
  if (cur.weight !== prev.weight) { const d = cur.weight - prev.weight; return {t: (d > 0 ? '+' : '−') + fmt(Math.abs(d)) + ' кг', c: d > 0 ? 'up' : 'down'}; }
  const a = repsMid(cur), b = repsMid(prev);
  if (a != null && b != null) { const d = a - b; return d === 0 ? {t: 'Как в прошлый раз', c: 'neu'} : {t: (d > 0 ? '+' : '−') + fmt(Math.abs(d)) + ' повт', c: d > 0 ? 'up' : 'down'}; }
  return {t: 'Тот же вес', c: 'neu'};
}
function nextHint(last, perHand){
  if (last.reps == null) return 'Запишите повторы, чтобы было с чем сравнить';
  const top = last.repsMax || last.reps, step = perHand ? 2 : 2.5;
  if (top >= 12) return 'Попробуйте ' + fmt(last.weight + step) + ' × ' + Math.max(8, top - 4) + ' — повторы уже в потолке, пора добавить вес';
  return 'Попробуйте ' + fmt(last.weight) + ' × ' + (top + 1) + ' — тот же вес, на повтор больше';
}
function weekStats(list){
  const by = new Map();
  for (const w of list) {
    const k = weekKey(w.date);
    if (!by.has(k)) by.set(k, {count: 0, tonnage: 0, groups: new Set(), byGroup: {}});
    const s = by.get(k); s.count++;
    for (const it of w.items || []) { const v = vol(it) || 0; s.tonnage += v; s.groups.add(it.group); s.byGroup[it.group] = (s.byGroup[it.group] || 0) + v; }
  }
  return by;
}
function streaks(list){
  const weeks = new Set(list.map(w => weekKey(w.date)));
  const step = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n * 7); return x; };
  let cur = 0, d = monday(new Date());
  if (!weeks.has(iso(d))) d = step(d, -1);
  while (weeks.has(iso(d))) { cur++; d = step(d, -1); }
  let best = 0;
  const all = [...weeks].sort();
  let run = 0, prev = null;
  for (const k of all) { run = (prev && iso(step(pd(prev), 1)) === k) ? run + 1 : 1; best = Math.max(best, run); prev = k; }
  return {cur, best};
}
const MAIN5 = ['Грудь','Спина','Ноги','Плечи','Руки'];
const bigGroup = g => (g === 'Бицепс' || g === 'Трицепс') ? 'Руки' : g;

/* achievements */
const ACH = [
  {id:'w1',  ic:'1',   t:'Первый шаг',        d:'Записать первую тренировку', f:s => s.count, goal:1},
  {id:'w10', ic:'10',  t:'Десятка',           d:'10 тренировок',              f:s => s.count, goal:10},
  {id:'w25', ic:'25',  t:'Четверть сотни',    d:'25 тренировок',              f:s => s.count, goal:25},
  {id:'w50', ic:'50',  t:'Полтинник',         d:'50 тренировок',              f:s => s.count, goal:50},
  {id:'w100',ic:'100', t:'Сотня',             d:'100 тренировок',             f:s => s.count, goal:100},
  {id:'pr1', ic:'PR',  t:'Первый рекорд',     d:'Побить свой расчётный максимум', f:s => s.prs, goal:1},
  {id:'pr10',ic:'×10', t:'Рекордсмен',        d:'10 рекордов',                f:s => s.prs, goal:10},
  {id:'st4', ic:'4н',  t:'Месяц без пропусков', d:'4 недели подряд с тренировками', f:s => s.best, goal:4},
  {id:'st12',ic:'12н', t:'Квартал в строю',   d:'12 недель подряд',           f:s => s.best, goal:12},
  {id:'t1',  ic:'1т',  t:'Первая тонна',      d:'1 т общего тоннажа',         f:s => s.ton, goal:1000},
  {id:'t10', ic:'10т', t:'Грузовик',          d:'10 т общего тоннажа',        f:s => s.ton, goal:10000},
  {id:'t50', ic:'50т', t:'Кит',               d:'50 т общего тоннажа',        f:s => s.ton, goal:50000},
  {id:'all5',ic:'5/5', t:'Всё тело',          d:'Грудь, спина, ноги, плечи и руки за одну неделю', f:s => s.maxG, goal:5},
  {id:'ex10',ic:'≡10', t:'Коллекционер',      d:'10 разных упражнений',       f:s => s.ex, goal:10}
];
function achStats(list){
  const m = exercises(list), ws = weekStats(list);
  let ton = 0, maxG = 0;
  for (const s of ws.values()) { ton += s.tonnage; maxG = Math.max(maxG, new Set([...s.groups].map(bigGroup).filter(g => MAIN5.includes(g))).size); }
  return {count: list.length, prs: prCount(m), best: streaks(list).best, ton, maxG, ex: m.size};
}

/* ================= charts ================= */
function niceStep(raw){ for (const s of [0.5,1,2,2.5,5,10,20,25,50,100,200,250,500,1000,2000,2500,5000,10000]) if (s >= raw) return s; return 20000; }
function spark(hist){
  const useE = hist.some(h => h.e != null);
  const vals = hist.map(h => useE ? h.e : h.weight).filter(v => v != null);
  const W = 96, H = 40, p = 4;
  if (vals.length < 2) return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><circle cx="${W/2}" cy="${H/2}" r="3.5" fill="var(--gc)"/></svg>`;
  let lo = Math.min(...vals), hi = Math.max(...vals); if (hi - lo < 1) { lo -= 1; hi += 1; }
  const x = i => p + i * (W - 2*p) / (vals.length - 1), y = v => p + (hi - v) * (H - 2*p) / (hi - lo);
  const line = vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${line} L${x(vals.length-1).toFixed(1)} ${H-p} L${x(0).toFixed(1)} ${H-p} Z" fill="var(--gc)" fill-opacity=".12"/><path d="${line}" fill="none" stroke="var(--gc)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(vals.length-1)}" cy="${y(vals[vals.length-1])}" r="3.5" fill="var(--gc)"/></svg>`;
}

/* live chart: метрика и период переключаются, по касанию — подсказка */
const CH = {};
const METRICS = {e: {label: '1ПМ', f: h => h.e}, w: {label: 'Вес', f: h => h.weight}, v: {label: 'Объём', f: h => h.vol}};
function liveChart(e){
  const st = exState[e.k] || (exState[e.k] = {m: 'e', p: 'all'});
  let h = e.hist;
  if (st.p !== 'all') { const cut = today0(); cut.setDate(cut.getDate() - (st.p === '1m' ? 31 : 92)); h = h.filter(x => pd(x.date) >= cut); }
  const f = METRICS[st.m].f;
  const pts = h.map(x => ({x, v: f(x)})).filter(p => p.v != null);
  if (!pts.length) return `<div class="chart-empty">${st.m === 'v' || st.m === 'e' ? 'Нет данных — для этой метрики нужны записанные повторы' : 'Нет тренировок за этот период'}</div>`;
  const W = 340, H = 190, pl = 38, pr = 18, pt = 28, pb = 28;
  const vals = pts.map(p => p.v);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < (st.m === 'v' ? 40 : 4)) { const mid = (hi + lo) / 2, half = st.m === 'v' ? 20 : 2; lo = mid - half; hi = mid + half; }
  const step = niceStep((hi - lo) / 3); lo = Math.max(0, Math.floor(lo / step) * step); hi = Math.ceil(hi / step) * step;
  const n = pts.length;
  const X = i => n === 1 ? (pl + (W - pl - pr) / 2) : pl + 6 + i * (W - pl - pr - 12) / (n - 1);
  const Y = v => pt + (hi - v) * (H - pt - pb) / (hi - lo);
  const lab = v => st.m === 'v' ? fmtT(v).replace(' кг', '') : fmt(v);
  let s = '';
  for (let v = lo; v <= hi + 1e-9; v += step) s += `<line x1="${pl}" x2="${W-pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${pl-6}" y="${(Y(v)+3.5).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--muted)" font-family="var(--f-mono)">${lab(v)}</text>`;
  const xy = pts.map((p, i) => [X(i), Y(p.v)]);
  const d = xy.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  if (n > 1) s += `<path d="${d} L${xy[n-1][0].toFixed(1)} ${H-pb} L${xy[0][0].toFixed(1)} ${H-pb} Z" fill="var(--gc)" fill-opacity=".12"/><path class="lc-line" d="${d}" fill="none" stroke="var(--gc)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
  xy.forEach((p, i) => { const last = i === n - 1; s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${last ? 5 : 3.5}" fill="var(--gc)" stroke="var(--surface)" stroke-width="2"/>`; });
  const every = n <= 6 ? 1 : Math.ceil(n / 5);
  pts.forEach((p, i) => { if (i % every === 0 || i === n - 1) s += `<text x="${X(i).toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="10" fill="var(--muted)">${dShort(p.x.date)}</text>`; });
  s += `<g class="lc-cross" visibility="hidden"><line x1="0" x2="0" y1="${pt-6}" y2="${H-pb}" stroke="var(--ink)" stroke-width="1" stroke-dasharray="3 3"/><circle r="7" fill="var(--surface)" stroke="var(--gc)" stroke-width="3"/></g>`;
  CH[e.k] = {W, xy, pts, unit: st.m === 'v' ? 'т' : 'кг', m: st.m};
  return `<div class="lc" data-k="${esc(e.k)}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="График: ${METRICS[st.m].label}">${s}</svg><div class="tip" hidden></div></div>`;
}
function lcPoint(wrap, clientX){
  const c = CH[wrap.dataset.k]; if (!c) return;
  const svg = wrap.querySelector('svg'), r = svg.getBoundingClientRect();
  const x = (clientX - r.left) / r.width * c.W;
  let bi = 0, bd = Infinity; c.xy.forEach((p, i) => { const dd = Math.abs(p[0] - x); if (dd < bd) { bd = dd; bi = i; } });
  const [px, py] = c.xy[bi], p = c.pts[bi];
  const g = svg.querySelector('.lc-cross'); g.setAttribute('visibility', 'visible');
  g.querySelector('line').setAttribute('x1', px); g.querySelector('line').setAttribute('x2', px);
  g.querySelector('circle').setAttribute('cx', px); g.querySelector('circle').setAttribute('cy', py);
  const tip = wrap.querySelector('.tip');
  const val = c.m === 'v' ? fmtT(p.v) : (c.m === 'e' ? '≈ ' + fmt(Math.round(p.v)) + ' кг' : fmt(p.v) + ' кг');
  tip.innerHTML = `${dShort(p.x.date)} · <b>${esc(val)}</b><br>${esc(setText(p.x))}`;
  tip.hidden = false;
  const left = Math.min(Math.max(px / c.W * 100, 18), 82);
  tip.style.left = left + '%';
  tip.style.top = Math.max(0, py / c.W * r.width - 52) + 'px';
}
document.addEventListener('pointerdown', e => { const w = e.target.closest('.lc'); if (w) lcPoint(w, e.clientX); });
document.addEventListener('pointermove', e => { const w = e.target.closest('.lc'); if (w && (e.pointerType === 'mouse' || e.buttons)) lcPoint(w, e.clientX); });

/* rings */
function ringsSVG(vals){
  const R = [64, 47, 30], sw = 13, C = 75;
  let s = '';
  vals.forEach((v, i) => {
    const r = R[i], len = 2 * Math.PI * r, p = Math.max(0, Math.min(1, v));
    s += `<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="var(--r${i+1})" stroke-opacity=".16" stroke-width="${sw}"/>`;
    s += `<circle class="ring-bar" cx="${C}" cy="${C}" r="${r}" fill="none" stroke="var(--r${i+1})" stroke-width="${sw}" stroke-linecap="round" transform="rotate(-90 ${C} ${C})" stroke-dasharray="${len.toFixed(1)}" stroke-dashoffset="${len.toFixed(1)}" data-off="${(len * (1 - p)).toFixed(1)}"${p === 0 ? ' stroke-opacity="0"' : ''}/>`;
  });
  return s;
}
function animateRings(){
  const bars = document.querySelectorAll('#rings-svg .ring-bar');
  requestAnimationFrame(() => requestAnimationFrame(() => bars.forEach(b => b.setAttribute('stroke-dashoffset', b.dataset.off))));
}

/* muscle map: геометрический силуэт спереди и сзади */
function muscleSVG(lv){
  const fill = g => { const l = lv[g] || 0; return l ? `color-mix(in srgb, ${gvar(g)} ${[0, 40, 70, 100][l]}%, var(--surface))` : 'var(--soft)'; };
  const sh = (g, el) => g ? el.replace('/>', ` data-g="${g}" fill="${fill(g)}" stroke="${(lv[g] || 0) ? gvar(g) : 'var(--line)'}" stroke-width="1.2"/>`) : el.replace('/>', ` fill="var(--soft)" stroke="var(--line)" stroke-width="1.2"/>`);
  const fig = (cx, back) => {
    const L = (x, y, w, h, r, g) => sh(g, `<rect x="${cx + x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`);
    const Cc = (x, y, r, g) => sh(g, `<circle cx="${cx + x}" cy="${y}" r="${r}"/>`);
    let s = Cc(0, 16, 11, null) + L(-5, 26, 10, 8, 3, null);
    s += Cc(-30, 44, 10, 'Плечи') + Cc(30, 44, 10, 'Плечи');
    if (!back) {
      s += L(-24, 35, 23, 27, 9, 'Грудь') + L(1, 35, 23, 27, 9, 'Грудь');
      s += L(-14, 65, 28, 43, 7, 'Пресс');
      s += L(-42, 54, 14, 33, 7, 'Бицепс') + L(28, 54, 14, 33, 7, 'Бицепс');
    } else {
      s += L(-18, 32, 36, 12, 6, 'Спина');
      s += L(-25, 46, 50, 44, 12, 'Спина');
      s += L(-14, 92, 28, 16, 6, 'Спина');
      s += L(-42, 54, 14, 33, 7, 'Трицепс') + L(28, 54, 14, 33, 7, 'Трицепс');
    }
    s += L(-44, 90, 12, 32, 6, null) + L(32, 90, 12, 32, 6, null);
    s += back ? L(-22, 110, 21, 22, 10, 'Ноги') + L(1, 110, 21, 22, 10, 'Ноги') : L(-22, 110, 44, 18, 8, null);
    s += L(-22, back ? 135 : 131, 20, back ? 46 : 50, 9, 'Ноги') + L(2, back ? 135 : 131, 20, back ? 46 : 50, 9, 'Ноги');
    s += L(-20, 185, 16, 40, 8, 'Ноги') + L(4, 185, 16, 40, 8, 'Ноги');
    s += `<text x="${cx}" y="240" text-anchor="middle" font-size="11" fill="var(--muted)">${back ? 'сзади' : 'спереди'}</text>`;
    return s;
  };
  return fig(62, false) + fig(178, true);
}

/* tonnage by week */
let TON = [];
function tonnageChart(list){
  const ws = weekStats(list);
  const weeks = [];
  let d = monday(new Date()); d.setDate(d.getDate() - 7 * 11);
  for (let i = 0; i < 12; i++) { const k = iso(d); weeks.push({k, s: ws.get(k)}); d.setDate(d.getDate() + 7); }
  TON = weeks;
  const max = Math.max(...weeks.map(w => w.s ? w.s.tonnage : 0));
  if (!max) return '<div class="chart-empty">Пока нечего показать — нужны записи с повторами</div>';
  const W = 340, H = 170, pl = 36, pr = 6, pt = 10, pb = 24;
  const step = niceStep(max / 3), hi = Math.ceil(max / step) * step;
  const bw = (W - pl - pr) / 12;
  const Y = v => pt + (hi - v) * (H - pt - pb) / hi;
  let s = '';
  for (let v = 0; v <= hi + 1e-9; v += step) s += `<line x1="${pl}" x2="${W-pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="var(--line)"/><text x="${pl-6}" y="${(Y(v)+3.5).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--muted)" font-family="var(--f-mono)">${v >= 1000 ? fmt(v/1000) + 'т' : fmt(v)}</text>`;
  weeks.forEach((w, i) => {
    const x = pl + i * bw + bw * .18, wdt = bw * .64;
    s += `<rect data-wi="${i}" x="${(pl + i * bw).toFixed(1)}" y="${pt}" width="${bw.toFixed(1)}" height="${H - pt - pb}" fill="transparent"/>`;
    if (w.s && w.s.tonnage) {
      let y0 = Y(0);
      for (const g of GROUPS) { const v = w.s.byGroup[g]; if (!v) continue; const hgt = Y(0) - Y(v); s += `<rect data-wi="${i}" x="${x.toFixed(1)}" y="${(y0 - hgt).toFixed(1)}" width="${wdt.toFixed(1)}" height="${Math.max(hgt, 1).toFixed(1)}" fill="${gvar(g)}" rx="2"/>`; y0 -= hgt; }
    }
    if (i % 3 === 0 || i === 11) s += `<text x="${(x + wdt/2).toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="10" fill="var(--muted)">${dShort(w.k)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Тоннаж по неделям">${s}</svg>`;
}
function tonCaption(i){
  const w = TON[i]; if (!w) return;
  const end = pd(w.k); end.setDate(end.getDate() + 6);
  const parts = w.s ? GROUPS.filter(g => w.s.byGroup[g]).map(g => g.toLowerCase() + ' ' + fmtT(w.s.byGroup[g])) : [];
  $('#ton-cap').innerHTML = `Неделя ${dShort(w.k)} – ${dShort(iso(end))}: <b>${w.s && w.s.tonnage ? fmtT(w.s.tonnage) : 'без тренировок'}</b>${parts.length ? ' · ' + esc(parts.join(', ')) : ''}`;
}

/* ================= render: today ================= */
function renderToday(m){
  const now = new Date();
  $('#today-date').textContent = WDL[now.getDay()] + ', ' + now.getDate() + ' ' + MON[now.getMonth()];
  const mon = monday(now), sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  $('#week-range').textContent = dShort(iso(mon)) + ' – ' + dShort(iso(sun));
  const ws = weekStats(workouts), cur = ws.get(iso(mon)) || {count: 0, tonnage: 0, groups: new Set()};
  const prev = [...ws.entries()].filter(([k]) => k < iso(mon)).sort((a, b) => a[0] < b[0] ? 1 : -1).slice(0, 4).map(([, s]) => s.tonnage).filter(v => v > 0);
  const usual = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;
  const goal = settings.goal;
  const gcount = new Set([...cur.groups].map(bigGroup).filter(g => MAIN5.includes(g))).size;
  const v1 = cur.count / goal, v2 = usual ? cur.tonnage / usual : (cur.tonnage ? 1 : 0), v3 = gcount / 5;
  $('#rings-svg').innerHTML = ringsSVG([v1, v2, v3]);
  $('#ring-leg').innerHTML = `
    <div><small style="color:var(--r1)">Тренировки</small><b>${cur.count} из ${goal}</b><span>${cur.count >= goal ? 'Цель недели выполнена' : 'осталось ' + (goal - cur.count)}</span></div>
    <div><small style="color:var(--r2)">Тоннаж</small><b>${fmtT(cur.tonnage)}</b><span>${usual ? 'обычно ' + fmtT(usual) + ' в неделю' : 'первая неделя с записями'}</span></div>
    <div><small style="color:var(--r3)">Группы мышц</small><b>${gcount} из 5</b><span>грудь, спина, ноги, плечи, руки</span></div>`;
  animateRings();
  const st = streaks(workouts);
  $('#streak').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.6-2.6 1.5-3.5.2 1.4.9 2.2 1.8 2.5C11 8 10.8 5.5 12 3z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M6.5 14.5A5.5 5.5 0 0 0 12 21a5.5 5.5 0 0 0 5.5-6.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
    <span>${st.cur ? `Серия: <b>${st.cur} ${plural(st.cur, 'неделя', 'недели', 'недель')} подряд</b>` : 'Серия начнётся с первой тренировки на неделе'}${st.best > st.cur ? ` · рекорд ${st.best}` : ''}</span>`;
  // last workout
  const last = workouts[workouts.length - 1];
  $('#last-sec').hidden = !last;
  if (last) {
    const prs = prsOn(last.date, m);
    $('#last-wk').innerHTML = workoutCard(last, prs, true);
  }
  // next achievement
  const as = achStats(workouts);
  const pending = ACH.map(a => ({a, v: a.f(as)})).filter(x => x.v < x.a.goal).sort((x, y) => (y.v / y.a.goal) - (x.v / x.a.goal));
  const nx = pending[0];
  $('#next-ach').innerHTML = nx ? `<div class="nextach"><div class="medal-ic" style="background:var(--soft);color:var(--muted);box-shadow:inset 0 0 0 5px var(--line)">${esc(nx.a.ic)}</div><div><b>${esc(nx.a.t)}</b><span class="hint">${esc(nx.a.d)} · ${achVal(nx.a, nx.v)} из ${achVal(nx.a, nx.a.goal)}</span><div class="prog"><i style="width:${Math.round(nx.v / nx.a.goal * 100)}%"></i></div></div></div>` : '<b>Все достижения открыты</b>';
  renderCal();
}
const achVal = (a, v) => a.id.startsWith('t') && a.id !== 'two' ? fmtT(v) : fmt(Math.floor(v));
function workoutCard(w, prs, withShare){
  return `<div class="wk" data-open="${esc(w.id)}">
    <div class="wk-top"><div class="wk-date">${dLong(w.date)}<span>${WD[pd(w.date).getDay()]}</span></div>${withShare ? `<button class="link" type="button" data-share-wk="${esc(w.id)}">Поделиться</button>` : `<span class="hint">${(w.items || []).length} упр.</span>`}</div>
    <ul>${(w.items || []).map(it => `<li class="${gcls(it.group)}"><span class="nm">${esc(it.name)}${prs && prs.has(key(it.name)) ? '<span class="pr">рекорд</span>' : ''}</span><span class="v">${esc(setText(it))}</span></li>`).join('')}</ul>
  </div>`;
}
function renderCal(){
  const counts = {}; for (const w of workouts) counts[w.date] = (counts[w.date] || 0) + (w.items || []).length;
  const today = today0();
  const start = monday(today); start.setDate(start.getDate() - 7 * 15);
  let cells = '', months = '', lastM = -1;
  for (let c = 0; c < 16; c++) {
    const cs = new Date(start); cs.setDate(start.getDate() + c * 7);
    const mm = cs.getMonth(); months += `<span>${mm !== lastM ? MONS[mm] : ''}</span>`; lastM = mm;
    for (let r = 0; r < 7; r++) {
      const d = new Date(cs); d.setDate(cs.getDate() + r);
      const s = iso(d), k = counts[s] || 0;
      const lv = d > today ? 'fut' : k >= 5 ? 'l3' : k >= 3 ? 'l2' : k >= 1 ? 'l1' : '';
      cells += `<i class="${lv}${s === iso(today) ? ' today' : ''}" title="${dShort(s)}${k ? ': ' + k + ' упр.' : ''}"></i>`;
    }
  }
  $('#cal').innerHTML = cells; $('#calm').innerHTML = months;
}

/* ================= render: progress ================= */
let MM = {};
function renderProgress(m){
  const n = workouts.length;
  const as = achStats(workouts);
  $('#stats').innerHTML = `<div class="stat"><b>${n}</b><span>${plural(n, 'тренировка', 'тренировки', 'тренировок')}</span></div><div class="stat"><b>${fmtT(as.ton)}</b><span>поднято всего</span></div><div class="stat"><b style="color:var(--accent)">${as.prs}</b><span>${plural(as.prs, 'рекорд', 'рекорда', 'рекордов')}</span></div>`;
  // muscle map + balance (7 дней)
  const cut = today0(); cut.setDate(cut.getDate() - 6);
  const cnt = {}, lastDate = {};
  for (const w of workouts) for (const it of w.items || []) {
    const g = it.group; if (!lastDate[g] || w.date > lastDate[g]) lastDate[g] = w.date;
    if (pd(w.date) >= cut) cnt[g] = (cnt[g] || 0) + 1;
  }
  const lv = {}; for (const g of MAIN_GROUPS) { const c = cnt[g] || 0; lv[g] = c === 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : 3; }
  MM = {cnt, lastDate};
  $('#mm-svg').innerHTML = muscleSVG(lv);
  const maxC = Math.max(1, ...MAIN_GROUPS.map(g => cnt[g] || 0));
  $('#balance').innerHTML = MAIN_GROUPS.map(g => {
    const c = cnt[g] || 0, ld = lastDate[g], old = !ld || daysAgo(ld) > 10;
    return `<div class="bal-row ${gcls(g)}"><span class="nm">${g}</span><span class="bal-track"><i style="width:${Math.round(c / maxC * 100)}%"></i></span><span class="when${old ? ' warn' : ''}">${ld ? agoText(ld) : 'не было'}</span></div>`;
  }).join('');
  const missing = MAIN_GROUPS.filter(g => g !== 'Пресс' && (!lastDate[g] || daysAgo(lastDate[g]) > 10));
  const bw = $('#bal-warn');
  bw.hidden = !missing.length || !n;
  if (missing.length) bw.innerHTML = `<b>Давно не тренировали:</b> ${missing.map(g => g.toLowerCase()).join(', ')}. Для баланса добавьте их в ближайшие тренировки.`;
  // tonnage
  $('#ton-chart').innerHTML = tonnageChart(workouts);
  tonCaption(11);
  // exercises
  renderExercises(m);
  // records
  renderRecords(m);
  // achievements
  const got = ACH.filter(a => a.f(as) >= a.goal).length;
  $('#ach-count').textContent = got + ' из ' + ACH.length;
  $('#ach').innerHTML = ACH.map(a => {
    const v = a.f(as), ok = v >= a.goal;
    return `<div class="medal${ok ? '' : ' locked'}"><div class="medal-ic">${esc(a.ic)}</div><b>${esc(a.t)}</b><span>${esc(a.d)}</span>${ok ? '' : `<div class="prog"><i style="width:${Math.round(Math.min(1, v / a.goal) * 100)}%"></i></div>`}</div>`;
  }).join('');
}
function renderExercises(m){
  const box = $('#exercises');
  if (!m.size) { box.innerHTML = '<div class="empty">Здесь появятся карточки упражнений с прогрессом.</div>'; return; }
  const by = {}; for (const e of m.values()) (by[e.group] = by[e.group] || []).push(e);
  const order = Object.keys(by).sort((a, b) => GROUPS.indexOf(a) - GROUPS.indexOf(b));
  box.innerHTML = order.map(g => `<div class="group ${gcls(g)}"><span class="plate">${esc(g)}</span><div class="cards">${by[g].map(card).join('')}</div></div>`).join('');
}
function card(e){
  const h = e.hist, last = h[h.length-1], prev = h[h.length-2];
  const d = delta(prev, last), pr = isPR(h, h.length-1), isOpen = open.has(e.k);
  let detail = '';
  if (isOpen) {
    const st = exState[e.k] || (exState[e.k] = {m: 'e', p: 'all'});
    const segM = Object.entries(METRICS).map(([k, v]) => `<button type="button" data-ex-m="${k}" data-k="${esc(e.k)}" aria-pressed="${st.m === k}">${v.label}</button>`).join('');
    const segP = [['1m', 'Месяц'], ['3m', '3 мес'], ['all', 'Всё']].map(([k, l]) => `<button type="button" data-ex-p="${k}" data-k="${esc(e.k)}" aria-pressed="${st.p === k}">${l}</button>`).join('');
    detail = `<div class="ex-detail">
      <div class="ctrls"><div class="seg" role="group" aria-label="Метрика">${segM}</div><div class="seg" role="group" aria-label="Период">${segP}</div></div>
      ${liveChart(e)}
      ${view ? '' : `<div class="next"><small>В следующий раз</small><b>${esc(nextHint(last, e.perHand))}</b></div>`}
      <table class="hist"><tbody>${h.slice().reverse().map(x => `<tr><td>${dShort(x.date)}</td><td>${esc(setText(x))}</td><td>${x.e != null ? '≈ ' + fmt(Math.round(x.e)) : '—'}</td></tr>`).join('')}</tbody></table>
      <button class="btn ghost" type="button" data-share-ex="${esc(e.k)}">Поделиться картинкой</button>
    </div>`;
  }
  return `<article class="ex ${gcls(e.group)}${isOpen ? ' open' : ''}" id="ex-${esc(e.k.replace(/\s+/g, '-'))}">
    <button class="ex-head" type="button" data-ex="${esc(e.k)}" aria-expanded="${isOpen}">
      <span class="ex-name"><span class="n">${esc(e.name)}</span>${pr ? '<span class="badge">Рекорд</span>' : ''}<svg class="chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="ex-val"><span class="big">${esc(fmt(last.weight))} × ${esc(repsText(last))}</span><span class="unit">кг${e.perHand ? ' на руку' : ''}${last.sets ? ' · ' + last.sets + ' подх.' : ''}</span></span>
      ${spark(h)}
      <span class="ex-meta"><span class="delta ${d.c}">${d.t}</span>${last.e != null ? `<span class="mono">1ПМ ≈ ${fmt(Math.round(last.e))}</span>` : ''}</span>
    </button>${detail}</article>`;
}
function renderRecords(m){
  const box = $('#records');
  if (!m.size) { box.innerHTML = '<span class="hint">Рекорды появятся после первых тренировок.</span>'; return; }
  const B = [['1–5', 1, 5], ['6–8', 6, 8], ['9–12', 9, 12], ['13+', 13, 999]];
  const list = [...m.values()].sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group));
  box.innerHTML = list.map(e => {
    const withE = e.hist.filter(h => h.e != null);
    const best = withE.length ? withE.reduce((a, b) => b.e > a.e ? b : a) : null;
    const chips = B.map(([lab, lo, hi]) => {
      const c = e.hist.filter(h => { const t = repsTop(h); return t != null && t >= lo && t <= hi; });
      if (!c.length) return '';
      const top = c.reduce((a, b) => b.weight > a.weight ? b : a);
      return `<span><i>${lab}:</i> ${fmt(top.weight)} × ${repsText(top)}</span>`;
    }).join('');
    return `<div class="rec-row ${gcls(e.group)}"><div class="rec-top"><button type="button" data-goto-ex="${esc(e.k)}">${esc(e.name)}</button><span class="best">${best ? '1ПМ ≈ ' + fmt(Math.round(best.e)) + ' · ' + dShort(best.date) : 'макс. ' + fmt(Math.max(...e.hist.map(h => h.weight))) + ' кг'}</span></div>${chips ? `<div class="rec-chips">${chips}</div>` : ''}</div>`;
  }).join('');
}

/* ================= render: history ================= */
function renderHistory(){
  const box = $('#history');
  $('#hist-sub').textContent = workouts.length ? workouts.length + ' ' + plural(workouts.length, 'тренировка', 'тренировки', 'тренировок') : 'Пока пусто';
  $('#add2').hidden = !!view;
  $('#swipe-hint').hidden = !!view || !workouts.length;
  if (!workouts.length) { box.innerHTML = '<div class="empty">Тренировок пока нет. Запишите первую на вкладке «Сегодня».</div>'; return; }
  const m = exercises();
  let html = '', lastM = '';
  for (const w of workouts.slice().reverse()) {
    const d = pd(w.date), mk = d.getFullYear() + '-' + d.getMonth();
    if (mk !== lastM) { html += `<div class="month">${MONN[d.getMonth()]} ${d.getFullYear()}</div>`; lastM = mk; }
    const prs = prsOn(w.date, m);
    html += view ? workoutCard(w, prs, true) : `<div class="sw" data-sw="${esc(w.id)}"><div class="sw-acts">
      <button class="a-rep" type="button" data-rep="${esc(w.id)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Повторить</button>
      <button class="a-share" type="button" data-share-wk="${esc(w.id)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Поделиться</button>
      <button class="a-del" type="button" data-del="${esc(w.id)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Удалить</span></button>
    </div>${workoutCard(w, prs, false)}</div>`;
  }
  box.innerHTML = html;
}

/* ================= render: profile ================= */
const ACCENTS = [['red', '25', '#C42B2B', '#fff'], ['blue', '20', '#1E5DBE', '#fff'], ['yellow', '15', '#E2B43A', '#1A1400'], ['green', '10', '#2C8A4E', '#fff'], ['graphite', '5', '#2A2F35', '#fff']];
function renderProfile(){
  $('#f-owner').value = owner;
  $('#goal-val').textContent = settings.goal;
  $('#sound-toggle').setAttribute('aria-pressed', String(!!settings.sound));
  $('#swatches').innerHTML = ACCENTS.map(([k, n, c, i]) => `<button class="swatch" type="button" data-accent="${k}" aria-pressed="${settings.accent === k}" aria-label="Цвет блина ${n} кг" style="--sc:${c};--si:${i}">${n}</button>`).join('');
  $('#ver').textContent = APP_VERSION;
}
function applyAccent(){ if (settings.accent && settings.accent !== 'red') document.documentElement.dataset.accent = settings.accent; else delete document.documentElement.dataset.accent; }

/* ================= render all ================= */
let tab = 'today';
function render(){
  workouts = sorted(view ? view.workouts : mine);
  const m = exercises();
  renderToday(m);
  if (tab === 'progress') renderProgress(m);
  renderHistory();
  renderProfile();
  $('#exlist').innerHTML = [...exercises(mine).values()].map(e => `<option value="${esc(e.name)}"></option>`).join('');
  $('#cta').hidden = !!view;
  $('#view-banner').hidden = !view;
  if (view) $('#view-text').textContent = (view.owner ? 'Это тренировки: ' + view.owner + '.' : 'С вами поделились тренировками.') + ' Можно посмотреть или добавить их в свой дневник.';
}
function setTab(t, anchor){
  tab = t; ls.set('dz:tab', t);
  for (const v of ['today', 'progress', 'history', 'profile']) $('#v-' + v).hidden = v !== t;
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  if (t === 'progress') renderProgress(exercises());
  if (t === 'today') animateRings();
  if (anchor) { const el = document.getElementById(anchor); if (el) setTimeout(() => el.scrollIntoView({behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start'}), 30); }
  else window.scrollTo(0, 0);
}
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

/* ================= clicks ================= */
document.addEventListener('click', ev => {
  const t = ev.target;
  const go = t.closest('[data-goto]'); if (go) { setTab(go.dataset.goto, go.dataset.anchor); return; }
  const gx = t.closest('[data-goto-ex]'); if (gx) { const k = gx.dataset.gotoEx; open.add(k); renderExercises(exercises()); const el = document.querySelector(`[data-ex="${CSS.escape(k)}"]`); if (el) el.scrollIntoView({behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center'}); return; }
  const h = t.closest('[data-ex]');
  if (h) { const k = h.dataset.ex; open.has(k) ? open.delete(k) : open.add(k); renderExercises(exercises()); const el = document.querySelector(`[data-ex="${CSS.escape(k)}"]`); if (el) el.focus({preventScroll: true}); return; }
  const sm = t.closest('[data-ex-m]'); if (sm) { exState[sm.dataset.k].m = sm.dataset.exM; renderExercises(exercises()); return; }
  const sp = t.closest('[data-ex-p]'); if (sp) { exState[sp.dataset.k].p = sp.dataset.exP; renderExercises(exercises()); return; }
  const mg = t.closest('[data-g]');
  if (mg) { const g = mg.dataset.g, c = MM.cnt[g] || 0, ld = MM.lastDate[g]; $('#mm-cap').textContent = `${g}: ${c} ${plural(c, 'упражнение', 'упражнения', 'упражнений')} за 7 дней${ld ? ', последний раз ' + agoText(ld) : ', ещё не тренировали'}`; return; }
  const wi = t.closest('[data-wi]'); if (wi) { tonCaption(+wi.dataset.wi); return; }
  const sw = t.closest('[data-share-wk]');
  if (sw) { const w = workouts.find(x => x.id === sw.dataset.shareWk); if (w) shareWorkoutImage(w); closeSwipes(); return; }
  const se = t.closest('[data-share-ex]');
  if (se) { const e = exercises().get(se.dataset.shareEx); if (e) shareExerciseImage(e); return; }
  const rp = t.closest('[data-rep]');
  if (rp) { const w = mine.find(x => x.id === rp.dataset.rep); closeSwipes(); if (w) openEditor(null, w); return; }
  const dl = t.closest('[data-del]');
  if (dl) {
    if (!dl.classList.contains('armed')) { dl.classList.add('armed'); dl.querySelector('span').textContent = 'Точно?'; return; }
    mine = mine.filter(w => w.id !== dl.dataset.del); persist(); render(); toast('Тренировка удалена'); return;
  }
  const op = t.closest('[data-open]');
  if (op && !view) { const sw2 = op.closest('.sw'); if (sw2 && sw2.classList.contains('opened')) { closeSwipes(); return; } const w = mine.find(x => x.id === op.dataset.open); if (w) openEditor(w); return; }
  if (t.closest('[data-close]')) { closeSheets(); return; }
  if (t.classList.contains('sheet-bg')) closeSheets();
  if (!t.closest('.sw')) closeSwipes();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSheets(); closePR(); } });
function openSheetEl(id){ $(id).hidden = false; document.body.style.overflow = 'hidden'; }
function closeSheets(){ $('#sheet').hidden = true; $('#paste').hidden = true; document.body.style.overflow = ''; editing = null; }

/* ================= swipe ================= */
const SW_W = 252;
function closeSwipes(except){ document.querySelectorAll('.sw.opened').forEach(s => { if (s !== except) { s.classList.remove('opened'); s.querySelector('.wk').style.transform = ''; const d = s.querySelector('.a-del'); d.classList.remove('armed'); d.querySelector('span').textContent = 'Удалить'; } }); }
(function(){
  let s = null;
  document.addEventListener('pointerdown', e => {
    const card = e.target.closest('.sw .wk'); if (!card) return;
    const sw = card.parentElement;
    s = {sw, card, x0: e.clientX, y0: e.clientY, base: sw.classList.contains('opened') ? -SW_W : 0, drag: false, id: e.pointerId};
  });
  document.addEventListener('pointermove', e => {
    if (!s || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x0, dy = e.clientY - s.y0;
    if (!s.drag) { if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) { s.drag = true; s.sw.classList.add('dragging'); closeSwipes(s.sw); try { s.card.setPointerCapture(e.pointerId); } catch (_) {} } else if (Math.abs(dy) > 10) { s = null; return; } else return; }
    const x = Math.min(0, Math.max(-SW_W - 30, s.base + dx));
    s.card.style.transform = `translateX(${x}px)`;
  });
  const end = e => {
    if (!s || e.pointerId !== s.id) return;
    if (s.drag) {
      s.sw.classList.remove('dragging');
      const dx = e.clientX - s.x0, x = s.base + dx;
      const opn = x < -SW_W / 3;
      s.sw.classList.toggle('opened', opn);
      s.card.style.transform = opn ? `translateX(${-SW_W}px)` : '';
      const block = ev => { ev.stopPropagation(); ev.preventDefault(); };
      s.card.addEventListener('click', block, {capture: true, once: true});
      setTimeout(() => s && s.card && s.card.removeEventListener('click', block, {capture: true}), 50);
    }
    s = null;
  };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
})();

/* ================= editor ================= */
let editing = null, rows = [], delArmed = false;
const blank = () => ({name: '', group: 'Грудь', weight: null, reps: null, repsMax: null, sets: null, perHand: false});
function num(v){ v = String(v || '').trim().replace(',', '.'); if (!v) return null; const n = Number(v); return isNaN(n) ? NaN : n; }
function parseReps(v){ v = String(v || '').trim(); if (!v) return {reps: null, repsMax: null}; const m = v.match(/^(\d+)\s*[-–—]\s*(\d+)$/); if (m) return {reps: +m[1], repsMax: +m[2]}; return /^\d+$/.test(v) ? {reps: +v, repsMax: null} : {reps: NaN, repsMax: null}; }
function lastOf(name){ const e = exercises(sorted(mine)).get(key(name)); if (!e) return null; const hist = editing ? e.hist.filter(h => h.wid !== editing.id) : e.hist; return {e, last: hist.length ? hist[hist.length-1] : null}; }
function rowHTML(r, i){
  const known = r.name ? lastOf(r.name) : null;
  const prev = known && known.last ? `Прошлый раз: ${esc(setText(known.last))} · ${dShort(known.last.date)}` : '';
  return `<div class="row">
    <div class="row-top"><label class="f">Упражнение<input class="inp" id="r${i}-name" list="exlist" value="${esc(r.name)}" placeholder="Например, жим горизонтальный" autocomplete="off"></label><button class="rm" type="button" data-rm="${i}" aria-label="Убрать упражнение">×</button></div>
    <div class="prev" id="r${i}-prev"${prev ? '' : ' hidden'}>${prev}</div>
    <div class="row-mid"><label class="f">Группа<select class="inp" id="r${i}-group">${GROUPS.map(g => `<option${g === r.group ? ' selected' : ''}>${g}</option>`).join('')}</select></label><label class="chk"><input type="checkbox" id="r${i}-hand"${r.perHand ? ' checked' : ''}>Вес на руку</label></div>
    <div class="row-nums">
      <label class="f">Вес, кг<input class="inp mono" id="r${i}-w" inputmode="decimal" value="${r.weight ?? ''}" placeholder="50"></label>
      <label class="f">Повторы<input class="inp mono" id="r${i}-r" inputmode="text" value="${r.reps == null ? '' : esc(repsText(r))}" placeholder="8 или 10-12"></label>
      <label class="f">Подходы<input class="inp mono" id="r${i}-s" inputmode="numeric" value="${r.sets ?? ''}" placeholder="3"></label>
    </div></div>`;
}
function collect(){
  rows = rows.map((_, i) => {
    const rr = parseReps($(`#r${i}-r`).value);
    return {name: $(`#r${i}-name`).value.trim(), group: $(`#r${i}-group`).value, perHand: $(`#r${i}-hand`).checked,
      weight: num($(`#r${i}-w`).value), reps: rr.reps, repsMax: rr.repsMax, sets: num($(`#r${i}-s`).value)};
  });
}
function renderRows(){ $('#rows').innerHTML = rows.map(rowHTML).join(''); }
function openEditor(w, template){
  editing = w || null; delArmed = false;
  $('#sheet-title').textContent = w ? 'Тренировка ' + dLong(w.date) : template ? 'Повтор тренировки' : 'Новая тренировка';
  $('#f-date').value = w ? w.date : iso(new Date());
  const src = w || template;
  rows = src ? (src.items || []).map(it => ({...blank(), ...it})) : [blank()];
  renderRows();
  $('#f-err').hidden = true;
  const del = $('#f-del'); del.hidden = !w; del.classList.remove('armed'); del.textContent = 'Удалить тренировку';
  openSheetEl('#sheet');
}
$('#add').addEventListener('click', () => openEditor(null));
$('#add2').addEventListener('click', () => openEditor(null));
$('#add-row').addEventListener('click', () => {
  collect(); const last = rows[rows.length-1]; rows.push({...blank(), group: last ? last.group : 'Грудь'}); renderRows();
  const f = $(`#r${rows.length-1}-name`); if (f) f.focus();
});
$('#rows').addEventListener('click', e => {
  const b = e.target.closest('[data-rm]'); if (!b) return;
  collect(); rows.splice(+b.dataset.rm, 1); if (!rows.length) rows.push(blank()); renderRows();
});
$('#rows').addEventListener('change', e => {
  const m = e.target.id.match(/^r(\d+)-name$/); if (!m) return;
  const i = +m[1], info = lastOf(e.target.value), pv = $(`#r${i}-prev`);
  if (info) {
    $(`#r${i}-group`).value = info.e.group; $(`#r${i}-hand`).checked = info.e.perHand;
    if (info.last) { pv.textContent = 'Прошлый раз: ' + setText(info.last) + ' · ' + dShort(info.last.date) + '. ' + nextHint(info.last, info.e.perHand); pv.hidden = false; }
  } else pv.hidden = true;
});
function showErr(t){ const el = $('#f-err'); el.textContent = t; el.hidden = false; }
$('#save').addEventListener('click', () => {
  collect();
  const date = $('#f-date').value;
  if (!date) return showErr('Укажите дату тренировки.');
  const items = [];
  for (const r of rows) {
    if (!r.name) continue;
    if (r.weight == null || isNaN(r.weight) || r.weight <= 0) return showErr(`Укажите вес для «${r.name}» числом, например 12,5.`);
    if (Number.isNaN(r.reps)) return showErr(`Повторы для «${r.name}»: число или диапазон вроде 10-12.`);
    if (Number.isNaN(r.sets)) return showErr(`Подходы для «${r.name}» нужно указать числом.`);
    const it = {name: r.name, group: r.group, weight: r.weight, reps: r.reps, perHand: r.perHand};
    if (r.repsMax) it.repsMax = r.repsMax;
    if (r.sets) it.sets = Math.round(r.sets);
    items.push(it);
  }
  if (!items.length) return showErr('Добавьте хотя бы одно упражнение с названием и весом.');
  const before = exercises(sorted(mine.filter(w => !editing || w.id !== editing.id)));
  let id;
  if (editing) { id = editing.id; const i = mine.findIndex(w => w.id === id); mine[i] = {id, date, items}; }
  else { id = newId(date); mine.push({id, date, items}); }
  persist(); closeSheets(); render();
  // рекорды: сравниваем с лучшим результатом до этой даты
  const prs = [];
  for (const it of items) {
    const e = before.get(key(it.name)), cur = e1rm(it);
    if (!e || cur == null) continue;
    const prior = e.hist.filter(h => h.date <= date && h.e != null).map(h => h.e);
    if (prior.length && cur > Math.max(...prior) + 0.01) prs.push({name: it.name, k: key(it.name), from: Math.max(...prior), to: cur, it});
  }
  if (prs.length) showPR(prs); else toast('Тренировка сохранена');
});
$('#f-del').addEventListener('click', () => {
  const b = $('#f-del');
  if (!delArmed) { delArmed = true; b.classList.add('armed'); b.textContent = 'Нажмите ещё раз, чтобы удалить'; return; }
  if (!editing) return;
  mine = mine.filter(w => w.id !== editing.id); persist(); closeSheets(); render(); toast('Тренировка удалена');
});

/* ================= record screen ================= */
let prData = null, confettiRaf = 0;
function showPR(prs){
  prData = prs;
  $('#pr-title').textContent = prs.length > 1 ? 'Новые рекорды: ' + prs.length : 'Новый рекорд';
  $('#pr-list').innerHTML = prs.map(p => `<div class="pr-item"><b>${esc(p.name)}</b><span><i>${fmt(Math.round(p.from))}</i>${fmt(Math.round(p.to))} кг</span></div>`).join('') + '<span class="hint">расчётный максимум на 1 повтор</span>';
  $('#pr').hidden = false; document.body.style.overflow = 'hidden';
  if (settings.sound) chime();
  if (!reduceMotion()) confetti();
  setTimeout(() => $('#pr-close').focus(), 50);
}
function closePR(){ if ($('#pr').hidden) return; $('#pr').hidden = true; document.body.style.overflow = ''; cancelAnimationFrame(confettiRaf); }
$('#pr-close').addEventListener('click', closePR);
$('#pr-share').addEventListener('click', () => { if (!prData) return; const e = exercises(sorted(mine)).get(prData[0].k); if (e) shareExerciseImage(e); });
function chime(){
  try {
    const A = window.AudioContext || window.webkitAudioContext; const c = new A();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * 0.09;
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.6);
    });
    setTimeout(() => c.close(), 1600);
  } catch (e) {}
}
function confetti(){
  const cv = $('#confetti'), dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
  const x = cv.getContext('2d'); x.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const cols = ['--g-chest', '--g-biceps', '--g-back', '--g-legs', '--accent'].map(v => css.getPropertyValue(v).trim() || '#E5534B');
  const P = Array.from({length: 140}, () => ({x: W / 2 + (Math.random() - .5) * 60, y: H * .32, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 4, a: Math.random() * 6, va: (Math.random() - .5) * .3, c: cols[Math.floor(Math.random() * cols.length)], round: Math.random() < .35}));
  const t0 = performance.now();
  const tick = now => {
    const t = now - t0; x.clearRect(0, 0, W, H);
    for (const p of P) {
      p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      x.save(); x.globalAlpha = Math.max(0, 1 - t / 2600); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c;
      if (p.round) { x.beginPath(); x.arc(0, 0, p.r / 2, 0, Math.PI * 2); x.fill(); } else x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      x.restore();
    }
    if (t < 2600) confettiRaf = requestAnimationFrame(tick); else x.clearRect(0, 0, W, H);
  };
  confettiRaf = requestAnimationFrame(tick);
}

/* ================= paste from notes ================= */
const STOP = ['по', 'с', 'на', 'и', 'в', 'со'];
const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\s]/g, ' ').split(/\s+/).filter(w => w && !STOP.includes(w));
function guessGroup(n){
  const s = n.toLowerCase();
  if (/трицеп|франц|разгиб|брусь/.test(s)) return 'Трицепс';
  if (/сгиб|молот|бицеп|супинац/.test(s)) return 'Бицепс';
  if (/тяг|подтяг|спин|гиперэкст/.test(s)) return 'Спина';
  if (/присед|выпад|ног|икр|бедр|ягод/.test(s)) return 'Ноги';
  if (/мах|плеч|армейск|дельт/.test(s)) return 'Плечи';
  if (/пресс|скруч|планк/.test(s)) return 'Пресс';
  if (/жим|развед|бабоч|кроссов|груд|отжим/.test(s)) return 'Грудь';
  return 'Другое';
}
function matchKnown(raw, known){
  const w = norm(raw), wk = w.join(' ');
  if (!w.length) return null;
  if (aliases[wk] && known.includes(aliases[wk])) return aliases[wk];
  let best = null;
  for (const k of known) {
    const kw = norm(k);
    if (kw.join(' ') === wk) return k;
    let j = 0, ok = true;
    for (const x of w) { while (j < kw.length && !kw[j].startsWith(x)) j++; if (j >= kw.length) { ok = false; break; } j++; }
    if (ok && (!best || kw.length < norm(best).length)) best = k;
  }
  return best;
}
function parseDateLine(s){
  const m = s.match(/^(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?(?=\s|$|[:,])/);
  if (!m) return null;
  const d = +m[1], mo = +m[2];
  let y = m[3] ? +m[3] : null; if (y != null && y < 100) y += 2000;
  const today = today0();
  if (y == null) { y = today.getFullYear(); const t = new Date(y, mo - 1, d); if (t > today) y--; }
  const dt = new Date(y, mo - 1, d);
  const ok = mo >= 1 && mo <= 12 && dt.getDate() === d && dt.getMonth() === mo - 1;
  return {raw: m[0], date: ok ? iso(dt) : ''};
}
function parseExLine(s){
  const m = s.match(/^(.*?)(?:\s+по)?\s+(\d+(?:[.,]\d+)?)\s*(?:кг)?(.*)$/i);
  if (!m) return null;
  const name = m[1].replace(/\s+(по|с весом|вес)$/i, '').trim();
  if (!name || !/[a-zа-яё]/i.test(name)) return null;
  const rest = m[3] || '';
  let reps = null, repsMax = null, sets = null;
  const r = rest.match(/(?:на|x|х|×|\*)\s*(\d+)(?:\s*[-–—]\s*(\d+))?/i);
  if (r) { reps = +r[1]; if (r[2]) repsMax = +r[2]; }
  const st = rest.match(/(\d+)\s*подх/i) || rest.match(/(?:на|x|х|×|\*)\s*\d+(?:\s*[-–—]\s*\d+)?\s*(?:x|х|×|\*)\s*(\d+)/i);
  if (st) sets = +st[1];
  return {raw: s, name, weight: parseFloat(m[2].replace(',', '.')), reps, repsMax, sets, perHand: /\sпо\s+\d/i.test(' ' + s) || /гант/i.test(name)};
}
function parseNotes(text){
  const out = [], skipped = [];
  let cur = null;
  for (const line0 of text.split(/\r?\n/)) {
    const line = line0.trim().replace(/\s+/g, ' ').replace(/^[•*\-–—]\s*/, '');
    if (!line || /^[.\-–—_•*]+$/.test(line)) continue;
    const dl = parseDateLine(line);
    if (dl) { cur = {rawDate: dl.raw, date: dl.date, items: []}; out.push(cur); const tail = line.slice(dl.raw.length).trim(); if (tail && /\d/.test(tail)) { const ex = parseExLine(tail); if (ex) cur.items.push(ex); } continue; }
    const ex = parseExLine(line);
    if (!ex) { skipped.push(line); continue; }
    if (!cur) { cur = {rawDate: '', date: '', items: []}; out.push(cur); }
    cur.items.push(ex);
  }
  return {workouts: out.filter(w => w.items.length), skipped};
}
let parsed = null;
function renderPreview(){
  const box = $('#paste-preview');
  const known = [...exercises(mine).values()].map(e => e.name);
  let html = parsed.workouts.map((w, i) => {
    const items = w.items.map((it, j) => {
      const match = matchKnown(it.name, known);
      it.choice = it.choice || (match ? 'k:' + match : 'n:');
      const opts = [`<option value="n:"${it.choice === 'n:' ? ' selected' : ''}>Новое: ${esc(it.name)}</option>`]
        .concat(known.map(k => `<option value="k:${esc(k)}"${it.choice === 'k:' + k ? ' selected' : ''}>${esc(k)}</option>`)).join('');
      return `<div class="pv-it"><span class="raw">${esc(it.raw)}</span><select class="inp" id="p${i}-${j}" aria-label="Упражнение">${opts}</select><span class="v">${esc(setText(it))}</span></div>`;
    }).join('');
    const bad = !w.date;
    return `<div class="pv-wk${bad ? ' bad' : ''}"><div class="pv-date"><input class="inp" type="date" id="p${i}-date" value="${w.date}" aria-label="Дата тренировки"><span class="hint">${w.items.length} упр.</span></div>${bad ? `<div class="pv-note">${w.rawDate ? 'Дата «' + esc(w.rawDate) + '» не похожа на настоящую — выберите правильную.' : 'Над упражнениями нет даты — выберите её.'}</div>` : ''}${items}</div>`;
  }).join('');
  if (parsed.skipped.length) html += `<div class="pv-skip"><b>Не разобрал ${parsed.skipped.length} стр.:</b> ${parsed.skipped.map(esc).join(' · ')}. Добавьте их вручную или поправьте текст и разберите снова.</div>`;
  box.innerHTML = html; box.hidden = false;
  $('#paste-save').hidden = !parsed.workouts.length;
  $('#paste-save').textContent = 'Добавить в дневник: ' + parsed.workouts.length + ' трен.';
}
$('#paste-open').addEventListener('click', () => { parsed = null; $('#paste-preview').hidden = true; $('#paste-save').hidden = true; $('#paste-err').hidden = true; openSheetEl('#paste'); setTimeout(() => $('#paste-text').focus(), 50); });
$('#paste-parse').addEventListener('click', () => {
  parsed = parseNotes($('#paste-text').value);
  $('#paste-err').hidden = true;
  if (!parsed.workouts.length) { $('#paste-preview').hidden = true; $('#paste-save').hidden = true; const e = $('#paste-err'); e.textContent = 'Не нашёл упражнений. Нужны строки вида «Жим гориз 50 на 8», а над ними дата, например 6.10.26.'; e.hidden = false; return; }
  renderPreview();
});
$('#paste-preview').addEventListener('change', e => {
  const m = e.target.id.match(/^p(\d+)-(\d+)$/); if (m) parsed.workouts[+m[1]].items[+m[2]].choice = e.target.value;
  const d = e.target.id.match(/^p(\d+)-date$/); if (d) { parsed.workouts[+d[1]].date = e.target.value; e.target.closest('.pv-wk').classList.toggle('bad', !e.target.value); }
});
$('#paste-save').addEventListener('click', () => {
  if (parsed.workouts.some(w => !w.date)) { const e = $('#paste-err'); e.textContent = 'У одной из тренировок не выбрана дата — она выделена красным.'; e.hidden = false; return; }
  const ex = exercises(mine);
  const list = parsed.workouts.map(w => ({date: w.date, items: w.items.map(it => {
    const known = it.choice.startsWith('k:') ? it.choice.slice(2) : null;
    const k = known ? ex.get(key(known)) : null;
    if (known && norm(it.name).join(' ') !== norm(known).join(' ')) aliases[norm(it.name).join(' ')] = known;
    const out = {name: known || it.name, group: k ? k.group : guessGroup(it.name), weight: it.weight, reps: it.reps, perHand: k ? k.perHand : it.perHand};
    if (it.repsMax) out.repsMax = it.repsMax;
    if (it.sets) out.sets = it.sets;
    return out;
  })}));
  const n = mergeIn(list);
  persist(); closeSheets(); render();
  $('#paste-text').value = '';
  toast(n ? 'Добавлено тренировок: ' + n : 'Эти тренировки уже есть в дневнике');
});

/* ================= profile settings ================= */
$('#f-owner').addEventListener('change', e => { owner = e.target.value.trim().slice(0, 40); persist(); });
$('#goal-minus').addEventListener('click', () => { settings.goal = Math.max(1, settings.goal - 1); persist(); render(); });
$('#goal-plus').addEventListener('click', () => { settings.goal = Math.min(7, settings.goal + 1); persist(); render(); });
$('#sound-toggle').addEventListener('click', () => { settings.sound = !settings.sound; persist(); renderProfile(); });
$('#swatches').addEventListener('click', e => { const b = e.target.closest('[data-accent]'); if (!b) return; settings.accent = b.dataset.accent; persist(); applyAccent(); renderProfile(); });

/* ================= sharing ================= */
const appUrl = () => location.origin + location.pathname;
async function shareFile(file, title){
  if (navigator.canShare && navigator.canShare({files: [file]})) {
    try { await navigator.share({files: [file], title}); return true; } catch (e) { if (e.name === 'AbortError') return false; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast('Файл сохранён в «Загрузки»'); return true;
}
async function shareText({title, text, url}){
  if (navigator.share) { try { await navigator.share({title, text, url}); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText([text, url].filter(Boolean).join('\n')); toast('Скопировано — вставьте в чат'); }
  catch (e) { toast('Не получилось поделиться. Скопируйте адрес из браузера.'); }
}
const b64u = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = str => { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const s = atob(str); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; };
async function pack(obj){
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (window.CompressionStream) {
    try { const st = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw')); return 'z' + b64u(new Uint8Array(await new Response(st).arrayBuffer())); } catch (e) {}
  }
  return 'j' + b64u(bytes);
}
async function unpack(s){
  let raw = unb64u(s.slice(1));
  if (s[0] === 'z') { const st = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw')); raw = new Uint8Array(await new Response(st).arrayBuffer()); }
  return JSON.parse(new TextDecoder().decode(raw));
}
const payload = () => ({v: 1, owner, workouts: mine.map(w => ({date: w.date, items: w.items}))});
$('#sh-link').addEventListener('click', async () => {
  if (!mine.length) return toast('Сначала запишите хотя бы одну тренировку');
  const url = appUrl() + '#d=' + await pack(payload());
  shareText({title: 'Дневник зала', text: (owner ? 'Тренировки: ' + owner : 'Мои тренировки') + ' — прогресс и рекорды', url});
});
$('#sh-app').addEventListener('click', () => shareText({title: 'Дневник зала', text: 'Дневник тренировок с графиками прогресса. Откройте и добавьте на экран «Домой».', url: appUrl()}));
$('#sh-text').addEventListener('click', () => {
  const src = sorted(view ? view.workouts : mine); if (!src.length) return toast('Тренировок пока нет');
  const w = src[src.length - 1];
  shareText({title: 'Тренировка ' + dLong(w.date), text: workoutText(w, src)});
});
$('#sh-image').addEventListener('click', () => {
  const src = sorted(view ? view.workouts : mine); if (!src.length) return toast('Тренировок пока нет');
  shareWorkoutImage(src[src.length - 1]);
});
$('#sh-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({app: 'dnevnik-zala', exportedAt: new Date().toISOString(), ...payload(), aliases, settings}, null, 1)], {type: 'application/json'});
  shareFile(new File([blob], 'dnevnik-zala-' + iso(new Date()) + '.json', {type: 'application/json'}), 'Резервная копия дневника');
});
$('#sh-import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const o = JSON.parse(await f.text());
    const n = mergeIn(o.workouts);
    if (!owner && o.owner) owner = String(o.owner).slice(0, 40);
    if (o.aliases && typeof o.aliases === 'object') aliases = {...o.aliases, ...aliases};
    persist(); render(); toast(n ? 'Добавлено тренировок: ' + n : 'Все тренировки из файла уже есть');
  } catch (err) { toast('Это не файл дневника. Выберите файл, сохранённый кнопкой «Сохранить файл».'); }
});
function workoutText(w, src){
  const m = exercises(src), prs = prsOn(w.date, m);
  const lines = (w.items || []).map(it => '• ' + it.name + ' — ' + setText(it) + (it.perHand ? ' (на руку)' : '') + (prs.has(key(it.name)) ? ' — рекорд' : ''));
  return 'Тренировка ' + dLong(w.date) + ', ' + WDL[pd(w.date).getDay()] + '\n' + lines.join('\n');
}

/* view someone's link */
async function readHash(){
  const h = location.hash;
  if (!h.startsWith('#d=')) { if (view) { view = null; render(); } return; }
  try {
    const o = await unpack(h.slice(3));
    const list = (o.workouts || []).filter(w => w && w.date && Array.isArray(w.items)).map((w, i) => ({id: 'v' + i, date: w.date, items: w.items.map(cleanItem).filter(x => x.name)}));
    view = {owner: String(o.owner || '').slice(0, 40), workouts: list};
    open.clear(); render(); setTab('today');
  } catch (e) { toast('Ссылка повреждена — попросите отправить её ещё раз'); history.replaceState(null, '', appUrl()); }
}
$('#view-close').addEventListener('click', () => { history.replaceState(null, '', appUrl()); view = null; open.clear(); render(); });
$('#view-import').addEventListener('click', () => {
  const n = mergeIn(view.workouts);
  history.replaceState(null, '', appUrl()); view = null; open.clear(); render();
  toast(n ? 'Добавлено тренировок: ' + n : 'Эти тренировки уже есть в дневнике');
});
window.addEventListener('hashchange', readHash);

/* ================= share images (canvas) ================= */
const IMG = {bg: '#111315', panel: '#1A1D20', ink: '#ECEEF0', muted: '#98A0A9', line: '#2B3035', up: '#4DB875', down: '#E07A5F',
  g: {'g-chest': '#E5534B', 'g-biceps': '#5C8FE6', 'g-back': '#E2B43A', 'g-legs': '#4DB875', 'g-sh': '#A28BEA', 'g-tri': '#EE8C45', 'g-abs': '#3CC2B9', 'g-other': '#8C949E'}};
const IMG_ACC = {red: '#E5534B', blue: '#5C8FE6', yellow: '#E2B43A', green: '#4DB875', graphite: '#D9DDE2'};
const accentImg = () => IMG_ACC[settings.accent] || IMG_ACC.red;
const F = {d: '"Unbounded","Arial Black",sans-serif', b: '"Golos Text",-apple-system,"Helvetica Neue",sans-serif', m: '"JetBrains Mono",Menlo,monospace'};
async function fontsReady(){ try { await Promise.all(['700 80px Unbounded', '500 40px Unbounded', '500 40px "Golos Text"', '600 40px "Golos Text"', '500 40px "JetBrains Mono"'].map(f => document.fonts.load(f, 'АБВ 50 × 8'))); } catch (e) {} }
function canvas(){ const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d'); x.fillStyle = IMG.bg; x.fillRect(0, 0, 1080, 1350); return [c, x]; }
function plateDeco(x){
  const cx = 960, cy = 150, R = 260;
  x.save(); x.globalAlpha = .18;
  x.fillStyle = accentImg(); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
  x.fillStyle = IMG.bg; x.beginPath(); x.arc(cx, cy, R * .34, 0, Math.PI * 2); x.fill();
  x.globalAlpha = .35; x.strokeStyle = IMG.bg; x.lineWidth = 10; x.beginPath(); x.arc(cx, cy, R * .8, 0, Math.PI * 2); x.stroke();
  x.restore();
}
function fit(x, text, maxW, size, weight, family, min = 28){ let s = size; do { x.font = `${weight} ${s}px ${family}`; if (x.measureText(text).width <= maxW) break; s -= 2; } while (s > min); return s; }
function clip(x, text, maxW){ if (x.measureText(text).width <= maxW) return text; let t = text; while (t.length > 1 && x.measureText(t + '…').width > maxW) t = t.slice(0, -1); return t + '…'; }
function header(x, title){
  x.fillStyle = IMG.muted; x.font = `600 28px ${F.b}`;
  x.letterSpacing = '4px';
  x.fillText('ДНЕВНИК ЗАЛА' + (title ? ' · ' + title.toUpperCase() : ''), 80, 120);
  x.letterSpacing = '0px';
}
function footer(x){
  x.strokeStyle = IMG.line; x.lineWidth = 2; x.beginPath(); x.moveTo(80, 1240); x.lineTo(1000, 1240); x.stroke();
  x.fillStyle = IMG.muted; x.font = `500 26px ${F.m}`; x.fillText(location.host || 'Дневник зала', 80, 1290);
  x.textAlign = 'right'; x.fillText('1ПМ — расчётный максимум', 1000, 1290); x.textAlign = 'left';
}
function pill(x, text, px, py, color){
  x.font = `600 22px ${F.b}`; const w = x.measureText(text).width + 28;
  x.fillStyle = color; x.beginPath(); x.roundRect(px, py - 26, w, 36, 18); x.fill();
  x.fillStyle = IMG.bg; x.fillText(text, px + 14, py); return w;
}
async function toFile(c, name){ const blob = await new Promise(r => c.toBlob(r, 'image/png')); return new File([blob], name, {type: 'image/png'}); }
async function shareWorkoutImage(w){
  await fontsReady();
  const src = sorted(view ? view.workouts : mine);
  const m = exercises(src), prs = prsOn(w.date, m);
  const [c, x] = canvas(); plateDeco(x);
  header(x, view ? view.owner : owner);
  x.fillStyle = IMG.ink; x.font = `700 92px ${F.d}`; x.fillText(dLong(w.date), 80, 250);
  x.fillStyle = IMG.muted; x.font = `500 34px ${F.b}`;
  const items = w.items || [];
  const ton = items.reduce((a, it) => a + (vol(it) || 0), 0);
  x.fillText(WDL[pd(w.date).getDay()] + ' · ' + items.length + ' упр.' + (ton ? ' · ' + fmtT(ton) : '') + (prs.size ? ' · рекордов: ' + prs.size : ''), 80, 310);
  const top = 380, bottom = 1200, rowH = Math.min(120, (bottom - top) / Math.max(items.length, 1));
  const fs = Math.max(26, Math.min(40, rowH * .36));
  items.forEach((it, i) => {
    const y = top + i * rowH, mid = y + rowH / 2;
    x.fillStyle = IMG.panel; x.beginPath(); x.roundRect(80, y + 6, 920, rowH - 12, 20); x.fill();
    x.fillStyle = IMG.g[gcls(it.group)]; x.beginPath(); x.arc(118, mid, 10, 0, Math.PI * 2); x.fill();
    const val = fmt(it.weight) + ' × ' + repsText(it) + (it.sets ? ' × ' + it.sets : '');
    x.font = `500 ${fs * 1.1}px ${F.m}`; const vw = x.measureText(val).width;
    x.textAlign = 'right'; x.fillStyle = IMG.ink; x.fillText(val, 970, mid + fs * .38); x.textAlign = 'left';
    const isPr = prs.has(key(it.name));
    x.font = `500 ${fs}px ${F.b}`; x.fillStyle = IMG.ink;
    const nm = clip(x, it.name, 970 - vw - 190 - (isPr ? 120 : 0));
    x.fillText(nm, 148, mid + fs * .36);
    if (isPr) pill(x, 'РЕКОРД', 148 + x.measureText(nm).width + 16, mid + 9, accentImg());
  });
  footer(x);
  shareFile(await toFile(c, 'trenirovka-' + w.date + '.png'), 'Тренировка ' + dLong(w.date));
}
async function shareExerciseImage(e){
  await fontsReady();
  const h = e.hist, last = h[h.length-1], prev = h[h.length-2], d = delta(prev, last), pr = isPR(h, h.length-1);
  const col = IMG.g[gcls(e.group)];
  const [c, x] = canvas(); plateDeco(x);
  header(x, view ? view.owner : owner);
  x.fillStyle = col; x.beginPath(); x.arc(92, 178, 12, 0, Math.PI * 2); x.fill();
  x.fillStyle = IMG.muted; x.font = `600 30px ${F.b}`; x.fillText(e.group, 116, 189);
  fit(x, e.name, 920, 64, 700, F.d, 36); x.fillStyle = IMG.ink; x.fillText(e.name, 80, 270);
  const big = fmt(last.weight) + ' × ' + repsText(last);
  fit(x, big, 760, 150, 700, F.d, 80); x.fillStyle = IMG.ink; x.fillText(big, 80, 450);
  x.fillStyle = IMG.muted; x.font = `500 32px ${F.b}`;
  x.fillText('кг' + (e.perHand ? ' на руку' : '') + (last.sets ? ' · ' + last.sets + ' подх.' : '') + ' · ' + dLong(last.date), 80, 510);
  let px = 80;
  px += pill(x, d.t.toUpperCase(), px, 580, d.c === 'up' ? IMG.up : d.c === 'down' ? IMG.down : IMG.muted) + 12;
  if (pr) px += pill(x, 'РЕКОРД', px, 580, accentImg()) + 12;
  if (last.e != null) { x.fillStyle = IMG.muted; x.font = `500 30px ${F.m}`; x.fillText('1ПМ ≈ ' + fmt(Math.round(last.e)), px + 8, 580); }
  const L = 150, R = 1000, T = 740, B = 1130;
  x.fillStyle = IMG.panel; x.beginPath(); x.roundRect(80, 640, 920, 560, 28); x.fill();
  const vals = h.flatMap(p => [p.weight, p.e]).filter(v => v != null);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 4) { const md = (hi + lo) / 2; lo = md - 2; hi = md + 2; }
  const step = niceStep((hi - lo) / 3); lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
  const n = h.length;
  const X = i => n === 1 ? (L + R) / 2 - 20 : L + 10 + i * (R - L - 60) / (n - 1);
  const Y = v => T + (hi - v) * (B - T) / (hi - lo);
  x.font = `500 24px ${F.m}`; x.textAlign = 'right';
  for (let v = lo; v <= hi + 1e-9; v += step) { x.strokeStyle = IMG.line; x.lineWidth = 2; x.beginPath(); x.moveTo(L, Y(v)); x.lineTo(R - 30, Y(v)); x.stroke(); x.fillStyle = IMG.muted; x.fillText(fmt(v), L - 14, Y(v) + 8); }
  x.textAlign = 'center';
  const every = n <= 6 ? 1 : Math.ceil(n / 5);
  h.forEach((p, i) => { if (i % every === 0 || i === n - 1) { x.fillStyle = IMG.muted; x.font = `500 24px ${F.b}`; x.fillText(dShort(p.date), X(i), B + 46); } });
  const pts = k => h.map((p, i) => p[k] != null ? [X(i), Y(p[k])] : null).filter(Boolean);
  const wp = pts('weight'), ep = pts('e');
  x.setLineDash([12, 12]); x.strokeStyle = IMG.muted; x.lineWidth = 3; x.beginPath(); wp.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.stroke(); x.setLineDash([]);
  wp.forEach(p => { x.fillStyle = IMG.muted; x.beginPath(); x.arc(p[0], p[1], 6, 0, Math.PI * 2); x.fill(); });
  if (ep.length > 1) {
    x.globalAlpha = .15; x.fillStyle = col; x.beginPath(); ep.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.lineTo(ep[ep.length-1][0], B); x.lineTo(ep[0][0], B); x.closePath(); x.fill(); x.globalAlpha = 1;
    x.strokeStyle = col; x.lineWidth = 6; x.lineJoin = 'round'; x.lineCap = 'round'; x.beginPath(); ep.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.stroke();
  }
  ep.forEach((p, i) => { const lastP = i === ep.length - 1; x.fillStyle = col; x.strokeStyle = IMG.panel; x.lineWidth = 5; x.beginPath(); x.arc(p[0], p[1], lastP ? 13 : 9, 0, Math.PI * 2); x.fill(); x.stroke(); });
  x.textAlign = 'left';
  x.font = `500 24px ${F.b}`; x.fillStyle = col; x.fillRect(112, 676, 30, 5); x.fillStyle = IMG.muted; x.fillText('1ПМ', 152, 686);
  x.setLineDash([8, 8]); x.strokeStyle = IMG.muted; x.lineWidth = 3; x.beginPath(); x.moveTo(230, 679); x.lineTo(262, 679); x.stroke(); x.setLineDash([]); x.fillText('рабочий вес', 272, 686);
  footer(x);
  shareFile(await toFile(c, 'progress-' + last.date + '.png'), e.name);
}

/* ================= init ================= */
(function(){
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (ios && !standalone && !ls.get('dz:tip')) $('#install-tip').hidden = false;
  $('#install-hide').addEventListener('click', () => { ls.set('dz:tip', '1'); $('#install-tip').hidden = true; });
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
load();
applyAccent();
render();
setTab(['today', 'progress', 'history', 'profile'].includes(ls.get('dz:tab')) ? ls.get('dz:tab') : 'today');
readHash();
