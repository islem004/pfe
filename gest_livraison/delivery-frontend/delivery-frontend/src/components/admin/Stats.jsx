import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    TrendingUp, TrendingDown, Package, CheckCircle,
    DollarSign, Users, Trophy, Star, Truck, MapPin,
    BarChart3, Clock, RefreshCw, Award, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area,
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────

const RANGES = [
    { key: 'week',  label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year',  label: 'This Year' },
    { key: 'all',   label: 'All Time' },
];

// Maps the status label returned from backend to a hex color
const STATUS_COLOR = {
    'Pending':    '#F59E0B',
    'Confirmed':  '#3B82F6',
    'In Transit': '#6366F1',
    'Picked Up':  '#0EA5E9',
    'Delivered':  '#22C55E',
    'Failed':     '#EF4444',
    'Cancelled':  '#94A3B8',
    'No Data':    '#E2E8F0',
};

// Badge styles for the recent-deliveries table
const STATUS_BADGE = {
    pending:    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100',   label: 'Pending'    },
    confirmed:  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100',    label: 'Confirmed'  },
    in_transit: { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-100',  label: 'In Transit' },
    picked_up:  { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-100',     label: 'Picked Up'  },
    delivered:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Delivered'  },
    failed:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-100',     label: 'Failed'     },
    cancelled:  { bg: 'bg-slate-50',   text: 'text-slate-500',   border: 'border-slate-100',   label: 'Cancelled'  },
};

const RANK_STYLE = [
    { ring: 'ring-yellow-400', avatar: 'bg-yellow-400 text-yellow-900', medal: '🥇' },
    { ring: 'ring-slate-300',  avatar: 'bg-slate-300  text-slate-700',  medal: '🥈' },
    { ring: 'ring-amber-600',  avatar: 'bg-amber-600  text-white',      medal: '🥉' },
    { ring: 'ring-slate-100',  avatar: 'bg-slate-100  text-slate-500',  medal: '4'  },
    { ring: 'ring-slate-100',  avatar: 'bg-slate-100  text-slate-500',  medal: '5'  },
];

// ─── Utilities ─────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// '2025-01' → 'Jan 25'
const fmtMonth = (label) => {
    if (!label || !label.includes('-') || label.startsWith('Week')) return label;
    const [year, month] = label.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(month, 10) - 1]} '${year.slice(2)}`;
};

const fmtRevenue = (v) => {
    if (!v && v !== 0) return '—';
    return new Intl.NumberFormat('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v) + ' TND';
};

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Pulsing gray rectangle skeleton */
const Sk = ({ h = 'h-8', w = 'w-full', r = 'rounded-2xl' }) => (
    <div className={`${h} ${w} ${r} bg-slate-100 animate-pulse`} />
);

/** Up/down trend chip */
const Trend = ({ value }) => {
    if (value === null || value === undefined) return null;
    const up = value >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-black ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(value)}%
        </span>
    );
};

/** Circular SVG progress ring */
const RingProgress = ({ value = 0, size = 72, stroke = 7, color = '#22C55E' }) => {
    const r   = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(value, 100) / 100) * circ;
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}    strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
    );
};

/** KPI metric card */
const KPICard = ({ icon, label, value, sub, trend, iconBg, iconColor, loading, extra }) => {
    if (loading) return <Sk h="h-36" r="rounded-3xl" />;
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`size-11 ${iconBg} rounded-2xl flex items-center justify-center ${iconColor}`}>
                    {icon}
                </div>
                <Trend value={trend} />
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[28px] font-black text-slate-900 leading-none">{value ?? '—'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{label}</p>
                    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
                </div>
                {extra}
            </div>
        </motion.div>
    );
};

/** Uniform chart wrapper card */
const ChartCard = ({ title, icon, children, action, loading, emptyMsg = 'No data yet' }) => (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full">
        <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                {icon} {title}
            </h3>
            {action}
        </div>
        {loading
            ? <Sk h="h-52" />
            : children
        }
    </div>
);

/** Recharts custom tooltip */
const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white shadow-2xl border border-slate-100 rounded-2xl p-3 text-xs">
            {label && <p className="font-black text-slate-600 mb-2">{label}</p>}
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="size-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
                    <span className="text-slate-500">{p.name}:</span>
                    <span className="font-black text-slate-900">
                        {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

/** Status badge for the recent-deliveries table */
const StatusBadge = ({ status }) => {
    const s = STATUS_BADGE[status] || { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100', label: status };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.bg} ${s.text} ${s.border}`}>
            {s.label}
        </span>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const Stats = () => {
    const [range,       setRange]       = useState('month');
    const [kpis,        setKpis]        = useState(null);
    const [statusData,  setStatusData]  = useState([]);
    const [evolution,   setEvolution]   = useState([]);
    const [byRegion,    setByRegion]    = useState([]);
    const [volume,      setVolume]      = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [bestDriver,  setBestDriver]  = useState(null);
    const [recent,      setRecent]      = useState([]);

    // Granular loading flags so sections appear independently
    const [lKPI,    setLKPI]    = useState(true);
    const [lCharts, setLCharts] = useState(true);
    const [lStaff,  setLStaff]  = useState(true);
    const [lRecent, setLRecent] = useState(true);

    const H = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    // Fetch data that changes with the range filter
    const loadRange = useCallback(async (r) => {
        setLKPI(true);
        const [k, s, v] = await Promise.allSettled([
            axios.get(`/api/admin/statistiques?range=${r}`, H),
            axios.get(`/api/admin/statistiques/success-rates?range=${r}`, H),
            axios.get(`/api/admin/statistiques/volume?range=${r}`, H),
        ]);
        if (k.status === 'fulfilled') setKpis(k.value.data);
        if (s.status === 'fulfilled') setStatusData(Array.isArray(s.value.data) ? s.value.data : []);
        if (v.status === 'fulfilled') setVolume(Array.isArray(v.value.data) ? v.value.data : []);
        setLKPI(false);
    }, []);

    // Fetch data that only loads once (evolution, regions, staff, recent)
    const loadStatic = useCallback(async () => {
        setLCharts(true);
        const [e, reg] = await Promise.allSettled([
            axios.get('/api/admin/statistiques/evolution?view=month', H),
            axios.get('/api/admin/statistiques/by-region', H),
        ]);
        if (e.status === 'fulfilled')   setEvolution(Array.isArray(e.value.data) ? e.value.data : []);
        if (reg.status === 'fulfilled') setByRegion(Array.isArray(reg.value.data) ? reg.value.data : []);
        setLCharts(false);

        setLStaff(true);
        const [lb, bd] = await Promise.allSettled([
            axios.get('/api/admin/statistiques/staff-leaderboard', H),
            axios.get('/api/admin/statistiques/meilleur-livreur-mois', H),
        ]);
        if (lb.status === 'fulfilled') setLeaderboard(Array.isArray(lb.value.data) ? lb.value.data : []);
        if (bd.status === 'fulfilled') setBestDriver(bd.value.data);
        setLStaff(false);

        setLRecent(true);
        const rec = await axios.get('/api/admin/statistiques/recent', H).catch(() => null);
        if (rec) setRecent(Array.isArray(rec.data) ? rec.data : []);
        setLRecent(false);
    }, []);

    useEffect(() => { loadStatic(); }, []);
    useEffect(() => { loadRange(range); }, [range]);

    // ── Derived values ──────────────────────────────────────────
    const bestDriverName     = bestDriver?.name ?? null;
    const bestDriverInitials = bestDriver?.initials ?? '?';

    // ── Render ──────────────────────────────────────────────────
    return (
        <div className="space-y-8 pb-14">

            {/* ── PAGE HEADER ─────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Analytics</h1>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                        Platform performance overview
                    </p>
                </div>

                {/* Range filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
                    {RANGES.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setRange(key)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                                range === key
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                ROW 1 — KPI CARDS
            ══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KPICard
                    loading={lKPI}
                    icon={<Package className="size-5" />}
                    iconBg="bg-blue-50" iconColor="text-blue-600"
                    label="Total Deliveries"
                    value={(kpis?.total ?? 0).toLocaleString()}
                    sub={`${kpis?.delivered ?? 0} delivered`}
                    trend={kpis?.total_trend}
                />
                <KPICard
                    loading={lKPI}
                    icon={<CheckCircle className="size-5" />}
                    iconBg="bg-emerald-50" iconColor="text-emerald-600"
                    label="Success Rate"
                    value={`${kpis?.success_rate ?? 0}%`}
                    sub={`${kpis?.failed ?? 0} failed · ${kpis?.cancelled ?? 0} cancelled`}
                    trend={kpis?.rate_trend}
                    extra={
                        !lKPI && kpis &&
                        <RingProgress value={kpis.success_rate ?? 0} color="#22C55E" />
                    }
                />
                <KPICard
                    loading={lKPI}
                    icon={<DollarSign className="size-5" />}
                    iconBg="bg-violet-50" iconColor="text-violet-600"
                    label="Delivery Revenue"
                    value={fmtRevenue(kpis?.revenue)}
                    sub="Platform delivery fees"
                    trend={kpis?.revenue_trend}
                />
                <KPICard
                    loading={lKPI}
                    icon={<Users className="size-5" />}
                    iconBg="bg-amber-50" iconColor="text-amber-600"
                    label="Active Clients"
                    value={(kpis?.active_clients ?? 0).toLocaleString()}
                    sub={`+${kpis?.new_clients ?? 0} new this month`}
                    trend={kpis?.clients_trend}
                />
            </div>

            {/* ══════════════════════════════════════════════════
                ROW 2 — STATUS DONUT  +  REVENUE AREA CHART
            ══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT: Status Breakdown Donut */}
                <ChartCard
                    title="Deliveries by Status"
                    icon={<span className="size-4 text-blue-600">◉</span>}
                    loading={lKPI}
                >
                    {statusData.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-slate-300 font-bold italic text-sm">No data</div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div style={{ width: 180, height: 180, flexShrink: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%" cy="50%"
                                            innerRadius={52} outerRadius={78}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, i) => (
                                                <Cell key={i} fill={STATUS_COLOR[entry.name] ?? '#CBD5E1'} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend */}
                            <div className="flex flex-col gap-2 flex-1 min-w-0">
                                {statusData.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="size-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[s.name] }} />
                                            <span className="font-bold text-slate-700 truncate">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="font-black text-slate-900">{s.value.toLocaleString()}</span>
                                            <span className="text-slate-400 w-10 text-right">{s.percent}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ChartCard>

                {/* RIGHT: Revenue Evolution Area */}
                <ChartCard
                    title="Revenue Evolution"
                    icon={<TrendingUp className="size-4 text-violet-600" />}
                    loading={lCharts}
                >
                    {evolution.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-slate-300 font-bold italic text-sm">No data</div>
                    ) : (
                        <div style={{ height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={evolution} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}    />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="label" tickFormatter={fmtMonth} fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => v > 999 ? `${(v/1000).toFixed(1)}k TND` : `${v} TND`} width={60} />
                                    <Tooltip content={<ChartTip />} />
                                    <Area type="monotone" dataKey="revenue" name="Revenue (TND)" stroke="#8B5CF6" fill="url(#revGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* ══════════════════════════════════════════════════
                ROW 3 — BY REGION HORIZONTAL BAR  +  DAILY VOLUME STACKED BAR
            ══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT: Deliveries by Region */}
                <ChartCard
                    title="Deliveries by Region"
                    icon={<MapPin className="size-4 text-blue-600" />}
                    loading={lCharts}
                >
                    {byRegion.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-slate-300 font-bold italic text-sm">No data</div>
                    ) : (
                        <div style={{ height: Math.max(200, byRegion.slice(0, 10).length * 34) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={byRegion.slice(0, 10)}
                                    layout="vertical"
                                    margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                                >
                                    <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis
                                        type="category" dataKey="name" width={112}
                                        fontSize={10} fontWeight={600} axisLine={false} tickLine={false}
                                        tickFormatter={v => v.length > 14 ? v.slice(0, 14) + '…' : v}
                                    />
                                    <Tooltip content={<ChartTip />} cursor={{ fill: '#F8FAFC' }} />
                                    <Bar dataKey="count" name="Deliveries" fill="#3B82F6" radius={[0, 8, 8, 0]} maxBarSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                {/* RIGHT: Daily Volume Stacked */}
                <ChartCard
                    title="Daily Delivery Volume"
                    icon={<BarChart3 className="size-4 text-emerald-600" />}
                    loading={lKPI}
                >
                    {volume.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-slate-300 font-bold italic text-sm">No data</div>
                    ) : (
                        <>
                            <div style={{ height: 190 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={volume} margin={{ top: 0, right: 0, left: -18, bottom: 0 }} barCategoryGap="30%">
                                        <XAxis dataKey="date" hide />
                                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip content={<ChartTip />} cursor={{ fill: '#F8FAFC' }} />
                                        <Bar dataKey="delivered"  stackId="v" fill="#22C55E" name="Delivered"  />
                                        <Bar dataKey="in_transit" stackId="v" fill="#6366F1" name="In Transit" />
                                        <Bar dataKey="pending"    stackId="v" fill="#F59E0B" name="Pending"    />
                                        <Bar dataKey="failed"     stackId="v" fill="#EF4444" name="Failed"     radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Mini legend */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                                {[
                                    { color: '#22C55E', label: 'Delivered' },
                                    { color: '#6366F1', label: 'In Transit' },
                                    { color: '#F59E0B', label: 'Pending' },
                                    { color: '#EF4444', label: 'Failed' },
                                ].map(({ color, label }) => (
                                    <div key={label} className="flex items-center gap-1.5">
                                        <span className="size-2 rounded-sm" style={{ background: color }} />
                                        <span className="text-[10px] font-bold text-slate-400">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </ChartCard>
            </div>

            {/* ══════════════════════════════════════════════════
                ROW 4 — STAFF LEADERBOARD  +  BEST DRIVER CARD
            ══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* LEFT: Top-5 Leaderboard (3/5 width) */}
                <div className="lg:col-span-3">
                    <ChartCard
                        title="Driver Leaderboard — This Month"
                        icon={<Trophy className="size-4 text-yellow-500" />}
                        loading={lStaff}
                    >
                        {leaderboard.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center gap-2 text-slate-300">
                                <Trophy className="size-10" />
                                <p className="font-bold italic text-sm">No completed deliveries this month</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leaderboard.map((s, i) => {
                                    const rs = RANK_STYLE[i] ?? RANK_STYLE[4];
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors"
                                        >
                                            {/* Rank + Avatar */}
                                            <div className="relative flex-shrink-0">
                                                <div className={`size-10 rounded-xl flex items-center justify-center font-black text-sm ring-2 ${rs.ring} ${rs.avatar}`}>
                                                    {s.initials}
                                                </div>
                                                <span className="absolute -top-1.5 -right-1.5 text-sm leading-none">
                                                    {rs.medal}
                                                </span>
                                            </div>

                                            {/* Name + ID */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-slate-900 text-sm truncate">{s.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    {s.employee_id && <span>{s.employee_id}</span>}
                                                    {s.avg_delivery_time != null && (
                                                        <span className={s.employee_id ? ' · ' : ''}>avg {s.avg_delivery_time}min</span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-slate-900 leading-none">{s.completed}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.failed > 0 ? `${s.failed} failed` : 'done'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-blue-600 leading-none">{s.score}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">score</p>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                                                    s.success_rate >= 80 ? 'bg-emerald-50 text-emerald-700'
                                                    : s.success_rate >= 50 ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-red-50 text-red-600'
                                                }`}>
                                                    {s.success_rate}%
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </ChartCard>
                </div>

                {/* RIGHT: Best Driver Card (2/5 width) */}
                <div className="lg:col-span-2">
                    {lStaff ? (
                        <Sk h="h-full min-h-[240px]" r="rounded-3xl" />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-7 text-white relative overflow-hidden shadow-2xl flex flex-col"
                        >
                            {/* Glow decoration */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/10 rounded-full translate-x-16 -translate-y-16 blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-36 h-36 bg-violet-500/10 rounded-full -translate-x-10 translate-y-10 blur-2xl pointer-events-none" />

                            <div className="relative z-10 flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="size-11 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Trophy className="size-5 text-yellow-900" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Best Driver</p>
                                        <p className="text-xs text-slate-400">This Month</p>
                                    </div>
                                </div>

                                {bestDriverName ? (
                                    <>
                                        {/* Avatar + Name */}
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="size-14 bg-slate-700 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0 ring-2 ring-yellow-400/40">
                                                {bestDriverInitials.toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-lg font-black leading-tight truncate">{bestDriverName}</h4>
                                                {bestDriver?.employee_id && (
                                                    <p className="text-xs text-slate-400 font-mono">{bestDriver.employee_id}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats grid */}
                                        <div className="grid grid-cols-2 gap-3 mt-auto">
                                            <div className="bg-white/5 rounded-2xl p-4">
                                                <p className="text-2xl font-black text-yellow-400 leading-none">
                                                    {bestDriver?.completed ?? 0}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                                                    {bestDriver?.failed > 0 ? `${bestDriver.failed} failed` : 'Deliveries'}
                                                </p>
                                            </div>
                                            <div className="bg-white/5 rounded-2xl p-4">
                                                <p className="text-2xl font-black text-emerald-400 leading-none">
                                                    {bestDriver?.success_rate ?? '—'}%
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">Success</p>
                                            </div>
                                            <div className="bg-white/5 rounded-2xl p-4">
                                                <p className="text-2xl font-black text-blue-400 leading-none">
                                                    {bestDriver?.score ?? '—'}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">Score</p>
                                            </div>
                                            <div className="bg-white/5 rounded-2xl p-4">
                                                <p className="text-2xl font-black text-violet-400 leading-none">
                                                    {bestDriver?.avg_delivery_time != null ? `${bestDriver.avg_delivery_time}` : '—'}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">Avg min</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center flex-1 gap-3 text-slate-500">
                                        <Star className="size-12 opacity-20" />
                                        <p className="text-sm font-bold italic">No deliveries this month</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                ROW 5 — RECENT DELIVERIES TABLE
            ══════════════════════════════════════════════════ */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Clock className="size-4 text-slate-400" />
                        Recent Deliveries
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 10</span>
                </div>

                {lRecent ? (
                    <div className="p-6 space-y-3">
                        {[...Array(5)].map((_, i) => <Sk key={i} h="h-10" r="rounded-xl" />)}
                    </div>
                ) : recent.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-slate-300">
                        <Package className="size-12" />
                        <p className="font-bold italic text-sm">No deliveries yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/60">
                                    {['Delivery #', 'Client', 'Status', 'Driver', 'Region', 'Date'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {recent.map((d, i) => (
                                        <motion.tr
                                            key={d.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors"
                                        >
                                            <td className="px-5 py-3.5">
                                                <span className="font-black text-slate-900 text-xs">#{d.delivery_number}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="font-bold text-slate-700 text-xs max-w-[140px] truncate block">{d.client}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <StatusBadge status={d.status} />
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {d.staff ? (
                                                    <span className="text-xs text-slate-600 font-medium">{d.staff}</span>
                                                ) : (
                                                    <span className="text-xs text-slate-300 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="size-3 text-slate-300 flex-shrink-0" />
                                                    <span className="text-xs text-slate-500">{d.region}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-xs text-slate-400">{fmtDate(d.created_at)}</span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Stats;
