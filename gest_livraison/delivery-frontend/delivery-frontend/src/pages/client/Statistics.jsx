import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Package, CheckCircle, Truck, Clock, XCircle,
    BarChart3, RefreshCw, AlertCircle, TrendingUp, MapPin, Zap,
} from 'lucide-react';
import StatCard from '../../components/client/StatCard';
import StatusPieChart from '../../components/client/StatusPieChart';
import ActivityChart from '../../components/client/ActivityChart';

// ─── constants ────────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
    { value: 'week',  label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year',  label: 'This Year' },
    { value: 'all',   label: 'All Time' },
];

const STATUS_LABELS = {
    created:   'Created',   confirmed: 'Confirmed', picked_up: 'Picked Up',
    shipped:   'Shipped',   delivered: 'Delivered', failed:    'Failed',    cancelled: 'Cancelled',
};

const STATUS_STYLES = {
    created:    'bg-orange-50  text-orange-600  border-orange-100',
    confirmed:  'bg-indigo-50  text-indigo-600  border-indigo-100',
    picked_up:  'bg-blue-50    text-blue-600    border-blue-100',
    shipped:    'bg-violet-50  text-violet-600  border-violet-100',
    delivered:  'bg-emerald-50 text-emerald-600 border-emerald-100',
    failed:     'bg-red-50     text-red-600     border-red-100',
    cancelled:  'bg-slate-50   text-slate-600   border-slate-100',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
    const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7)  return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`} />
);

const LoadingSkeleton = () => (
    <div className="space-y-8 pb-16">
        <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
                <Skeleton className="h-9 w-52" />
                <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-11 w-80" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
    </div>
);

// ─── main component ────────────────────────────────────────────────────────────

const ClientStatistics = ({ setActiveTab }) => {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [range, setRange]     = useState('all');

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/client/statistics?range=${range}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load statistics.');
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return <LoadingSkeleton />;

    // ── Error ────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-5 text-center">
                <div className="p-5 bg-red-50 rounded-3xl">
                    <AlertCircle className="w-14 h-14 text-red-400" />
                </div>
                <div>
                    <p className="text-xl font-black text-slate-900">Could not load statistics</p>
                    <p className="text-sm font-medium text-slate-400 mt-1">{error}</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 active:scale-95 transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        );
    }

    // ── Empty ────────────────────────────────────────────────────────────────
    if (data?.total === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-5 text-center">
                <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <BarChart3 className="w-16 h-16 text-slate-300" />
                </div>
                <div>
                    <p className="text-2xl font-black text-slate-900">No data yet</p>
                    <p className="text-sm font-medium text-slate-400 mt-1 max-w-xs">
                        Start shipping to see your delivery performance statistics here.
                    </p>
                </div>
                <button
                    onClick={() => setActiveTab('create')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 active:scale-95 transition-all"
                >
                    Create First Delivery
                </button>
            </div>
        );
    }

    // ── Data ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8 pb-16">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Statistics</h1>
                    <p className="text-sm font-medium text-slate-400 mt-1">Track your shipping performance</p>
                </div>
                {/* Range filter */}
                <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm self-start sm:self-auto">
                    {RANGE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setRange(opt.value)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                range === opt.value
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Summary Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total Shipments" value={data.total}       icon={Package}     color="#1E3A5F" bgColor="#eef2ff" borderColor="#1E3A5F" />
                <StatCard title="Delivered"        value={data.delivered}  icon={CheckCircle} color="#22C55E" bgColor="#f0fdf4" borderColor="#22C55E" />
                <StatCard title="In Transit"       value={data.in_transit} icon={Truck}       color="#6366F1" bgColor="#eef2ff" borderColor="#6366F1" />
                <StatCard title="Pending"          value={data.pending}    icon={Clock}       color="#F59E0B" bgColor="#fffbeb" borderColor="#F59E0B" />
                <StatCard title="Failed"           value={data.failed}     icon={XCircle}     color="#EF4444" bgColor="#fef2f2" borderColor="#EF4444" />
            </div>

            {/* ── Charts Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Donut chart */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-6 bg-blue-600 rounded-full" />
                        <h2 className="text-base font-black text-slate-900">Status Distribution</h2>
                    </div>
                    <StatusPieChart data={data.status_distribution} total={data.total} />
                </div>

                {/* Area chart */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-6 bg-blue-600 rounded-full" />
                        <h2 className="text-base font-black text-slate-900">Recent Activity</h2>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-4 mb-4">
                        Deliveries created · last 7 days
                    </p>
                    <ActivityChart data={data.weekly_activity} />
                </div>
            </div>

            {/* ── Quick Insights ─────────────────────────────────────────── */}
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Quick Insights</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Avg delivery time */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-blue-50 rounded-xl">
                                <Zap className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg. Delivery Time</p>
                        </div>
                        <p className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                            {data.insights?.avg_delivery_days !== null && data.insights?.avg_delivery_days !== undefined
                                ? data.insights.avg_delivery_days
                                : '—'}
                        </p>
                        <p className="text-xs font-bold text-slate-400 mt-2">
                            {data.insights?.avg_delivery_days !== null && data.insights?.avg_delivery_days !== undefined
                                ? 'days from creation to delivery'
                                : 'No completed deliveries yet'}
                        </p>
                    </div>

                    {/* Most used destination */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-indigo-50 rounded-xl">
                                <MapPin className="w-5 h-5 text-indigo-600" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Destination</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900 tracking-tight truncate leading-tight">
                            {data.insights?.most_used_region || '—'}
                        </p>
                        <p className="text-xs font-bold text-slate-400 mt-2">Most frequently shipped to</p>
                    </div>

                    {/* Success rate */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-emerald-50 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Success Rate</p>
                        </div>
                        <p className="text-4xl font-black text-emerald-600 tracking-tight leading-none">
                            {data.insights?.success_rate ?? 0}%
                        </p>
                        <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: `${data.insights?.success_rate ?? 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Recent Deliveries ──────────────────────────────────────── */}
            {data.recent_deliveries?.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Deliveries</p>
                        <button
                            onClick={() => setActiveTab('deliveries')}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
                        >
                            View All →
                        </button>
                    </div>
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        {data.recent_deliveries.map((delivery, index) => (
                            <div
                                key={delivery.id}
                                className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                                    index < data.recent_deliveries.length - 1 ? 'border-b border-slate-50' : ''
                                }`}
                                onClick={() => setActiveTab('deliveries')}
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
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${STATUS_STYLES[delivery.status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                        {STATUS_LABELS[delivery.status] || delivery.status}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 min-w-[56px] text-right">
                                        {timeAgo(delivery.created_at)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientStatistics;
