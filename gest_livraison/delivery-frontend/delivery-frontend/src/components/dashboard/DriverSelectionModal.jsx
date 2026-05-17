import React, { useState } from 'react';
import { Search, User, MapPin, Check, X, Phone, ShieldCheck, Star, Filter, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";

const DriverSelectionModal = ({ open, onOpenChange, delivery, staff, onAssign, isAssigning }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showAll, setShowAll] = useState(false);

    // Filter staff based on search, region, and availability
    const filteredStaff = staff.filter(s => {
        // Search filter
        const fullName = `${s.user?.first_name} ${s.user?.last_name}`.toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        if (showAll) return true;

        // Strict Filter: Same Region & Available (0 active deliveries)
        const isLocal = s.region_id === delivery?.region_id;
        const isAvailable = (s.active_deliveries_count || 0) === 0;

        return isLocal && isAvailable;
    });

    // If showing all, sort to put local/available drivers first
    const sortedStaff = showAll ? [...filteredStaff].sort((a, b) => {
        const aScore = (a.region_id === delivery?.region_id ? 2 : 0) + (a.active_deliveries_count === 0 ? 1 : 0);
        const bScore = (b.region_id === delivery?.region_id ? 2 : 0) + (b.active_deliveries_count === 0 ? 1 : 0);
        return bScore - aScore;
    }) : filteredStaff;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl">
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                `}</style>
                
                <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <ShieldCheck className="size-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-900 font-inter">Assign a Driver</DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">
                                    Delivery <span className="text-blue-600 font-bold">#{delivery?.delivery_number}</span> • Region: <span className="text-slate-900 font-bold">{delivery?.region?.name || "N/A"}</span>
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-14 pl-12 pr-6 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all shadow-sm"
                                />
                            </div>

                            {/* Show All Toggle */}
                            <button 
                                onClick={() => setShowAll(!showAll)}
                                className={`h-14 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border-2 ${
                                    showAll ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-blue-50 border-blue-200 text-blue-600'
                                }`}
                            >
                                {showAll ? (
                                    <><Eye className="size-4" /> Global Mode</>
                                ) : (
                                    <><Filter className="size-4" /> Local Mode</>
                                )}
                            </button>
                        </div>
                    </DialogHeader>
                </div>

                <div className="max-h-[500px] overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-4">
                        {sortedStaff.length > 0 ? (
                            sortedStaff.map((s) => {
                                const isLocal = s.region_id === delivery?.region_id;
                                const isCurrent = delivery?.assigned_staff_id === s.id;

                                return (
                                    <motion.div
                                        key={s.id}
                                        whileHover={{ scale: 1.01, x: 5 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => !isAssigning && onAssign(delivery.id, s.id)}
                                        className={`group cursor-pointer p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between ${
                                            isCurrent 
                                                ? 'bg-blue-50 border-blue-600' 
                                                : isLocal 
                                                    ? 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50/50' 
                                                    : 'bg-slate-50/30 border-slate-50 opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`size-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${
                                                isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {s.user?.first_name?.[0]}{s.user?.last_name?.[0]}
                                            </div>
                                            <div className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-slate-900">{s.user?.first_name} {s.user?.last_name}</h4>
                                                    {isLocal && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-wider">
                                                            <MapPin className="size-2" /> Local Region
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                        <Phone className="size-3" /> {s.user?.phone || '---'}
                                                    </p>
                                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                        s.active_deliveries_count > 0 ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {s.active_deliveries_count > 0 ? `Busy (${s.active_deliveries_count})` : 'Free'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {isCurrent ? (
                                                <div className="size-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                                    <Check className="size-4" />
                                                </div>
                                            ) : (
                                                <div className="h-10 px-6 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center font-black text-[10px] uppercase tracking-widest transition-all">
                                                    Select
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="py-20 text-center">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <Filter className="size-16 text-slate-200 mx-auto mb-6" />
                                    <h4 className="text-lg font-black text-slate-900 mb-2">No drivers available</h4>
                                    <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto mb-8">
                                        There are no free drivers in the region <span className="font-bold text-blue-600">"{delivery?.region?.name}"</span> at the moment.
                                    </p>
                                    <button
                                        onClick={() => setShowAll(true)}
                                        className="text-white bg-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200"
                                    >
                                        Show out-of-region / busy
                                    </button>
                                </motion.div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 flex justify-end gap-3 bg-slate-50/30">
                    <button 
                        onClick={() => onOpenChange(false)}
                        className="px-8 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-white transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DriverSelectionModal;
