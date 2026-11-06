import { useState } from 'react'
import { money, useApp } from '../store.jsx'
import { Link, Wordmark } from '../components/ui.jsx'
import { ADMIN_NAV, BRANCHES, ROLES, STATUSES } from '../data.js'

const Table = ({ head, rows }) => <div className="tbl"><table><thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>) : <tr><td colSpan={head.length} className="empty">Nothing here yet.</td></tr>}</tbody></table></div>
const bn = id => BRANCHES.find(b => b.id === id)?.short

function Overview() {
  const { orders } = useApp(); const rev = orders.filter(o => o.status === 4).reduce((s, o) => s + o.total, 0), act = orders.filter(o => o.status < 4)
  return <><div className="stats">{[['Active orders', act.length], ['New (not confirmed)', orders.filter(o => o.status === 0).length], ['Collected sales', money(rev)], ['Orders today', orders.length]].map(([k, v]) => <div key={k} className="card pad stat"><span className="muted">{k}</span><b>{v}</b></div>)}</div>
    <h2>Needs attention</h2><Table head={['Ref', 'Branch', 'Total', 'Status']} rows={act.map(o => [o.ref, bn(o.branch), money(o.total), STATUSES[o.status]])} /></>
}
function Orders() {
  const { orders, setStatus, markPaid } = useApp(); const [b, setB] = useState('all')
  return <><div className="chips">{[['all', 'All branches'], ...BRANCHES.map(x => [x.id, x.short])].map(([k, n]) => <button key={k} className={'chip' + (b === k ? ' on' : '')} onClick={() => setB(k)}>{n}</button>)}</div>
    <Table head={['Ref', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Action']} rows={orders.filter(o => b === 'all' || o.branch === b).map(o => [o.ref, o.name, o.items.map(i => i.qty + '× ' + i.name).join(', '), money(o.total),
      o.paid ? 'Paid' : o.pay === 'momo' ? <button className="btn sm ghostd" onClick={() => markPaid(o.ref)}>Mark MoMo paid</button> : 'On collection',
      <span className="pill">{STATUSES[o.status]}</span>, o.status < 4 ? <button className="btn sm" onClick={() => setStatus(o.ref, o.status + 1)}>Move to “{STATUSES[o.status + 1]}”</button> : 'Done'])} /></>
}
function MenuAdmin() {
  const { menu, setMenu, cats, say } = useApp(); const [n, setN] = useState({ name: '', price: '', cat: cats[0] })
  return <><div className="card pad row gap wrapx"><input placeholder="New meal name" value={n.name} onChange={e => setN({ ...n, name: e.target.value })} /><input type="number" placeholder="Price" value={n.price} onChange={e => setN({ ...n, price: e.target.value })} />
    <select value={n.cat} onChange={e => setN({ ...n, cat: e.target.value })}>{cats.map(c => <option key={c}>{c}</option>)}</select>
    <button className="btn" onClick={() => { if (!n.name || !n.price) return say('Enter a name and price'); setMenu([...menu, { id: Date.now(), name: n.name, cat: n.cat, price: +n.price, hue: 20, img: '', desc: 'New meal', avail: { cug: true, sunyani: true }, prices: {} }]); setN({ name: '', price: '', cat: cats[0] }); say('Meal added') }}>Add meal</button></div>
    <Table head={['Meal', 'Category', 'Base price', 'Photo URL', '']} rows={menu.map(m => [m.name, m.cat, <input className="mini" type="number" value={m.price} onChange={e => setMenu(menu.map(x => x.id === m.id ? { ...x, price: +e.target.value } : x))} />,
      <input placeholder="https://…" value={m.img} onChange={e => setMenu(menu.map(x => x.id === m.id ? { ...x, img: e.target.value } : x))} />, <button className="btn sm ghostd" onClick={() => setMenu(menu.filter(x => x.id !== m.id))}>Remove</button>])} /></>
}
function Categories() {
  const { cats, setCats } = useApp(); const [c, setC] = useState('')
  return <><div className="card pad row gap"><input placeholder="New category" value={c} onChange={e => setC(e.target.value)} /><button className="btn" onClick={() => { if (c) { setCats([...cats, c]); setC('') } }}>Add category</button></div>
    {cats.map(x => <div key={x} className="card pad row between">{x}<button className="btn sm ghostd" onClick={() => setCats(cats.filter(y => y !== x))}>Remove</button></div>)}</>
}
function Branches() {
  const { menu, setMenu } = useApp(), up = (id, fn) => setMenu(menu.map(m => m.id === id ? fn(m) : m))
  return <><p className="muted">Switch meals on or off per branch and set a different price where needed. Blank means the base price.</p>
    <Table head={['Meal', ...BRANCHES.flatMap(b => [b.short + ' available', b.short + ' price'])]} rows={menu.map(m => [m.name, ...BRANCHES.flatMap(b => [
      <label className="switch"><input type="checkbox" checked={m.avail[b.id]} onChange={e => up(m.id, x => ({ ...x, avail: { ...x.avail, [b.id]: e.target.checked } }))} /><span /></label>,
      <input className="mini" type="number" placeholder={m.price} value={m.prices[b.id] ?? ''} onChange={e => up(m.id, x => ({ ...x, prices: { ...x.prices, [b.id]: e.target.value === '' ? undefined : +e.target.value } }))} />])])} /></>
}
function Loyalty() {
  const [r, setR] = useState({ per: 10, goal: 50 }), { say } = useApp()
  return <div className="two"><div className="card pad"><h3>Points rules</h3><label>Spend per 1 point (GH₵)<input type="number" value={r.per} onChange={e => setR({ ...r, per: e.target.value })} /></label><label>Points for a free plate<input type="number" value={r.goal} onChange={e => setR({ ...r, goal: e.target.value })} /></label>
    <p className="muted small">Points are only added when an order is collected and paid.</p><button className="btn" onClick={() => say('Rules saved (demo)')}>Save rules</button></div>
    <div className="card pad"><h3>Rewards</h3><p className="deal">Free plate at 50 points</p><p className="deal">Birthday-week sobolo</p></div></div>
}
function Promos() {
  const { promos, setPromos } = useApp(); const [t, setT] = useState('')
  return <><div className="card pad row gap"><input placeholder="e.g. Exam week: 5% off" value={t} onChange={e => setT(e.target.value)} /><button className="btn" onClick={() => { if (t) { setPromos([...promos, { id: Date.now(), name: t, on: true }]); setT('') } }}>Add promotion</button></div>
    {promos.map(p => <div key={p.id} className="card pad row between">{p.name}<label className="switch"><input type="checkbox" checked={p.on} onChange={() => setPromos(promos.map(x => x.id === p.id ? { ...x, on: !x.on } : x))} /><span /></label></div>)}</>
}
const Payments = () => { const { orders, markPaid } = useApp(); return <Table head={['Ref', 'Method', 'Amount', 'Status', '']} rows={orders.map(o => [o.ref, o.pay === 'momo' ? 'Mobile Money' : 'Pay on collection', money(o.total), o.paid ? 'Paid' : 'Pending', !o.paid && o.pay === 'momo' ? <button className="btn sm" onClick={() => markPaid(o.ref)}>Mark paid</button> : ''])} /> }
function Analytics() {
  const d = [['Mon', 420], ['Tue', 510], ['Wed', 380], ['Thu', 640], ['Fri', 720], ['Sat', 300], ['Sun', 150]], m = 720
  return <div className="card pad"><h3>Sales this week (illustrative)</h3><div className="chart">{d.map(([k, v]) => <div key={k}><i style={{ height: v / m * 100 + '%' }} /><span>{k}</span><b>{v}</b></div>)}</div><p className="muted small">Best seller: Waakye Special. Busiest time: 12:30 to 1:30pm.</p></div>
}
function Customers() { return <Table head={['Name', 'Branch', 'Orders', 'Points']} rows={[['Kofi A.', 'CUG Annex', 12, 34], ['Ama B.', 'CUG Annex', 7, 21], ['Yaw M.', 'Sunyani Main', 3, 9]]} /> }
function Reviews() { const { reviews, setReviews } = useApp(); return <Table head={['Customer', 'Rating', 'Comment', 'Shown']} rows={reviews.map(r => [r.who, r.stars + '★', r.text, <label className="switch"><input type="checkbox" checked={r.show} onChange={() => setReviews(reviews.map(x => x.id === r.id ? { ...x, show: !x.show } : x))} /><span /></label>])} /> }
function Staff() {
  const { role, setRole } = useApp(); const all = ADMIN_NAV
  return <><Table head={['Staff', 'Role', 'Branch']} rows={[['Lady 3D', 'Owner', 'All'], ['Esi', 'Manager', 'CUG Annex'], ['Kwame', 'Cashier', 'CUG Annex']]} />
    <h3>What each role can open</h3><Table head={['Section', ...Object.keys(ROLES)]} rows={all.map(([k, n]) => [n, ...Object.keys(ROLES).map(r => ROLES[r].includes(k) ? '✓' : '–')])} />
    <p className="muted small">Use the “View as” switch at the top to feel the difference. You are viewing as {role}.</p></>
}
function Settings() { const { say } = useApp(); return <div className="card pad"><label>Business name<input defaultValue="Lady 3D’s Catering Service" /></label><label>WhatsApp number<input defaultValue="+233 00 000 0000" /></label><label>Opening hours<input defaultValue="Daily, 7am to 7pm" /></label><button className="btn" onClick={() => say('Settings saved (demo)')}>Save settings</button></div> }

const VIEWS = { overview: Overview, orders: Orders, menu: MenuAdmin, categories: Categories, branches: Branches, customers: Customers, loyalty: Loyalty, promos: Promos, payments: Payments, analytics: Analytics, reviews: Reviews, staff: Staff, settings: Settings }
export default function Admin({ section = 'overview' }) {
  const { role, setRole } = useApp(), allowed = ROLES[role].includes(section), V = VIEWS[section] || Overview
  return <div className="admin"><aside><Wordmark light /><nav>{ADMIN_NAV.map(([k, n]) => <Link key={k} to={'/admin/' + k} className={(k === section ? 'on ' : '') + (ROLES[role].includes(k) ? '' : 'lock')}>{n}</Link>)}</nav><Link to="/" className="back">← Customer site</Link></aside>
    <main><div className="row between wrapx"><h1>{ADMIN_NAV.find(n => n[0] === section)?.[1]}</h1><label className="row gap check">View as <select value={role} onChange={e => setRole(e.target.value)}>{Object.keys(ROLES).map(r => <option key={r}>{r}</option>)}</select></label></div>
      <p className="muted small">Prototype data. Nothing is saved after you refresh.</p>
      {allowed ? <V /> : <p className="notice">Your role ({role}) can’t open this section. Ask the owner for access.</p>}</main></div>
}
