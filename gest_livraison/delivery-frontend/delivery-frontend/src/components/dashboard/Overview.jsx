import React, { useState, useEffect } from 'react';
import {
    Package, Clock, CheckCircle, Truck, TrendingUp, TrendingDown,
    UserPlus, AlertCircle, Plus, MapPin, ChevronRight, Activity,
    Loader2, X, Banknote, Zap
} from 'lucide-react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Card } from "../ui/card";

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
    pending:    '#f97316',
    confirmed:  '#6366f1',
    picked_up:  '#3b82f6',
    in_transit: '#8b5cf6',
    delivered:  '#10b981',
    failed:     '#ef4444',
    cancelled:  '#94a3b8',
};

const STATUS_LABELS = {
    pending:    'Pending',
    confirmed:  'Confirmed',
    picked_up:  'Picked Up',
    in_transit: 'In Transit',
    delivered:  'Delivered',
    failed:     'Failed',
    cancelled:  'Cancelled',
};

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

const timeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

const fmtDay = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' });
};

const activityMeta = (type, status) => {
    if (type === 'new_client') {
        return { icon: UserPlus,     bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'New client registered' };
    }
    const map = {
        pending:    { icon: Package,      bg: 'bg-blue-50',   color: 'text-blue-600',   label: 'New delivery created'  },
        confirmed:  { icon: CheckCircle,  bg: 'bg-indigo-50', color: 'text-indigo-600', label: 'Delivery confirmed'    },
        picked_up:  { icon: Package,      bg: 'bg-sky-50',    color: 'text-sky-600',    label: 'Delivery picked up'    },
        in_transit: { icon: Truck,        bg: 'bg-blue-50',   color: 'text-blue-600',   label: 'Delivery in transit'   },
        delivered:  { icon: CheckCircle,  bg: 'bg-emerald-50',color: 'text-emerald-600',label: 'Delivery completed'    },
        failed:     { icon: AlertCircle,  bg: 'bg-red-50',    color: 'text-red-600',    label: 'Delivery failed'       },
        cancelled:  { icon: X,            bg: 'bg-slate-100', color: 'text-slate-500',  label: 'Delivery cancelled'    },
    };
    return map[status] ?? { icon: Activity, bg: 'bg-slate-100', color: 'text-slate-500', label: 'Status updated' };
};

// ─────────────────────────────────────────────────────────────
//  Skeleton
// ─────────────────────────────────────────────────────────────

const Sk = ({ className }) => (
    <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />
);

// ─────────────────────────────────────────────────────────────
//  Recharts custom tooltip
// ─────────────────────────────────────────────────────────────

const ChartTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 shadow-lg rounded-xl px-3 py-2 text-xs font-bold text-slate-700">
            {payload[0].value}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
//  ADMIN OVERVIEW
// ─────────────────────────────────────────────────────────────

const AdminOverview = ({ user, setActiveTab }) => {
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);

    const firstName = user?.first_name || 'Admin';

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/stats', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setData(res.data);
        } catch (err) {
            console.error('AdminOverview error:', err);
        } finally {
            setLoading(false);
        }
    };

    // derived chart data
    const statusData = data
        ? Object.entries(data.status_breakdown || {})
            .map(([key, val]) => ({
                name:  STATUS_LABELS[key] || key,
                value: parseInt(val),
                color: STATUS_COLORS[key] || '#94a3b8',
                key,
            }))
            .filter(d => d.value > 0)
        : [];

    const trendData = (data?.weekly_trend || []).map(d => ({
        ...d,
        label: fmtDay(d.date),
    }));

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const successPct = data && data.total > 0
        ? Math.round((data.delivered / data.total) * 100)
        : 0;

    return (
        <div className="space-y-6 pb-16">

            {/* ── Greeting ── */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    Excellent Day,{' '}
                    <span className="text-blue-600" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                        {firstName}
                    </span>
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                    {today}
                    {data && (
                        <span>
                            {' '}·{' '}
                            <span className={data.pending > 10 ? 'text-red-500 font-bold' : data.pending > 5 ? 'text-orange-500 font-bold' : ''}>
                                {data.pending} pending
                            </span>
                            {' '}deliveries,{' '}
                            <span className={data.unassigned_total > 0 ? 'text-orange-500 font-bold' : ''}>
                                {data.unassigned_total} unassigned
                            </span>
                            {' '}orders
                        </span>
                    )}
                </p>
            </div>

            {/* ── Row 1: KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {loading || !data ? (
                    [...Array(4)].map((_, i) => <Sk key={i} className="h-28 rounded-2xl" />)
                ) : (
                    <>
                        {/* Total Shipments */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="size-4 text-blue-500" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Shipments</p>
                            </div>
                            <h4 className="text-3xl font-black text-slate-900">{data.total}</h4>
                            {data.trend !== null && data.trend !== undefined ? (
                                <span className={`text-xs font-bold mt-1.5 inline-flex items-center gap-1 ${data.trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {data.trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                    {Math.abs(data.trend)}% vs last month
                                </span>
                            ) : (
                                <span className="text-xs font-bold mt-1.5 text-slate-400 inline-block">All time</span>
                            )}
                        </div>

                        {/* Pending Operations */}
                        <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 ${
                            data.pending > 10 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-orange-400'
                        }`}>
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className={`size-4 ${data.pending > 10 ? 'text-red-500' : 'text-orange-400'}`} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Operations</p>
                            </div>
                            <h4 className={`text-3xl font-black ${
                                data.pending > 10 ? 'text-red-600' : data.pending > 5 ? 'text-orange-500' : 'text-slate-900'
                            }`}>
                                {data.pending}
                            </h4>
                            <span className={`text-xs font-bold mt-1.5 inline-block ${
                                data.pending > 10 ? 'text-red-500' : data.pending > 5 ? 'text-orange-400' : 'text-slate-400'
                            }`}>
                                {data.pending > 10 ? 'High urgency' : data.pending > 5 ? 'Needs attention' : 'On track'}
                            </span>
                        </div>

                        {/* In Transit */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-400 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Truck className="size-4 text-blue-400" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">In Transit</p>
                            </div>
                            <h4 className="text-3xl font-black text-slate-900">{data.in_transit}</h4>
                            <span className="text-xs font-bold mt-1.5 text-slate-400 inline-block">Active shipments</span>
                        </div>

                        {/* Delivered */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="size-4 text-emerald-500" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivered</p>
                            </div>
                            <h4 className="text-3xl font-black text-slate-900">{data.delivered}</h4>
                            <span className={`text-xs font-bold mt-1.5 inline-block ${successPct >= 80 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {data.total > 0 ? `${successPct}% success rate` : 'No deliveries yet'}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* ── Row 2: Trend Chart + Donut ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Delivery Trend */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                        Delivery Trend — Last 7 Days
                    </p>
                    {loading ? (
                        <Sk className="h-44" />
                    ) : trendData.length > 0 && trendData.some(d => d.count > 0) ? (
                        <ResponsiveContainer width="100%" height={176}>
                            <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<ChartTip />} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={2.5}
                                    fill="url(#trendGrad)"
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-44 flex flex-col items-center justify-center gap-2">
                            <TrendingUp className="size-8 text-slate-200" />
                            <p className="text-xs font-black text-slate-400">No deliveries in the last 7 days</p>
                        </div>
                    )}
                </div>

                {/* Status Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                        Status Breakdown
                    </p>
                    {loading ? (
                        <div className="flex items-center gap-6">
                            <Sk className="size-36 rounded-full shrink-0" />
                            <div className="flex-1 space-y-3">
                                {[...Array(4)].map((_, i) => <Sk key={i} className="h-3" />)}
                            </div>
                        </div>
                    ) : statusData.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <div style={{ width: 144, height: 144, flexShrink: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%" cy="50%"
                                            innerRadius={44} outerRadius={64}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {statusData.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (!active || !payload?.length) return null;
                                                const d = payload[0].payload;
                                                return (
                                                    <div
                                                        className="bg-white border border-slate-100 shadow-lg rounded-xl px-3 py-2 text-xs font-bold"
                                                        style={{ color: d.color }}
                                                    >
                                                        {d.name}: {d.value}
                                                    </div>
                                                );
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                {statusData.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="size-2 rounded-full shrink-0"
                                                style={{ backgroundColor: d.color }}
                                            />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
                                                {d.name}
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-slate-700 shrink-0">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-44 flex flex-col items-center justify-center gap-2">
                            <Package className="size-8 text-slate-200" />
                            <p className="text-xs font-black text-slate-400">No deliveries yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 3: Unassigned + Top Drivers ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Unassigned Deliveries */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Unassigned Deliveries
                        </p>
                        <button
                            onClick={() => setActiveTab('deliveries')}
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            View All <ChevronRight size={12} />
                        </button>
                    </div>

                    {loading || !data ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <Sk key={i} className="h-14 rounded-xl" />)}
                        </div>
                    ) : data.unassigned?.length > 0 ? (
                        <div className="space-y-2">
                            {data.unassigned.map((d) => (
                                <div key={d.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                                        SD
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-slate-900 truncate">
                                            #{d.delivery_number}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <MapPin size={9} className="text-slate-400 shrink-0" />
                                            <span className="text-[10px] text-slate-400 truncate font-medium">
                                                {d.client_name} · {d.dest_city}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('deliveries')}
                                        className="shrink-0 text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
                                    >
                                        Assign
                                    </button>
                                </div>
                            ))}
                            {data.unassigned_total > data.unassigned.length && (
                                <button
                                    onClick={() => setActiveTab('deliveries')}
                                    className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                    +{data.unassigned_total - data.unassigned.length} more unassigned
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center gap-2">
                            <CheckCircle className="size-8 text-emerald-200" />
                            <p className="text-xs font-black text-slate-400">All deliveries assigned</p>
                        </div>
                    )}
                </div>

                {/* Top Drivers This Week */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                        Top Drivers This Week
                    </p>

                    {loading || !data ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Sk className="size-8 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Sk className="h-3 w-1/2" />
                                        <Sk className="h-2 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : data.top_drivers?.length > 0 ? (
                        <div className="space-y-4">
                            {data.top_drivers.map((driver, i) => {
                                const medals    = ['🥇', '🥈', '🥉'];
                                const barColors = ['bg-amber-400', 'bg-slate-300', 'bg-orange-300'];
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xl shrink-0 leading-none">{medals[i]}</span>
                                        <div className="size-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 uppercase">
                                            {driver.initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <p className="text-xs font-black text-slate-900 truncate">{driver.name}</p>
                                                <span className="text-xs font-black text-blue-600 shrink-0 ml-2">
                                                    {driver.score}pts
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${barColors[i]}`}
                                                    style={{ width: `${driver.success_rate}%` }}
                                                />
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1">
                                                {driver.completed} done · {driver.failed} failed · {driver.success_rate}%
                                                {driver.avg_delivery_time != null && ` · avg ${driver.avg_delivery_time}min`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center gap-2">
                            <Truck className="size-8 text-slate-200" />
                            <p className="text-xs font-black text-slate-400">No completed deliveries this week</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 4: Recent Activity Feed ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                    Recent Activity
                </p>

                {loading || !data ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Sk className="size-8 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Sk className="h-3 w-2/3" />
                                    <Sk className="h-2.5 w-1/3" />
                                </div>
                                <Sk className="h-3 w-12 shrink-0" />
                            </div>
                        ))}
                    </div>
                ) : data.recent_activity?.length > 0 ? (
                    <div className="space-y-1">
                        {data.recent_activity.map((event, i) => {
                            const meta = activityMeta(event.type, event.status);
                            const Icon = meta.icon;
                            return (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                                        <Icon className={`size-4 ${meta.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-700 leading-snug">
                                            {meta.label}
                                            {event.delivery_number && (
                                                <span className="font-black text-slate-900"> #{event.delivery_number}</span>
                                            )}
                                            {event.actor && (
                                                <span className="text-slate-400"> — {event.actor}</span>
                                            )}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
                                        {timeAgo(event.created_at)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <Activity className="size-10 text-slate-200" />
                        <p className="text-xs font-black text-slate-400">No recent activity</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
//  CLIENT STAT CARD
// ─────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        indigo:  'text-indigo-600 bg-indigo-50 border-indigo-100',
        amber:   'text-amber-600 bg-amber-50 border-amber-100',
        blue:    'text-blue-600 bg-blue-50 border-blue-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        violet:  'text-violet-600 bg-violet-50 border-violet-100',
    };
    return (
        <Card className="px-5 py-6 border-none shadow-xl shadow-slate-200/40 rounded-[1.5rem] bg-white hover:shadow-2xl transition-all">
            <div className={`p-3 rounded-2xl w-fit mb-4 border ${colors[color]}`}>
                <Icon className="size-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
        </Card>
    );
};

// ─────────────────────────────────────────────────────────────
//  CLIENT OVERVIEW  (existing design, unchanged logic)
// ─────────────────────────────────────────────────────────────

const STATUS_META = {
    pending:    { label: 'Pending',    color: '#F59E0B' },
    confirmed:  { label: 'Confirmed',  color: '#3B82F6' },
    picked_up:  { label: 'Picked Up',  color: '#3B82F6' },
    in_transit: { label: 'In Transit', color: '#6366F1' },
    delivered:  { label: 'Delivered',  color: '#22C55E' },
    failed:     { label: 'Failed',     color: '#EF4444' },
    cancelled:  { label: 'Cancelled',  color: '#9CA3AF' },
};

const STATUS_BADGE = {
    pending:    'bg-amber-50 text-amber-600 border-amber-100',
    confirmed:  'bg-indigo-50 text-indigo-600 border-indigo-100',
    picked_up:  'bg-blue-50 text-blue-600 border-blue-100',
    in_transit: 'bg-blue-50 text-blue-600 border-blue-100',
    delivered:  'bg-emerald-50 text-emerald-600 border-emerald-100',
    failed:     'bg-red-50 text-red-600 border-red-100',
    cancelled:  'bg-slate-50 text-slate-600 border-slate-100',
};

const ClientOverview = ({ user, setActiveTab }) => {
    const [stats, setStats]       = useState(null);
    const [weekly, setWeekly]     = useState([]);
    const [pie, setPie]           = useState([]);
    const [insights, setInsights] = useState(null);
    const [active, setActive]     = useState([]);
    const [loading, setLoading]   = useState(true);

    const firstName = user?.first_name || 'User';

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res   = await axios.get('/api/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const d = res.data;
            setStats({
                all:               d.stats?.total             || 0,
                pending:           d.stats?.pending           || 0,
                in_transit:        d.stats?.in_transit        || 0,
                delivered:         d.stats?.delivered         || 0,
                merchandise_value: d.stats?.merchandise_value ?? null,
            });
            setWeekly(d.weekly_activity || []);
            setPie((d.status_distribution || []).map(item => ({
                ...item,
                label: STATUS_META[item.status]?.label || item.status,
                fill:  STATUS_META[item.status]?.color || '#9CA3AF',
            })));
            setInsights(d.insights || null);
            setActive(d.active_deliveries || []);
        } catch (err) {
            console.error('ClientOverview error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-600" />
                <p className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 animate-pulse">
                    Syncing Logistics Hub...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 text-left pb-16">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@1,700&family=Inter:wght@400;500;600;700;800;900&display=swap');
            `}</style>

            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
                                Excellent Day,{' '}
                                <span className="text-blue-600 italic" style={{ fontFamily: "'Crimson Pro', serif" }}>
                                    {firstName}
                                </span>
                            </h1>
                            <p className="text-sm text-slate-500 mt-2 max-w-2xl font-medium">
                                Track your packages, manage shipments, and explore your delivery metrics.
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab('create')}
                            className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 flex items-center gap-3 transition-all"
                        >
                            <Plus className="size-4" /> New Shipment
                        </motion.button>
                    </motion.div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <StatCard icon={TrendingUp}   label="Total Shipments"     value={stats?.all        || 0}  color="indigo"  />
                    <StatCard icon={Clock}         label="Pending Operations"  value={stats?.pending    || 0}  color="amber"   />
                    <StatCard icon={Package}       label="In Transit"          value={stats?.in_transit || 0}  color="blue"    />
                    <StatCard icon={CheckCircle}   label="Finalized"           value={stats?.delivered  || 0}  color="emerald" />
                    <StatCard icon={Banknote}      label="Goods Value"         value={stats?.merchandise_value != null ? `${Number(stats.merchandise_value).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND` : '—'} color="violet" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                    {/* Activity Trend */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-6 bg-blue-600 rounded-full" />
                            <h2 className="text-base font-black text-slate-900">Recent Activity</h2>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-4 mb-4">
                            Deliveries created · last 7 days
                        </p>
                        {weekly.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={weekly} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="ovActivityGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div className="bg-white shadow-lg rounded-2xl px-4 py-3 border border-slate-100 text-sm">
                                                <p className="font-black text-slate-900">{label}</p>
                                                <p className="text-slate-400 font-medium mt-0.5">{payload[0].value} deliveries</p>
                                            </div>
                                        );
                                    }} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fill="url(#ovActivityGrad)"
                                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#3b82f6' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-slate-300 text-sm font-bold">No activity data</div>
                        )}
                    </div>

                    {/* Status Distribution */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-6 bg-blue-600 rounded-full" />
                            <h2 className="text-base font-black text-slate-900">Status Distribution</h2>
                        </div>
                        {pie.length > 0 ? (
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pie} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                                                paddingAngle={3} dataKey="count" animationBegin={0} animationDuration={700}>
                                                {pie.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
                                            </Pie>
                                            <Tooltip content={({ active, payload }) => {
                                                if (!active || !payload?.length) return null;
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="bg-white shadow-lg rounded-2xl px-4 py-3 border border-slate-100 text-sm">
                                                        <p className="font-black text-slate-900">{d.label}</p>
                                                        <p className="text-slate-400 font-medium mt-0.5">{d.count} · {d.percentage}%</p>
                                                    </div>
                                                );
                                            }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-black text-slate-900 leading-none">{stats?.all || 0}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Total</span>
                                    </div>
                                </div>
                                <div className="flex-1 w-full space-y-2.5">
                                    {pie.map(item => (
                                        <div key={item.status} className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                            <span className="flex-1 text-sm font-semibold text-slate-700">{item.label}</span>
                                            <span className="text-sm font-black text-slate-900 min-w-[24px] text-right">{item.count}</span>
                                            <span className="text-xs font-bold text-slate-400 min-w-[36px] text-right">{item.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[180px] flex items-center justify-center text-slate-300 text-sm font-bold">No data yet</div>
                        )}
                    </div>
                </div>

                {/* Quick Insights */}
                <div className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Quick Insights</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-blue-50 rounded-xl"><Zap className="w-5 h-5 text-blue-600" /></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg. Delivery Time</p>
                            </div>
                            <p className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                                {insights?.avg_delivery_days != null ? insights.avg_delivery_days : '—'}
                            </p>
                            <p className="text-xs font-bold text-slate-400 mt-2">
                                {insights?.avg_delivery_days != null ? 'days from creation to delivery' : 'No completed deliveries yet'}
                            </p>
                        </div>
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-indigo-50 rounded-xl"><MapPin className="w-5 h-5 text-indigo-600" /></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Destination</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900 tracking-tight truncate leading-tight">
                                {insights?.most_used_region || '—'}
                            </p>
                            <p className="text-xs font-bold text-slate-400 mt-2">Most frequently shipped to</p>
                        </div>
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-emerald-50 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Success Rate</p>
                            </div>
                            <p className="text-4xl font-black text-emerald-600 tracking-tight leading-none">
                                {insights?.success_rate ?? 0}%
                            </p>
                            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                    style={{ width: `${insights?.success_rate ?? 0}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Deliveries */}
                {active.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Deliveries</p>
                            <button
                                onClick={() => setActiveTab('deliveries')}
                                className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors flex items-center gap-1"
                            >
                                View All <ChevronRight className="size-3" />
                            </button>
                        </div>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            {active.map((delivery, index) => (
                                <div
                                    key={delivery.id}
                                    onClick={() => setActiveTab('deliveries')}
                                    className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                                        index < active.length - 1 ? 'border-b border-slate-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                                            <span className="text-white text-[10px] font-black">SD</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">#{delivery.delivery_number}</p>
                                            <p className="text-xs font-medium text-slate-400 mt-0.5">
                                                {delivery.dest_city || delivery.delivery_address_text || '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${STATUS_BADGE[delivery.status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                            {STATUS_META[delivery.status]?.label || delivery.status}
                                        </span>
                                        <ChevronRight className="size-4 text-slate-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};


// ─────────────────────────────────────────────────────────────
//  ROOT EXPORT
// ─────────────────────────────────────────────────────────────

const Overview = ({ role, user, setActiveTab }) => {
    if (role === 'admin') {
        return <AdminOverview user={user} setActiveTab={setActiveTab} />;
    }
    return <ClientOverview user={user} setActiveTab={setActiveTab} />;
};

export default Overview;
