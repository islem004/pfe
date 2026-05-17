import React from 'react';

/**
 * StatCard
 * @param {string}   title        — uppercase label
 * @param {number}   value        — big number
 * @param {React.FC} icon         — lucide-react icon component
 * @param {string}   color        — icon + border color (hex)
 * @param {string}   bgColor      — icon background color (hex)
 * @param {string}   borderColor  — left-border color (hex)
 */
const StatCard = ({ title, value, icon: Icon, color, bgColor, borderColor }) => (
    <div
        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col gap-3 border-l-4"
        style={{ borderLeftColor: borderColor }}
    >
        <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: bgColor }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
        </div>
        <p className="text-4xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
    </div>
);

export default StatCard;
