"""
Built-in template provider — works with ZERO API keys.
Matches the user prompt to a pre-built, polished React component.
Used as the final fallback in the provider chain.
"""
import asyncio
from typing import AsyncIterator

from .base import BaseProvider

# ── Template library ──────────────────────────────────────────────────────────

_DASHBOARD = (
    ["dashboard", "analytics", "metrics", "saas", "revenue", "admin", "crm", "business", "finance", "sales"],
    "A SaaS analytics dashboard with revenue charts, user metrics, activity feed, and quick actions.",
    ["App", "StatCard", "BarChart", "ActivityItem"],
    '''
function StatCard({ title, value, delta, positive, icon }) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 hover:border-violet-500/30 transition-all duration-200 group cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
      <p className={`text-xs mt-1.5 font-medium ${positive ? "text-green-400" : "text-red-400"}`}>{delta}</p>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-indigo-500 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ height: `${(d.v / max) * 100}%` }}
            title={`${d.label}: ${d.v}`}
          />
          <span className="text-gray-600 text-[10px]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityItem({ user, action, time, type }) {
  const dot = { success: "bg-green-400", warning: "bg-amber-400", info: "bg-blue-400", error: "bg-red-400" };
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-700/40 last:border-0">
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot[type]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300"><span className="font-semibold text-white">{user}</span> {action}</p>
        <p className="text-xs text-gray-600 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("overview");
  const [notifs, setNotifs] = useState(4);

  const stats = [
    { title: "Total Revenue", value: "$84,295", delta: "+14.2% this month", positive: true,  icon: "💰" },
    { title: "Active Users",  value: "12,483",  delta: "+9.1% this week",  positive: true,  icon: "👥" },
    { title: "Conversion",    value: "5.38%",   delta: "+0.6% vs last mo", positive: true,  icon: "📈" },
    { title: "Churn Rate",    value: "1.7%",    delta: "-0.3% improvement", positive: true, icon: "🔄" },
  ];

  const chartData = [
    { label: "M", v: 42 }, { label: "T", v: 68 }, { label: "W", v: 55 },
    { label: "T", v: 85 }, { label: "F", v: 63 }, { label: "S", v: 91 }, { label: "S", v: 74 },
  ];

  const activity = [
    { user: "Alice M.",   action: "completed onboarding",     time: "2m ago",  type: "success" },
    { user: "Bob K.",     action: "upgraded to Pro plan",     time: "18m ago", type: "success" },
    { user: "Charlie D.", action: "reported billing issue",   time: "1h ago",  type: "warning" },
    { user: "Diana L.",   action: "created new workspace",    time: "2h ago",  type: "info"    },
    { user: "Evan S.",    action: "exported 1,240 records",   time: "3h ago",  type: "info"    },
  ];

  const tabs = ["overview", "analytics", "users", "settings"];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <nav className="bg-gray-800/80 backdrop-blur border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-sm">A</div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">AppDash</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setNotifs(0)} className="relative p-2 rounded-lg hover:bg-gray-700 transition-colors">
            <span className="text-lg">🔔</span>
            {notifs > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">{notifs}</span>}
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center font-bold text-sm">J</div>
        </div>
      </nav>

      <div className="bg-gray-800/40 border-b border-gray-700 px-6 flex gap-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-3 px-4 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? "border-violet-500 text-violet-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            {t}
          </button>
        ))}
      </div>

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(s => <StatCard key={s.title} {...s} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-800 rounded-xl p-5 border border-gray-700/50">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-white">Revenue Overview</h2>
                <span className="text-xs text-gray-400 bg-gray-700/60 px-2.5 py-1 rounded-full">Last 7 days</span>
              </div>
              <BarChart data={chartData} />
            </div>
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
              <h2 className="font-semibold text-white mb-1">Activity</h2>
              <p className="text-xs text-gray-500 mb-3">Live updates</p>
              {activity.map((a, i) => <ActivityItem key={i} {...a} />)}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
            <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "New Report",  icon: "📊", cls: "from-violet-600/20 border-violet-500/30 hover:from-violet-600/40" },
                { label: "Add User",    icon: "👤", cls: "from-blue-600/20 border-blue-500/30 hover:from-blue-600/40"       },
                { label: "Export Data", icon: "📤", cls: "from-green-600/20 border-green-500/30 hover:from-green-600/40"   },
                { label: "Settings",    icon: "⚙️", cls: "from-gray-600/20 border-gray-500/30 hover:from-gray-600/40"      },
              ].map(({ label, icon, cls }) => (
                <button key={label} className={`bg-gradient-to-b ${cls} border rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-[1.03]`}>
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm font-medium text-gray-300">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
'''.strip(),
)

# ─────────────────────────────────────────────────────────────────────────────

_FITNESS = (
    ["fitness", "workout", "health", "exercise", "gym", "calories", "steps", "running", "training", "sport"],
    "A fitness tracker with workout logs, daily ring progress, weekly stats, and a session history.",
    ["App", "Ring", "WorkoutCard", "WeekBar"],
    '''
function Ring({ value, max, color, label }) {
  const r = 30, circ = 2 * Math.PI * r;
  const fill = Math.min(value / max, 1) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" className="-rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-white leading-none">{value}</span>
          <span className="text-[9px] text-gray-500 mt-0.5">{label.split(" ")[0]}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function WorkoutCard({ name, sets, reps, weight, done, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${done ? "bg-green-500/10 border-green-500/30" : "bg-gray-800 border-gray-700/50 hover:border-gray-600"}`}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${done ? "bg-green-500 border-green-500" : "border-gray-600"}`}>
        {done && <span className="text-[10px] text-white font-bold">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${done ? "text-green-400 line-through" : "text-white"}`}>{name}</p>
        <p className="text-xs text-gray-500">{sets} sets × {reps} reps · {weight}</p>
      </div>
      <span className="text-[10px] text-gray-600 bg-gray-700/50 px-2 py-0.5 rounded-full">{sets * reps} reps</span>
    </div>
  );
}

function WeekBar({ day, pct, active }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-7 bg-gray-700 rounded-full overflow-hidden" style={{ height: 64 }}>
        <div
          className={`w-full rounded-full transition-all duration-500 ${active ? "bg-gradient-to-t from-violet-600 to-violet-400" : "bg-green-500"}`}
          style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
        />
      </div>
      <span className={`text-[11px] font-medium ${active ? "text-violet-400" : "text-gray-500"}`}>{day}</span>
    </div>
  );
}

function App() {
  const [workouts, setWorkouts] = useState([
    { id: 1, name: "Bench Press",    sets: 4, reps: 10, weight: "80 kg",  done: false },
    { id: 2, name: "Pull-Ups",       sets: 3, reps: 12, weight: "BW",     done: true  },
    { id: 3, name: "Squat",          sets: 4, reps: 8,  weight: "100 kg", done: false },
    { id: 4, name: "Overhead Press", sets: 3, reps: 10, weight: "50 kg",  done: true  },
    { id: 5, name: "Deadlift",       sets: 3, reps: 6,  weight: "120 kg", done: false },
  ]);

  const toggle = (id) => setWorkouts(ws => ws.map(w => w.id === id ? { ...w, done: !w.done } : w));
  const doneCount = workouts.filter(w => w.done).length;

  const week = [
    { day: "M", pct: 80 }, { day: "T", pct: 60 }, { day: "W", pct: 90 },
    { day: "T", pct: 45 }, { day: "F", pct: 70 }, { day: "S", pct: 0, active: true }, { day: "S", pct: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800/80 backdrop-blur border-b border-gray-700 px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">FitTrack</h1>
          <p className="text-xs text-gray-500">Saturday, Mar 29 · Push Day</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">🔥 7 day streak</span>
        </div>
      </nav>

      <div className="p-5 space-y-5 max-w-lg mx-auto">
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Today\'s Goals</h2>
          <div className="flex justify-around">
            <Ring value={312}  max={500}  color="#8b5cf6" label="Calories" />
            <Ring value={7842} max={10000} color="#10b981" label="Steps"   />
            <Ring value={28}   max={60}   color="#f59e0b" label="Minutes"  />
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400">Weekly Activity</h2>
            <span className="text-xs text-green-400 font-medium">+18% vs last week</span>
          </div>
          <div className="flex justify-around items-end">
            {week.map((d, i) => <WeekBar key={i} {...d} active={d.active || false} />)}
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400">Workout Plan</h2>
            <span className="text-xs text-gray-500">{doneCount}/{workouts.length} done</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mb-4">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / workouts.length) * 100}%` }} />
          </div>
          <div className="space-y-2">
            {workouts.map(w => <WorkoutCard key={w.id} {...w} onToggle={() => toggle(w.id)} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
'''.strip(),
)

# ─────────────────────────────────────────────────────────────────────────────

_ECOMMERCE = (
    ["shop", "store", "product", "cart", "buy", "ecommerce", "marketplace", "price", "order", "checkout"],
    "An e-commerce product listing with filters, product cards, cart management, and checkout summary.",
    ["App", "ProductCard", "CartItem"],
    '''
function ProductCard({ product, onAdd }) {
  const [added, setAdded] = useState(false);
  const handle = () => { setAdded(true); onAdd(product); setTimeout(() => setAdded(false), 1500); };
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-900/20 transition-all duration-200 group">
      <div className="bg-gradient-to-br from-gray-700 to-gray-750 h-40 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-300">
        {product.emoji}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-white leading-snug">{product.name}</h3>
          <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">{product.badge}</span>
        </div>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.desc}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-white">${product.price}</span>
            {product.original && <span className="text-xs text-gray-600 line-through ml-1.5">${product.original}</span>}
          </div>
          <button onClick={handle}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${added ? "bg-green-500 text-white scale-95" : "bg-violet-600 hover:bg-violet-500 text-white"}`}>
            {added ? "✓ Added" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartItem({ item, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-700/40 last:border-0">
      <span className="text-2xl">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.name}</p>
        <p className="text-xs text-gray-500">Qty: {item.qty}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">${(item.price * item.qty).toFixed(2)}</span>
        <button onClick={() => onRemove(item.id)} className="text-gray-600 hover:text-red-400 transition-colors text-xs">✕</button>
      </div>
    </div>
  );
}

function App() {
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showCart, setShowCart] = useState(false);

  const products = [
    { id: 1, name: "Noise-Cancelling Headphones", emoji: "🎧", price: 149, original: 199, badge: "Best Seller", desc: "Premium sound with 30hr battery and active noise cancellation.", category: "Electronics" },
    { id: 2, name: "Mechanical Keyboard",          emoji: "⌨️", price:  89, original: 120, badge: "Popular",     desc: "Tactile switches, RGB backlight, compact 75% layout.", category: "Electronics" },
    { id: 3, name: "Running Shoes",                emoji: "👟", price:  79, original: null, badge: "New",         desc: "Lightweight mesh upper with responsive foam midsole.", category: "Apparel"     },
    { id: 4, name: "Standing Desk Lamp",           emoji: "💡", price:  45, original: 60,   badge: "Sale",        desc: "Color temperature control with wireless charging base.", category: "Home"       },
    { id: 5, name: "Leather Backpack",             emoji: "🎒", price: 115, original: null, badge: "Popular",     desc: "Full-grain leather with padded laptop sleeve 15\".", category: "Apparel"     },
    { id: 6, name: "Smart Water Bottle",           emoji: "🍶", price:  38, original: 50,   badge: "Sale",        desc: "Hydration tracking with LED reminders and 24hr insulation.", category: "Home" },
  ];

  const categories = ["All", "Electronics", "Apparel", "Home"];
  const filtered = filter === "All" ? products : products.filter(p => p.category === filter);

  const addToCart = p => setCart(c => {
    const ex = c.find(i => i.id === p.id);
    return ex ? c.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...p, qty: 1 }];
  });
  const removeFromCart = id => setCart(c => c.filter(i => i.id !== id));
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800/80 backdrop-blur border-b border-gray-700 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">ShopAI</h1>
        <button onClick={() => setShowCart(s => !s)} className="relative flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors">
          🛒 Cart
          {itemCount > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">{itemCount}</span>}
        </button>
      </nav>

      <div className="flex gap-6 p-6 max-w-6xl mx-auto">
        <main className="flex-1 min-w-0">
          <div className="flex gap-2 mb-5 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === c ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
          </div>
        </main>

        {showCart && (
          <aside className="w-72 flex-shrink-0">
            <div className="bg-gray-800 rounded-2xl border border-gray-700/50 p-5 sticky top-20">
              <h2 className="font-semibold text-white mb-4">Cart ({itemCount})</h2>
              {cart.length === 0
                ? <p className="text-sm text-gray-500 text-center py-4">Your cart is empty</p>
                : <>
                    {cart.map(i => <CartItem key={i.id} item={i} onRemove={removeFromCart} />)}
                    <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="font-semibold">${total.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Shipping</span><span className="text-green-400">Free</span></div>
                      <div className="flex justify-between font-bold border-t border-gray-700/50 pt-3"><span>Total</span><span>${total.toFixed(2)}</span></div>
                      <button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-2.5 rounded-xl text-sm font-semibold transition-all">
                        Checkout →
                      </button>
                    </div>
                  </>
              }
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
'''.strip(),
)

# ─────────────────────────────────────────────────────────────────────────────

_KANBAN = (
    ["kanban", "todo", "task", "board", "project", "manage", "sprint", "agile", "trello", "workflow"],
    "A Kanban project board with Todo / In Progress / Done columns, priority badges, and task management.",
    ["App", "TaskCard", "Column"],
    '''
function PriorityBadge({ level }) {
  const styles = { high: "bg-red-500/20 text-red-400 border-red-500/30", medium: "bg-amber-500/20 text-amber-400 border-amber-500/30", low: "bg-green-500/20 text-green-400 border-green-500/30" };
  return <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${styles[level]}`}>{level}</span>;
}

function TaskCard({ task, onMove, columns }) {
  const [menu, setMenu] = useState(false);
  const others = columns.filter(c => c !== task.column);
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-all group cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-white leading-snug flex-1">{task.title}</p>
        <div className="relative">
          <button onClick={() => setMenu(m => !m)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 transition-all p-0.5">⋮</button>
          {menu && (
            <div className="absolute right-0 top-5 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-20 w-36 overflow-hidden">
              {others.map(col => (
                <button key={col} onClick={() => { onMove(task.id, col); setMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-600 transition-colors">
                  Move to {col}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {task.desc && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{task.desc}</p>}
      <div className="flex items-center justify-between">
        <PriorityBadge level={task.priority} />
        <div className="flex items-center gap-1.5 text-gray-600">
          <span className="text-xs">{task.assignee}</span>
          {task.comments > 0 && <span className="text-xs">💬 {task.comments}</span>}
        </div>
      </div>
    </div>
  );
}

function Column({ title, tasks, color, onMove, columns, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const submit = () => { if (newTitle.trim()) { onAdd(title, newTitle.trim()); setNewTitle(""); setAdding(false); } };
  const headerColors = { "Todo": "text-gray-400 bg-gray-700/40", "In Progress": "text-amber-400 bg-amber-500/10", "Done": "text-green-400 bg-green-500/10" };
  return (
    <div className="flex-1 min-w-0 bg-gray-800/40 rounded-2xl p-4 border border-gray-700/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-semibold px-2.5 py-1 rounded-lg ${headerColors[title]}`}>{title}</h2>
          <span className="text-xs text-gray-600 bg-gray-700/50 w-5 h-5 rounded-full flex items-center justify-center">{tasks.length}</span>
        </div>
        <button onClick={() => setAdding(a => !a)} className="text-gray-600 hover:text-violet-400 transition-colors text-lg leading-none">+</button>
      </div>
      {adding && (
        <div className="mb-3">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Task title…" autoFocus
            className="w-full bg-gray-700 border border-violet-500/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none mb-2" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">Add</button>
            <button onClick={() => setAdding(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-400 text-xs font-semibold py-1.5 rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2.5">
        {tasks.map(t => <TaskCard key={t.id} task={t} onMove={onMove} columns={columns} />)}
      </div>
    </div>
  );
}

function App() {
  const columns = ["Todo", "In Progress", "Done"];
  const [tasks, setTasks] = useState([
    { id: 1, title: "Design new landing page",    desc: "Figma wireframes + component library",     column: "Todo",        priority: "high",   assignee: "👤 Alice", comments: 3 },
    { id: 2, title: "Set up CI/CD pipeline",       desc: "GitHub Actions with staging + production", column: "Todo",        priority: "medium", assignee: "👤 Bob",   comments: 1 },
    { id: 3, title: "Build auth system",           desc: "JWT tokens with refresh rotation",         column: "In Progress", priority: "high",   assignee: "👤 Eve",   comments: 5 },
    { id: 4, title: "Write API documentation",     desc: "OpenAPI spec for all endpoints",           column: "In Progress", priority: "low",    assignee: "👤 Dan",   comments: 0 },
    { id: 5, title: "Fix payment webhook bug",     desc: null,                                       column: "In Progress", priority: "high",   assignee: "👤 Alice", comments: 2 },
    { id: 6, title: "Database migrations",         desc: "Schema v4 with new indexes",               column: "Done",        priority: "medium", assignee: "👤 Bob",   comments: 4 },
    { id: 7, title: "Mobile responsive nav",       desc: null,                                       column: "Done",        priority: "low",    assignee: "👤 Eve",   comments: 1 },
  ]);

  const moveTask = (id, col) => setTasks(ts => ts.map(t => t.id === id ? { ...t, column: col } : t));
  const addTask  = (col, title) => setTasks(ts => [...ts, { id: Date.now(), title, desc: null, column: col, priority: "medium", assignee: "👤 You", comments: 0 }]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <nav className="bg-gray-800/80 backdrop-blur border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">ProjectBoard</h1>
          <p className="text-xs text-gray-500">Q2 Sprint · {tasks.length} tasks</p>
        </div>
        <div className="flex gap-2">
          {[{ col: "Todo", color: "text-gray-400" }, { col: "In Progress", color: "text-amber-400" }, { col: "Done", color: "text-green-400" }].map(({ col, color }) => (
            <span key={col} className={`text-xs font-medium ${color} bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-full`}>
              {tasks.filter(t => t.column === col).length} {col}
            </span>
          ))}
        </div>
      </nav>
      <main className="flex-1 p-5 flex gap-4 overflow-x-auto">
        {columns.map(col => (
          <Column key={col} title={col} tasks={tasks.filter(t => t.column === col)}
            columns={columns} onMove={moveTask} onAdd={addTask} />
        ))}
      </main>
    </div>
  );
}
'''.strip(),
)

# ─────────────────────────────────────────────────────────────────────────────

_SOCIAL = (
    ["social", "feed", "post", "tweet", "follow", "like", "comment", "profile", "instagram", "twitter"],
    "A social media feed with posts, likes, comments, user profiles, and trending topics.",
    ["App", "PostCard", "StoryBubble"],
    '''
function StoryBubble({ user, emoji, active }) {
  return (
    <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-transform group-hover:scale-105 ${active ? "bg-gradient-to-tr from-violet-600 to-pink-500 p-0.5" : "bg-gray-700"}`}>
        {active
          ? <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-2xl">{emoji}</div>
          : emoji}
      </div>
      <span className="text-[10px] text-gray-500">{user}</span>
    </div>
  );
}

function PostCard({ post, onLike }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const toggle = () => { setLiked(l => { setLikes(n => l ? n - 1 : n + 1); return !l; }); onLike(post.id); };
  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-lg flex-shrink-0">{post.avatar}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{post.name}</p>
          <p className="text-xs text-gray-500">{post.handle} · {post.time}</p>
        </div>
        <button className="text-gray-600 hover:text-gray-300 transition-colors">···</button>
      </div>
      <p className="text-sm text-gray-200 leading-relaxed px-4 pb-3">{post.content}</p>
      {post.image && (
        <div className={`mx-4 mb-3 rounded-xl h-40 flex items-center justify-center text-5xl ${post.image}`}>{post.imageEmoji}</div>
      )}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-700/40">
        <button onClick={toggle} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-400" : "text-gray-500 hover:text-red-400"}`}>
          <span className="text-base">{liked ? "❤️" : "🤍"}</span> {likes}
        </button>
        <button onClick={() => setShowComments(s => !s)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-400 transition-colors">
          <span className="text-base">💬</span> {post.comments.length}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-400 transition-colors">
          <span className="text-base">🔁</span> {post.reposts}
        </button>
        <button className="ml-auto text-gray-500 hover:text-violet-400 transition-colors text-base">🔗</button>
      </div>
      {showComments && post.comments.length > 0 && (
        <div className="border-t border-gray-700/40 px-4 py-3 space-y-2.5">
          {post.comments.map((c, i) => (
            <div key={i} className="flex gap-2.5">
              <span className="text-lg flex-shrink-0">{c.avatar}</span>
              <div className="bg-gray-700/50 rounded-xl px-3 py-2 flex-1">
                <p className="text-xs font-semibold text-white mb-0.5">{c.name}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const stories = [
    { user: "Your Story", emoji: "➕", active: false },
    { user: "Alice",   emoji: "🌅", active: true },
    { user: "Bob",     emoji: "🎸", active: true },
    { user: "Charlie", emoji: "🏄", active: true },
    { user: "Diana",   emoji: "🍕", active: true },
    { user: "Evan",    emoji: "🎮", active: false },
  ];

  const [posts, setPosts] = useState([
    { id: 1, avatar: "🧑‍💻", name: "Alex Chen",   handle: "@alexc",   time: "2m",  content: "Just shipped a new feature using GPT-4o + React streaming. The UX is incredible! 🚀 The future of AI-powered apps is here.", image: "bg-gradient-to-br from-violet-600/30 to-indigo-600/30", imageEmoji: "🚀", likes: 142, liked: false, reposts: 28, comments: [{ avatar: "👩", name: "Sarah K.", text: "This is amazing! How did you handle the streaming on the frontend?" }, { avatar: "👨‍🦱", name: "Mark R.",  text: "GPT-4o is a game changer. Great work!" }] },
    { id: 2, avatar: "👩‍🎨", name: "Maya Patel",  handle: "@mayaui",  time: "15m", content: "Dark mode + glassmorphism + framer motion = 😍 My latest design exploration for a SaaS dashboard. Feedback welcome!", image: "bg-gradient-to-br from-pink-600/30 to-rose-600/30", imageEmoji: "🎨", likes: 89,  liked: true,  reposts: 12, comments: [{ avatar: "🧑", name: "Tom W.", text: "Love the color palette! What font are you using?" }] },
    { id: 3, avatar: "🧑‍🚀", name: "Sam Torres", handle: "@samdev",  time: "1h",  content: "Hot take: Tailwind CSS has made me 3x faster at building UIs. Yes, the class names are verbose. No, I don\'t care. The DX is unmatched. 🌶️", image: null, imageEmoji: null, likes: 234, liked: false, reposts: 67, comments: [] },
    { id: 4, avatar: "👨‍💼", name: "David Park",  handle: "@davidp",  time: "3h",  content: "Just crossed 10k GitHub stars on my open source project 🎉 Thank you to everyone who contributed, reported bugs, and spread the word!", image: "bg-gradient-to-br from-green-600/30 to-emerald-600/30", imageEmoji: "⭐", likes: 512, liked: false, reposts: 94, comments: [{ avatar: "👩‍💻", name: "Lisa M.", text: "Congrats!! Well deserved 🎊" }, { avatar: "🧔", name: "Raj S.", text: "Amazing milestone! What\'s the project?" }] },
  ]);

  const trending = ["#ReactJS", "#OpenAI", "#TailwindCSS", "#BuildInPublic", "#WebDev"];

  const likePost = (id) => { /* handled in PostCard */ };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800/80 backdrop-blur border-b border-gray-700 px-5 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">SocialAI</h1>
        <div className="flex items-center gap-2">
          <button className="text-gray-400 hover:text-white transition-colors">🔍</button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm font-bold">J</div>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-4 flex gap-6">
        <main className="flex-1 min-w-0 space-y-4">
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50">
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {stories.map((s, i) => <StoryBubble key={i} {...s} />)}
            </div>
          </div>
          {posts.map(p => <PostCard key={p.id} post={p} onLike={likePost} />)}
        </main>
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50 sticky top-20">
            <h2 className="text-sm font-semibold text-white mb-3">Trending</h2>
            <div className="space-y-2">
              {trending.map((t, i) => (
                <div key={t} className="flex items-center justify-between cursor-pointer hover:bg-gray-700/50 rounded-lg p-2 -mx-2 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-violet-400">{t}</p>
                    <p className="text-xs text-gray-600">{[1420, 893, 672, 445, 231][i]} posts</p>
                  </div>
                  <span className="text-gray-700">›</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
'''.strip(),
)

# ── Template registry ─────────────────────────────────────────────────────────

_TEMPLATES = {
    "dashboard": _DASHBOARD,
    "fitness":   _FITNESS,
    "ecommerce": _ECOMMERCE,
    "kanban":    _KANBAN,
    "social":    _SOCIAL,
}


# ── Provider class ────────────────────────────────────────────────────────────

class TemplateProvider(BaseProvider):
    """Zero-API fallback. Always available. Matches prompt to the best template."""

    name = "template"

    def is_configured(self) -> bool:
        return True  # Always available — no credentials needed

    def _pick(self, prompt: str):
        p = prompt.lower()
        scores = {key: sum(1 for kw in kws if kw in p) for key, (kws, *_) in _TEMPLATES.items()}
        best = max(scores, key=scores.get)
        if scores[best] == 0:
            best = "dashboard"
        return _TEMPLATES[best]

    async def generate_stream(
        self,
        prompt: str,
        mode: str = "generate",
        current_code: str = "",
        history: list | None = None,
    ) -> AsyncIterator[str]:
        if mode == "modify" and current_code:
            # For modify mode with no AI, just re-yield the current code as-is
            # with a comment noting what was requested
            header = f"// Modification requested: {prompt}\n// (AI provider unavailable — install an API key to enable live edits)\n\n"
            for ch in header + current_code:
                yield ch
            return

        _, _, _, code = self._pick(prompt)
        # Stream in small chunks to give a streaming feel
        chunk = 40
        for i in range(0, len(code), chunk):
            yield code[i: i + chunk]
            await asyncio.sleep(0.005)
