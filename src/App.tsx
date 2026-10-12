import { useMemo, useState } from 'react'

type Screen = 'find' | 'detail' | 'upload' | 'credits' | 'review'
type Item = { name: string; noDeal?: boolean; price: number; seen: number; pending?: boolean; allergens?: string[] | null; hot?: boolean; diet?: string[] }
type Shop = {
  id: string; lat: number; lng: number; name: string; walk: number; deal: number | null; loyalty?: string; loyaltyPrice?: number
  main: Item; snack: Item; drink: Item; why: string; quality: number
}
type Cat = 'main' | 'snack' | 'drink'
const I = (name: string, price: number, seen: number, allergens: string[] | null, diet: string[] = [], x: Partial<Item> = {}): Item => ({ name, price, seen, allergens, diet, ...x })
// Alternatives in the meal deal plus other catalogued items (noDeal = not part of the deal)
const catalogue: Record<string, Record<Cat, Item[]>> = {
  tesco: {
    main: [I('Ham & cheese sandwich', 2.5, 3, ['gluten', 'milk']), I('Veg sushi box', 3.25, 2, ['soy', 'sesame'], ['vegan', 'vegetarian']), I('Chicken & bacon pasta', 3.0, 5, ['gluten', 'egg']), I('Steak bake', 1.9, 1, ['gluten', 'milk'], [], { hot: true, noDeal: true })],
    snack: [I('Fruit pot', 1.25, 2, [], ['vegan', 'vegetarian']), I('Cheese & crackers', 1.4, 4, ['gluten', 'milk'], ['vegetarian']), I('KitKat', 0.9, 8, null, [], { noDeal: true })],
    drink: [I('Still water 500ml', 0.95, 2, [], ['vegan', 'vegetarian']), I('Tropicana orange', 1.6, 3, [], ['vegan', 'vegetarian']), I('Monster Energy', 1.85, 6, [], ['vegan'], { noDeal: true })],
  },
  sains: {
    main: [I('Chicken Caesar wrap', 3.2, 9, ['gluten', 'milk', 'egg']), I('Tuna sweetcorn sandwich', 2.6, 10, ['gluten', 'egg'])],
    snack: [I('Popcorn', 1.0, 9, [], ['vegan', 'vegetarian']), I('Yoghurt pot', 1.1, 9, ['milk'], ['vegetarian'])],
    drink: [I('Coke Zero 500ml', 1.2, 9, [], ['vegan', 'vegetarian']), I('Oat latte (can)', 1.8, 11, null)],
  },
  pret: {
    main: [I('Mac & cheese', 4.5, 1, ['gluten', 'milk'], ['vegetarian'], { hot: true }), I('Falafel salad', 4.25, 2, ['sesame'], ['vegan', 'vegetarian'])],
    snack: [I('Dark choc almonds', 1.5, 1, ['nuts'], ['vegetarian']), I('Popcorn', 1.1, 3, [], ['vegan', 'vegetarian'])],
    drink: [I('Still water', 0.9, 1, [], ['vegan', 'vegetarian']), I('Orange juice', 2.1, 1, [], ['vegan', 'vegetarian'])],
  },
  boots: {
    main: [I('Chicken club sandwich', 3.0, 16, ['gluten', 'egg']), I('Veg pasta salad', 2.9, 17, ['gluten'], ['vegetarian'])],
    snack: [I('Nakd bar', 1.0, 16, ['nuts'], ['vegan', 'vegetarian'])],
    drink: [I('Coca-Cola 500ml', 1.3, 16, [], ['vegan', 'vegetarian'])],
  },
}

const shops: Shop[] = [
  { id: 'tesco', lat: 51.5262, lng: -0.1347, name: 'Tesco Express', walk: 4, deal: 3.85, loyalty: 'Clubcard', loyaltyPrice: 3.85, quality: 3, why: 'Cheapest, and the wrap is hot',
    main: { name: 'Chicken wrap', price: 2.75, seen: 2, hot: true, allergens: ['gluten', 'milk'] },
    snack: { name: 'Walkers crisps', price: 1.0, seen: 2, allergens: ['milk'], diet: ['vegetarian'] },
    drink: { name: 'Coca-Cola 500ml', price: 1.2, seen: 2, allergens: [], diet: ['vegan'] } },
  { id: 'sains', lat: 51.5229, lng: -0.1318, name: "Sainsbury's Local", walk: 6, deal: 4.0, loyalty: 'Nectar', quality: 3, why: 'Good veggie choice, short walk',
    main: { name: 'Falafel & houmous wrap', price: 3.0, seen: 9, allergens: ['gluten', 'sesame'], diet: ['vegan', 'vegetarian'] },
    snack: { name: 'Fruit pot', price: 1.25, seen: 9, allergens: [], diet: ['vegan'] },
    drink: { name: 'Innocent juice', price: 1.6, seen: 9, allergens: [], diet: ['vegan'] } },
  { id: 'pret', lat: 51.5236, lng: -0.1337, name: 'Pret A Manger', walk: 3, deal: null, quality: 5, why: 'Closest, best quality, hot soup',
    main: { name: 'Tomato soup', price: 3.95, seen: 1, hot: true, pending: true, allergens: null, diet: ['vegetarian'] },
    snack: { name: 'Banana', price: 0.6, seen: 1, allergens: [], diet: ['vegan'] },
    drink: { name: 'Filter coffee', price: 1.0, seen: 1, allergens: [], diet: ['vegan'] } },
  { id: 'boots', lat: 51.5208, lng: -0.1345, name: 'Boots', walk: 8, deal: 4.5, quality: 2, why: 'Meal deal includes large drink',
    main: { name: 'Egg mayo sandwich', price: 2.8, seen: 16, allergens: ['gluten', 'egg', 'milk'], diet: ['vegetarian'] },
    snack: { name: 'Popchips', price: 1.1, seen: 16, allergens: [], diet: ['vegan'] },
    drink: { name: 'Water 750ml', price: 1.3, seen: 16, allergens: [], diet: ['vegan'] } },
]

const DIETS = ['vegetarian', 'vegan', 'halal']
const ALLERGENS = ['gluten', 'milk', 'egg', 'nuts', 'sesame', 'soy']
const gbp = (n: number) => `£${n.toFixed(2)}`
const sep = (s: Shop) => s.main.price + s.snack.price + s.drink.price
const best = (s: Shop) => Math.min(sep(s), s.deal ?? Infinity)
const age = (s: Shop) => Math.max(s.main.seen, s.snack.seen, s.drink.seen)

/* ---------- small reusable components ---------- */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card border border-line rounded-[8px] p-4 ${className}`}>{children}</div>
}
function Btn({ children, onClick, kind = 'secondary' }: { children: React.ReactNode; onClick?: () => void; kind?: 'primary' | 'secondary' | 'danger' }) {
  const s = { primary: 'bg-primary text-white border-primary', secondary: 'bg-white text-ink border-line hover:border-primary hover:text-primary', danger: 'bg-white text-red-600 border-red-300 hover:bg-red-50' }[kind]
  return <button onClick={onClick} className={`px-3 py-1.5 text-sm rounded-[6px] border font-semibold ${s}`}>{children}</button>
}
function Freshness({ days }: { days: number }) {
  const c = days > 14 ? 'bg-gray-100 text-stale' : days > 7 ? 'bg-amber-50 text-ageing' : 'bg-green-50 text-fresh'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c}`}>● Seen {days} day{days === 1 ? '' : 's'} ago</span>
}
function Unverified() {
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-unverified">Unverified · team checking</span>
}
function Chip({ label, on, onClick, tone = 'diet' }: { label: string; on: boolean; onClick: () => void; tone?: 'diet' | 'allergen' }) {
  const active = tone === 'allergen' ? 'bg-red-600 text-white border-red-600' : 'bg-primary text-white border-primary'
  return <button onClick={onClick} className={`text-sm px-2.5 py-1 rounded-full border ${on ? active : 'bg-white border-line'}`}>{on && tone === 'allergen' ? 'No ' : ''}{label}{on ? ' ✕' : ''}</button>
}
function Slider({ label, value, set, min, max, step = 1, fmt }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number; fmt: (n: number) => string }) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm"><span>{label}</span><span className="font-semibold text-primary">{fmt(value)}</span></div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={e => set(+e.target.value)} />
    </label>
  )
}
function Thumb({ label, onClick }: { label: string; onClick?: () => void }) {
  return <button onClick={onClick} title="Tap to enlarge" className="w-14 h-14 shrink-0 rounded-[6px] border border-line bg-[repeating-linear-gradient(45deg,#f1f1ec,#f1f1ec_6px,#e9e9e3_6px,#e9e9e3_12px)] text-[10px] text-muted leading-tight p-1">{label}</button>
}
function Banner({ tone, children }: { tone: 'success' | 'info' | 'warn' | 'error'; children: React.ReactNode }) {
  const c = { success: 'bg-green-50 border-green-200 text-green-800', info: 'bg-blue-50 border-blue-200 text-blue-800', warn: 'bg-amber-50 border-amber-200 text-amber-800', error: 'bg-red-50 border-red-200 text-red-800' }[tone]
  return <div className={`border rounded-[8px] px-4 py-3 text-sm ${c}`}>{children}</div>
}
function Empty({ title, body }: { title: string; body: string }) {
  return <Card className="text-center py-12"><div className="text-2xl mb-2">←</div><div className="font-semibold">{title}</div><div className="text-sm text-muted">{body}</div></Card>
}
function AllergenLine({ items, avoid }: { items: Item[]; avoid: string[] }) {
  const unknown = items.some(i => i.allergens == null)
  const present = [...new Set(items.flatMap(i => i.allergens ?? []))]
  if (unknown) return <div className="text-sm font-semibold text-red-700">⚠ Allergens not checked — label had no allergen text</div>
  return <div className="text-sm text-muted">Contains (from label): {present.length ? present.join(', ') : 'none listed'}{avoid.length ? ` · avoids ${avoid.join(', ')}` : ''}</div>
}

/* ---------- result card ---------- */
function ResultCard({ shop, rank, loyalty, avoid, open, greyed }: { shop: Shop; rank: number; loyalty: boolean; avoid: string[]; open: () => void; greyed?: boolean }) {
  const s = sep(shop)
  const isDeal = shop.deal != null && shop.deal < s
  const price = isDeal ? shop.deal! : s
  const items = [shop.main, shop.snack, shop.drink]
  return (
    <Card className={greyed ? 'opacity-50' : ''}>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Thumb label="Shelf label" />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold">{rank}. {shop.name}</h3>
            <span className="text-sm text-muted">· {shop.walk} min walk</span>
            <Freshness days={age(shop)} />
            {items.some(i => i.pending) && <Unverified />}
          </div>
          <div className="text-sm"><span className="text-muted">Best basket:</span> {shop.main.name} + {shop.snack.name} + {shop.drink.name}</div>
          <AllergenLine items={items} avoid={avoid} />
          <div className="text-sm italic text-muted">Why this shop: {shop.why}</div>
        </div>
        <div className="sm:text-right shrink-0 sm:w-44 border-t sm:border-0 border-line pt-3 sm:pt-0">
          <div className="text-2xl font-bold">{gbp(price)}</div>
          {isDeal && <div className="text-sm text-muted line-through">{gbp(s)} separately</div>}
          {loyalty && shop.loyalty && isDeal && <div className="text-xs text-primary font-semibold">with {shop.loyalty}</div>}
          <div className={`text-sm font-semibold mt-1 ${isDeal ? 'text-fresh' : 'text-muted'}`}>{isDeal ? `Meal deal saves ${gbp(s - price)}` : 'Bought separately — no deal'}</div>
          <div className="mt-2"><Btn onClick={open}>See basket →</Btn></div>
        </div>
      </div>
    </Card>
  )
}

/* ---------- screens ---------- */
type Temp = 'any' | 'hot' | 'cold'
type Sort = 'quality' | 'distance' | 'price'
type Prefs = { price: number; temp: Temp; sort: Sort; diets: string[]; avoid: string[]; loyalty: boolean; walk: number; touched: boolean }

function Find({ prefs, setPrefs, open, demo }: { prefs: Prefs; setPrefs: (p: Prefs) => void; open: (id: string) => void; demo: string }) {
  const { ranked, hidden, blocker } = useMemo(() => {
    const pass = (s: Shop) => {
      const items = [s.main, s.snack, s.drink]
      if (s.walk > prefs.walk) return 'walk'
      if (best(s) > prefs.price) return 'price'
      if (prefs.temp !== 'any' && !!s.main.hot !== (prefs.temp === 'hot')) return 'temp'
      if (prefs.diets.some(d => !items.every(i => i.diet?.includes(d)))) return 'diet'
      if (prefs.avoid.length && items.some(i => i.allergens == null || i.allergens.some(a => prefs.avoid.includes(a)))) return 'allergen'
      return null
    }
    const live = shops.filter(s => age(s) <= 14)
    const ok = live.filter(s => !pass(s))
    const cmp: Record<Sort, (a: Shop, b: Shop) => number> = {
      quality: (a, b) => b.quality - a.quality || best(a) - best(b),
      distance: (a, b) => a.walk - b.walk || best(a) - best(b),
      price: (a, b) => best(a) - best(b) || a.walk - b.walk,
    }
    const reasons = live.map(pass).filter(Boolean) as string[]
    const top = reasons.sort((a, b) => reasons.filter(x => x === b).length - reasons.filter(x => x === a).length)[0]
    return { ranked: ok.sort(cmp[prefs.sort]), hidden: shops.filter(s => age(s) > 14), blocker: top }
  }, [prefs])

  if (demo === 'empty' || !prefs.touched) return <Empty title="Set your preferences on the left" body="Pick a budget and walking limit — results appear instantly." />
  const relax: Record<string, [string, () => void]> = {
    walk: [`Walking limit (${prefs.walk} min) is too short`, () => setPrefs({ ...prefs, walk: 30 })],
    temp: [`No ${prefs.temp} mains match your other filters`, () => setPrefs({ ...prefs, temp: 'any' })],
    price: [`Budget (${gbp(prefs.price)}) is too low`, () => setPrefs({ ...prefs, price: Math.min(14, prefs.price + 1.5) })],
    diet: ['Diet filter removes every shop', () => setPrefs({ ...prefs, diets: [] })],
    allergen: ['Allergen filter removes every shop (unchecked labels are excluded)', () => setPrefs({ ...prefs, avoid: prefs.avoid.slice(0, -1) })],
  }
  if (demo === 'noresults' || ranked.length === 0) {
    const [msg, fix] = relax[blocker ?? 'price']
    return <Card className="space-y-3"><div className="font-bold text-lg">No shops match</div><div className="text-sm">The problem: <b>{msg}</b>.</div><Btn kind="primary" onClick={fix}>Relax this filter</Btn></Card>
  }
  return (
    <div className="space-y-4">
      {demo === 'credited' && <Banner tone="success">🎉 +20 credits — our team approved your Pret soup photo</Banner>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-sm text-muted">{ranked.length} shops within {prefs.walk} min · sponsors never affect ranking</div>
        <label className="flex items-center gap-2 text-sm"><span className="font-semibold">Sort by</span>
          <select className="border border-line rounded-[6px] px-2 py-1.5 bg-white" value={prefs.sort} onChange={e => setPrefs({ ...prefs, sort: e.target.value as Sort })}>
            <option value="quality">Quality</option><option value="distance">Distance</option><option value="price">Price (low to high)</option>
          </select></label>
      </div>
      {ranked.map((s, i) => <ResultCard key={s.id} shop={s} rank={i + 1} loyalty={prefs.loyalty} avoid={prefs.avoid} open={() => open(s.id)} />)}
      {hidden.length > 0 && <>
        <div className="text-sm text-muted pt-2">Not ranked — last seen over 14 days ago</div>
        {hidden.map(s => <ResultCard key={s.id} shop={s} rank={0} loyalty={prefs.loyalty} avoid={prefs.avoid} open={() => open(s.id)} greyed />)}
      </>}
    </div>
  )
}

function ItemFacts({ it, avoid }: { it: Item; avoid: string[] }) {
  return <>
    <div className="flex gap-1 flex-wrap"><Freshness days={it.seen} />{it.pending && <Unverified />}{it.noDeal && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-muted">Not in meal deal</span>}</div>
    <div className="text-sm">{it.allergens == null ? <span className="text-red-700 font-semibold">⚠ Allergens not checked</span> : `Allergens: ${it.allergens.length ? it.allergens.join(', ') : 'none on label'}`}</div>
    {it.allergens?.some(a => avoid.includes(a)) && <div className="text-sm text-red-700 font-semibold">Contains something you avoid</div>}
  </>
}

// Opens the device's own maps app: Apple Maps on iPhone/iPad/Mac, the default maps app on Android, Google Maps elsewhere
function mapsUrl(shop: Shop) {
  const ua = navigator.userAgent
  const q = encodeURIComponent(shop.name)
  if (/iPhone|iPad|iPod|Macintosh/.test(ua)) return `https://maps.apple.com/?daddr=${shop.lat},${shop.lng}&q=${q}&dirflg=w`
  if (/Android/.test(ua)) return `geo:${shop.lat},${shop.lng}?q=${shop.lat},${shop.lng}(${q})`
  return `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}&travelmode=walking`
}

function Detail({ shop, back, avoid }: { shop: Shop; back: () => void; avoid: string[] }) {
  const cats: [Cat, string][] = [['main', 'Main'], ['snack', 'Snack'], ['drink', 'Drink']]
  const options = (c: Cat) => [shop[c], ...catalogue[shop.id][c]]
  const [pick, setPick] = useState<Record<Cat, number>>({ main: 0, snack: 0, drink: 0 })
  const [catTab, setCatTab] = useState<'all' | Cat>('all')
  const [q, setQ] = useState('')
  const chosen = cats.map(([c]) => options(c)[pick[c]])
  const s = chosen.reduce((t, i) => t + i.price, 0)
  const dealOk = shop.deal != null && chosen.every(i => !i.noDeal)
  const isDeal = dealOk && shop.deal! < s
  const changed = Object.values(pick).some(Boolean)
  const all = cats.flatMap(([c, l]) => options(c).map((it, i) => ({ c, l, it, i })))
    .filter(r => (catTab === 'all' || r.c === catTab) && r.it.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="space-y-4">
      <Btn onClick={back}>← Back to results</Btn>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><h2 className="text-2xl font-bold">{shop.name}</h2><div className="text-sm text-muted">{shop.walk} min walk from campus · {shop.why}</div></div>
        <a href={mapsUrl(shop)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 text-sm rounded-[6px] border border-primary bg-primary text-white font-semibold whitespace-nowrap">📍 Open in Maps</a>
      </div>
      <div className="flex items-center justify-between"><div className="font-semibold">Your basket</div>{changed && <Btn onClick={() => setPick({ main: 0, snack: 0, drink: 0 })}>Reset to best basket</Btn>}</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {cats.map(([c, k]) => {
          const it = options(c)[pick[c]]
          return (
            <Card key={c} className="space-y-2">
              <div className="flex justify-between items-center"><div className="text-xs uppercase tracking-wide text-muted font-semibold">{k}</div>{pick[c] === 0 && <span className="text-xs text-primary font-semibold">Best pick</span>}</div>
              <select className="w-full border border-line rounded-[6px] px-2 py-1.5 text-sm bg-white" value={pick[c]} onChange={e => setPick({ ...pick, [c]: +e.target.value })}>
                {options(c).map((o, i) => <option key={o.name} value={i}>{o.name} — {gbp(o.price)}{i === 0 ? ' (best)' : ''}{o.noDeal ? ' · not in deal' : ''}</option>)}
              </select>
              <div className="flex justify-between items-baseline"><div className="font-semibold">{it.name} {it.hot && <span className="text-xs text-ageing">· hot</span>}</div><div className="text-lg font-bold">{gbp(it.price)}</div></div>
              <div className="h-28 rounded-[6px] border border-line bg-[repeating-linear-gradient(45deg,#f1f1ec,#f1f1ec_6px,#e9e9e3_6px,#e9e9e3_12px)] flex items-center justify-center text-xs text-muted">Label photo</div>
              <ItemFacts it={it} avoid={avoid} />
            </Card>
          )
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className={isDeal ? 'border-primary border-2' : ''}><div className="text-sm text-muted">Meal deal price</div><div className="text-2xl font-bold">{shop.deal == null ? 'No deal here' : dealOk ? gbp(shop.deal) : 'Not available'}</div>{isDeal && <div className="text-sm text-fresh font-semibold">Best option — saves {gbp(s - shop.deal!)}</div>}{shop.deal != null && !dealOk && <div className="text-sm text-muted">An item you picked isn't in the meal deal</div>}</Card>
        <Card className={!isDeal ? 'border-primary border-2' : ''}><div className="text-sm text-muted">Bought separately</div><div className="text-2xl font-bold">{gbp(s)}</div>{!isDeal && <div className="text-sm text-fresh font-semibold">Best option</div>}</Card>
      </div>

      <div className="pt-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div><div className="text-lg font-bold">Everything we've seen here</div><div className="text-xs text-muted">{cats.reduce((t, [c]) => t + options(c).length, 0)} items catalogued from student photos</div></div>
          <input className="border border-line rounded-[6px] px-3 py-1.5 text-sm bg-white sm:w-56" placeholder="Search items" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="flex gap-5 border-b border-line text-sm">
          {(['all', 'main', 'snack', 'drink'] as const).map(t => <button key={t} onClick={() => setCatTab(t)} className={`pb-2 capitalize font-semibold border-b-2 ${catTab === t ? 'border-primary text-primary' : 'border-transparent text-muted'}`}>{t === 'all' ? 'All' : t + 's'}</button>)}
        </div>
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-left text-xs text-muted uppercase"><tr className="border-b border-line"><th className="p-3">Item</th><th>Type</th><th>Price</th><th>Allergens (from label)</th><th>Seen</th><th></th></tr></thead>
            <tbody>
              {all.map(({ c, l, it, i }) => {
                const inBasket = pick[c] === i
                return (
                  <tr key={c + it.name} className={`border-b border-line last:border-0 ${it.seen > 14 ? 'opacity-50' : ''}`}>
                    <td className="p-3"><div className="flex items-center gap-2"><Thumb label="Label" /><div><div className="font-semibold">{it.name}</div><div className="flex gap-1 mt-0.5">{it.hot && <span className="text-xs text-ageing">hot</span>}{it.noDeal && <span className="text-xs text-muted">not in deal</span>}{it.pending && <Unverified />}</div></div></div></td>
                    <td>{l}</td>
                    <td className="font-semibold">{gbp(it.price)}</td>
                    <td>{it.allergens == null ? <span className="text-red-700 font-semibold">Not checked</span> : it.allergens.length ? it.allergens.join(', ') : 'None listed'}{it.allergens?.some(a => avoid.includes(a)) && <span className="text-red-700 font-semibold"> · avoid</span>}</td>
                    <td><Freshness days={it.seen} /></td>
                    <td className="pr-3 text-right">{inBasket ? <span className="text-xs text-primary font-semibold">In basket</span> : <Btn onClick={() => setPick({ ...pick, [c]: i })}>Swap in</Btn>}</td>
                  </tr>
                )
              })}
              {all.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">No items match "{q}"</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

type Outcome = 'accepted' | 'manual' | 'rejected'
const CONF_THRESHOLD = 85

function ConfidenceBar({ label, value, threshold }: { label: string; value: number; threshold?: number }) {
  const c = threshold == null ? 'bg-primary' : value >= threshold ? 'bg-fresh' : 'bg-ageing'
  return (
    <div className="text-xs space-y-1">
      <div className="flex justify-between"><span className="text-muted">{label}</span><span className="font-semibold">{value}%</span></div>
      <div className="relative h-1.5 bg-gray-100 rounded-full"><div className={`h-full rounded-full ${c}`} style={{ width: `${value}%` }} />{threshold != null && <div className="absolute -top-0.5 h-2.5 w-px bg-ink" style={{ left: `${threshold}%` }} />}</div>
    </div>
  )
}

type Read = { name: string; price: string; deal: string; allergens: string; unsure?: boolean }
const SHELF: Read[] = [
  { name: 'Chicken wrap', price: '£2.75', deal: 'Meal deal £3.85 (Clubcard)', allergens: 'gluten, milk' },
  { name: 'Ham & cheese sandwich', price: '£2.50', deal: 'Meal deal £3.85 (Clubcard)', allergens: 'gluten, milk' },
  { name: 'Veg sushi box', price: '£3.25', deal: 'Meal deal £3.85 (Clubcard)', allergens: 'soy, sesame' },
  { name: 'Chicken & bacon pasta', price: '£3.00', deal: 'Meal deal £3.85 (Clubcard)', allergens: 'gluten, egg' },
  { name: 'BLT sandwich', price: '£2.95', deal: 'Not sure', allergens: 'Not on label', unsure: true },
  { name: 'Steak bake', price: '£1.90', deal: 'Not in deal', allergens: 'gluten, milk' },
]
const TASKS = [
  { shop: 'Tesco Express', item: 'BLT sandwich', need: 'Allergen info — not listed online', credits: 30, ask: 'Photo the back of the pack' },
  { shop: 'Pret A Manger', item: 'Tomato soup', need: 'Allergen info — label had none', credits: 30, ask: 'Photo the ingredients on the lid' },
  { shop: "Sainsbury's Local", item: 'Oat latte (can)', need: 'Price and allergens', credits: 20, ask: 'Photo the shelf label and can' },
]

function Upload({ demo }: { demo: string }) {
  const [stage, setStage] = useState<'idle' | 'loading' | Outcome>('idle')
  const [task, setTask] = useState<number | null>(null)
  const [doneTasks, setDoneTasks] = useState<number[]>([])
  const st = (['loading', 'accepted', 'manual', 'rejected'].includes(demo) ? demo : stage) as typeof stage
  const run = (o: Outcome) => { setStage('loading'); setTimeout(() => { setStage(o); if (task != null && o !== 'rejected') { setDoneTasks(d => [...d, task]) } }, 1500) }
  const t = task != null ? TASKS[task] : null
  const items: Read[] = t ? [{ name: t.item, price: '£2.95', deal: 'Meal deal £3.85', allergens: 'gluten, milk, mustard', unsure: st === 'manual' }] : SHELF.map(r => ({ ...r, unsure: st === 'manual' && r.unsure }))
  const credits = t ? t.credits : 5 * items.length
  return (
    <div className="space-y-4">
      <div><h2 className="text-2xl font-bold">Add a photo</h2><div className="text-sm text-muted">Snap the whole shelf. We'll pick out every item, price and meal deal we can see.</div></div>
      <Banner tone="info">If your photo is clear, you get credits straight away. If not, our team may take up to 24 hours to review it.</Banner>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-dashed border-2 text-center py-10 space-y-3">
          <div className="text-3xl">📷</div>
          {t ? <><div className="font-semibold">Task: {t.item} at {t.shop}</div><div className="text-sm text-muted">{t.ask}</div></>
            : <><div className="font-semibold">Photo the whole shelf</div><div className="text-xs text-muted">Get labels, prices and deal signs in frame · JPG or PNG, up to 10 MB</div></>}
          <div className="flex gap-2 justify-center"><Btn kind="primary" onClick={() => run('accepted')}>{t ? 'Upload product photo' : 'Upload shelf photo'}</Btn>{t && <Btn onClick={() => { setTask(null); setStage('idle') }}>Cancel task</Btn>}</div>
          <div className="text-xs text-muted pt-2">Prototype outcomes</div>
          <div className="flex gap-2 justify-center flex-wrap"><Btn onClick={() => run('accepted')}>Clear</Btn><Btn onClick={() => run('manual')}>Needs a check</Btn><Btn onClick={() => run('rejected')}>Blurry</Btn></div>
        </Card>
        <Card className="space-y-3">
          <div className="font-semibold">What we found</div>
          {st === 'idle' && <div className="text-sm text-muted">Upload a photo to see the items we pick out.</div>}
          {st === 'loading' && <div className="flex items-center gap-3 text-sm"><span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />Reading your photo… you can keep browsing.</div>}
          {st === 'rejected' && <Banner tone="error"><b>We couldn't read this photo — it's too blurry.</b> Hold the phone steady, step back so the labels are sharp, then retake.<div className="mt-2"><Btn onClick={() => setStage('idle')}>Retake photo</Btn></div></Banner>}
          {(st === 'accepted' || st === 'manual') && <>
            <div className="text-xs text-muted">{items.length} item{items.length > 1 ? 's' : ''} found{t ? '' : ' · Tesco Express, Euston Rd · today'}</div>
            <div className="overflow-x-auto"><table className="text-sm w-full min-w-[420px]">
              <thead className="text-left text-xs text-muted"><tr className="border-b border-line"><th className="py-1">Item</th><th>Price</th><th>Deal</th><th>Allergens</th></tr></thead>
              <tbody>{items.map(r => <tr key={r.name} className="border-b border-line last:border-0"><td className="py-1.5">{r.name}{r.unsure && <span className="ml-1 text-xs font-semibold text-ageing">needs a check</span>}</td><td>{r.price}</td><td className="text-muted">{r.deal}</td><td className={r.allergens === 'Not on label' ? 'text-red-700 font-semibold' : ''}>{r.allergens}</td></tr>)}</tbody>
            </table></div>
            {st === 'accepted'
              ? <Banner tone="success"><b>Published.</b> +{credits} credits added to your balance. It's live in results now.</Banner>
              : <Banner tone="info"><b>Sent to our team to check.</b> Some details weren't clear enough. These items show as "Unverified" in results for now. 0 credits until approved — usually within 24 hours.</Banner>}
          </>}
        </Card>
      </div>
      <div className="space-y-2">
        <div><div className="text-lg font-bold">Tasks</div><div className="text-sm text-muted">We need a closer photo of these products. Bonus credits for each.</div></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {TASKS.map((k, i) => (
            <Card key={k.item} className={`space-y-1.5 ${task === i ? 'border-primary border-2' : ''}`}>
              <div className="flex justify-between items-start"><div className="font-semibold">{k.item}</div><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-fresh">+{k.credits}</span></div>
              <div className="text-xs text-muted">{k.shop}</div>
              <div className="text-sm">Needed: {k.need}</div>
              <div className="text-xs text-muted">{k.ask}</div>
              <div className="pt-1">{doneTasks.includes(i) ? <span className="text-sm text-fresh font-semibold">Done ✓</span> : task === i ? <span className="text-sm text-primary font-semibold">Upload above ↑</span> : <Btn onClick={() => { setTask(i); setStage('idle') }}>Take photo</Btn>}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function Credits() {
  const hist: [string, string, string, string][] = [
    ['Pret A Manger', 'Pending', 'Task (Tomato soup)', '0'],
    ['Tesco Express', 'Approved', '6 items', '+30'],
    ['Boots', 'Not accepted', '4 items', '0'],
    ["Sainsbury's Local", 'Approved (manual)', '5 items', '+25'],
    ['Tesco Express', 'Approved', 'Task (BLT sandwich)', '+30'],
  ]
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My credits</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card><div className="text-sm text-muted">Paid balance</div><div className="text-3xl font-bold text-primary">140</div><div className="text-xs text-muted">Ready to spend · from published photos</div></Card>
        <Card className="bg-blue-50/40"><div className="text-sm text-muted">Awaiting team review</div><div className="text-3xl font-bold text-unverified">1 photo</div><div className="text-xs text-muted">Our team is checking (up to 24 hours). 0 credits until approved.</div></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card><div className="font-semibold mb-2">History</div><table className="text-sm w-full"><tbody>
          {hist.map(r => <tr key={r[0] + r[2]} className="border-b border-line"><td className="py-1.5">{r[0]}</td><td><div className={r[1] === 'Not accepted' ? 'text-ageing' : r[1] === 'Pending' ? 'text-unverified' : 'text-fresh'}>{r[1]}</div><div className="text-xs text-muted">{r[2]}</div></td><td className="text-right font-semibold">{r[3]}</td></tr>)}
        </tbody></table></Card>
        <Card><div className="font-semibold mb-2">Rewards from sponsors</div>
          {[['Free coffee', 'Sponsored by Campus Café', 100], ['£2 off a meal deal', 'Sponsored by Students’ Union', 150], ['Cinema ticket', 'Sponsored by Odeon', 400]].map(([n, sp, c]) => (
            <div key={n as string} className="flex items-center justify-between py-2 border-b border-line last:border-0"><div><div className="text-sm font-semibold">{n}</div><div className="text-xs text-muted">{sp}</div></div><Btn kind={140 >= (c as number) ? 'primary' : 'secondary'}>{c} credits</Btn></div>
          ))}</Card>
      </div>
    </div>
  )
}

function Review() {
  const [done, setDone] = useState<Record<number, string>>({})
  const queue = [
    { shop: 'Pret A Manger', rec: 'Tomato soup £3.95', allergens: 'not on label', conf: 58, why: 'Item name partly covered by a sticker', user: 480 },
    { shop: 'Tesco Express', rec: 'Meal deal £3.85 (Clubcard)', allergens: 'gluten, milk', conf: 71, why: 'Unsure if price is deal or single item', user: 481 },
  ]
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Review queue <span className="text-sm font-normal text-muted">(team only)</span></h2>
        <div className="text-sm text-muted">Only clear photos where the vision model's confidence was below {CONF_THRESHOLD}%. Blurry and confident photos are handled automatically.</div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        {[['Auto-published today', '42', 'text-fresh'], ['Auto-rejected today', '9', 'text-red-700'], ['Waiting for you', String(queue.length - Object.keys(done).length), 'text-unverified']].map(([l, v, c]) => <Card key={l} className="py-3"><div className={`text-2xl font-bold ${c}`}>{v}</div><div className="text-xs text-muted">{l}</div></Card>)}
      </div>
      {queue.map((q, i) => (
        <Card key={i}><div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="h-40 rounded-[6px] border border-line bg-[repeating-linear-gradient(45deg,#f1f1ec,#f1f1ec_6px,#e9e9e3_6px,#e9e9e3_12px)] flex items-center justify-center text-xs text-muted">Uploaded photo</div>
          <div className="space-y-2 text-sm">
            <div><b>{q.shop}</b> · {q.rec}</div>
            <div className="text-muted">Allergens: {q.allergens} · uploaded by student #{q.user}</div>
            <ConfidenceBar label="Model confidence" value={q.conf} threshold={CONF_THRESHOLD} />
            <div className="text-xs text-ageing font-semibold">Why it was flagged: {q.why}</div>
            {done[i] ? <div className="font-semibold">{done[i]}</div> : <div className="flex gap-2"><Btn kind="primary" onClick={() => setDone({ ...done, [i]: 'Approved — published, 20 credits paid' })}>Approve</Btn><Btn kind="danger" onClick={() => setDone({ ...done, [i]: 'Rejected — no credits' })}>Reject</Btn></div>}
          </div>
        </div></Card>
      ))}
    </div>
  )
}

/* ---------- shell ---------- */
export default function App() {
  const [screen, setScreen] = useState<Screen>('find')
  const [shopId, setShopId] = useState('tesco')
  const [demo, setDemo] = useState('live')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [prefs, setPrefsRaw] = useState<Prefs>({ price: 5, temp: 'any', sort: 'quality', diets: [], avoid: [], loyalty: true, walk: 10, touched: false })
  const setPrefs = (p: Prefs) => setPrefsRaw({ ...p, touched: true })
  const toggle = (k: 'diets' | 'avoid', v: string) => setPrefs({ ...prefs, [k]: prefs[k].includes(v) ? prefs[k].filter(x => x !== v) : [...prefs[k], v] })
  const tabs: [Screen, string][] = [['find', 'Find'], ['upload', 'Add a photo'], ['credits', 'My credits'], ['review', 'Review queue']]
  const states: Record<Screen, string[]> = { find: ['live', 'empty', 'noresults', 'credited'], detail: ['live'], upload: ['live', 'loading', 'accepted', 'manual', 'rejected'], credits: ['live'], review: ['live'] }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-[300px] shrink-0 bg-white border-b md:border-b-0 md:border-r border-line p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between"><div><div className="text-xl font-bold">🥪 Meal Deal Finder</div></div>
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="md:hidden px-3 py-1.5 text-sm rounded-[6px] border border-line font-semibold">{filtersOpen ? 'Hide filters' : `Filters${prefs.avoid.length + prefs.diets.length ? ` (${prefs.avoid.length + prefs.diets.length})` : ''}`}</button></div>
        <div className={`${filtersOpen ? 'block' : 'hidden'} md:block space-y-6`}>
        <div className="space-y-2">
          <div className="text-sm font-bold text-red-700">Allergies — avoid</div>
          <div className="flex flex-wrap gap-1.5">{ALLERGENS.map(a => <Chip key={a} tone="allergen" label={a} on={prefs.avoid.includes(a)} onClick={() => toggle('avoid', a)} />)}</div>
          {prefs.avoid.length > 0 && <div className="text-xs text-muted">Items with unchecked labels are hidden.</div>}
        </div>
        <div className="space-y-2"><div className="text-sm font-bold">Diet</div><div className="flex flex-wrap gap-1.5">{DIETS.map(d => <Chip key={d} label={d} on={prefs.diets.includes(d)} onClick={() => toggle('diets', d)} />)}</div></div>
        <div className="space-y-4">
          <Slider label="Max price" value={prefs.price} min={2} max={14} step={0.25} set={v => setPrefs({ ...prefs, price: v })} fmt={gbp} />
          <Slider label="Walking limit" value={prefs.walk} min={2} max={30} set={v => setPrefs({ ...prefs, walk: v })} fmt={v => `${v} min`} />
          <div className="space-y-1.5"><div className="text-sm">Hot or cold main</div>
            <div className="grid grid-cols-3 border border-line rounded-[6px] overflow-hidden text-sm">
              {(['any', 'hot', 'cold'] as Temp[]).map(t => <button key={t} onClick={() => setPrefs({ ...prefs, temp: t })} className={`py-1.5 capitalize ${prefs.temp === t ? 'bg-primary text-white font-semibold' : 'bg-white'}`}>{t}</button>)}
            </div></div>
        </div>
        <label className="flex items-center justify-between text-sm"><span>I have loyalty cards<br /><span className="text-xs text-muted">Clubcard, Nectar</span></span>
          <button onClick={() => setPrefs({ ...prefs, loyalty: !prefs.loyalty })} className={`w-10 h-6 rounded-full p-0.5 ${prefs.loyalty ? 'bg-primary' : 'bg-gray-300'}`}><span className={`block w-5 h-5 bg-white rounded-full ${prefs.loyalty ? 'translate-x-4' : ''}`} /></button>
        </label>
        <div className="pt-4 border-t border-line text-xs text-muted space-y-1">
          <div className="font-semibold">Prototype: preview state</div>
          <select className="w-full border border-line rounded-[6px] p-1.5" value={demo} onChange={e => setDemo(e.target.value)}>
            {states[screen].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-6 space-y-6">
        <nav className="flex gap-5 md:gap-6 border-b border-line overflow-x-auto whitespace-nowrap">
          {tabs.map(([k, l]) => <button key={k} onClick={() => { setScreen(k); setDemo('live') }} className={`pb-2 text-sm font-semibold border-b-2 ${screen === k || (k === 'find' && screen === 'detail') ? 'border-primary text-primary' : 'border-transparent text-muted'}`}>{l}</button>)}
        </nav>
        {screen === 'find' && <Find prefs={prefs} setPrefs={setPrefs} demo={demo} open={id => { setShopId(id); setScreen('detail') }} />}
        {screen === 'detail' && <Detail key={shopId} shop={shops.find(s => s.id === shopId)!} avoid={prefs.avoid} back={() => setScreen('find')} />}
        {screen === 'upload' && <Upload demo={demo} />}
        {screen === 'credits' && <Credits />}
        {screen === 'review' && <Review />}
      </main>
    </div>
  )
}
