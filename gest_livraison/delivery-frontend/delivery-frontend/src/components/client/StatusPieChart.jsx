import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * StatusPieChart
 * @param {Array}  data  — [{ status, count, percentage }]
 * @param {number} total — total deliveries (shown in center)
 */

const STATUS_META = {
    pending:    { label: 'Pending',    color: '#F59E0B' },
    confirmed:  { label: 'Confirmed',  color: '#3B82F6' },
    picked_up:  { label: 'Picked Up',  color: '#3B82F6' },
    in_transit: { label: 'In Transit', color: '#6366F1' },
    delivered:  { label: 'Delivered',  color: '#22C55E' },
    failed:     { label: 'Failed',     color: '#EF4444' },
    cancelled:  { label: 'Cancelled',  color: '#9CA3AF' },
};

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white shadow-lg rounded-2xl px-4 py-3 border border-slate-100 text-sm">
            <p className="font-black text-slate-900">{d.label}</p>
            <p className="text-slate-400 font-medium mt-0.5">{d.count} deliveries · {d.percentage}%</p>
        </div>
    );
};

const StatusPieChart = ({ data, total }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-slate-300 text-sm font-bold">
                No data
            </div>
        );
    }

    const chartData = data.map(item => ({
        ...item,
        label: STATUS_META[item.status]?.label || item.status,
        fill:  STATUS_META[item.status]?.color || '#9CA3AF',
    }));

    return (
        <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Donut */}
            <div className="relative shrink-0" style={{ width: 200, height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={62}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="count"
                            animationBegin={0}
                            animationDuration={700}
                        >
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900 leading-none">{total}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Total</span>
                </div>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-2.5">
                {chartData.map(item => (
                    <div key={item.status} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                        <span className="flex-1 text-sm font-semibold text-slate-700">{item.label}</span>
                        <span className="text-sm font-black text-slate-900 min-w-[24px] text-right">{item.count}</span>
                        <span className="text-xs font-bold text-slate-400 min-w-[36px] text-right">{item.percentage}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatusPieChart;
