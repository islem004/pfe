import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    MessageSquare, AlertCircle, Clock, CheckCircle, 
    Search, Filter, Inbox, User, X, Send, 
    ShieldAlert, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ComplaintManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [status, setStatus] = useState('resolved');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/complaints', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setComplaints(response.data || []);
        } catch (error) {
            console.error("Error fetching complaints:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/admin/complaints/${selectedComplaint.id}`, {
                status,
                admin_response: adminResponse
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSelectedComplaint(null);
            setAdminResponse('');
            fetchComplaints();
        } catch (error) {
            alert("Error updating complaint.");
        }
    };


    const filteredComplaints = complaints.filter(c => 
        c.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.user?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700;900&display=swap');
            `}</style>
            <div className="p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                            <ShieldAlert className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Complaints Management</h1>
                            <p className="mt-1 text-sm font-medium text-slate-500">Incidents & Client Support</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-10">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by subject or client..."
                            className="w-full border-none rounded-2xl py-5 pl-14 pr-6 outline-none transition-all text-sm font-medium"
                            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Clock className="w-10 h-10 animate-spin mb-4" style={{ color: '#3b82f6' }} />
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Loading data...</p>
                    </div>
                ) : filteredComplaints.length > 0 ? (
                    <div className="grid gap-6">
                        {filteredComplaints.map((c) => (
                            <motion.div 
                                key={c.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedComplaint(c)}
                                className="p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between group transition-all border cursor-pointer relative overflow-hidden"
                                style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-all" style={{ backgroundColor: '#3b82f6' }}></div>
                                <div className="flex items-center gap-6 w-full">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg ${
                                        c.status === 'pending' ? 'bg-amber-50 text-amber-600 shadow-amber-200/20' : 'bg-emerald-50 text-emerald-600 shadow-emerald-200/20'
                                    }`}>
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-xl mb-2 truncate pr-10" style={{ color: '#0f172a' }}>{c.subject}</h4>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                                <User className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
                                                <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#475569' }}>{c.user?.first_name} {c.user?.last_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-slate-400" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center gap-4">
                                    <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                        c.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    }`}>
                                        {c.status === 'pending' ? 'Pending' : 'Resolved'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center rounded-[3rem] border-2 border-dashed" style={{ backgroundColor: '#fcfbfa', borderColor: '#e2e8f0' }}>
                        <div className="w-20 h-20 rounded-3xl shadow-xl flex items-center justify-center mb-6" style={{ backgroundColor: '#ffffff', shadowColor: 'rgba(0,0,0,0.05)' }}>
                            <Inbox className="w-10 h-10" style={{ color: '#e2e8f0' }} />
                        </div>
                        <h4 className="text-xl font-bold mb-2" style={{ color: '#0f172a' }}>No complaints</h4>
                        <p className="max-w-xs mx-auto font-medium" style={{ color: '#64748b' }}>All requests have been processed or no complaints have been submitted yet.</p>
                    </div>
                )}
            </div>

            {/* Response Modal */}
            <AnimatePresence>
                {selectedComplaint && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative"
                        >
                            <button onClick={() => setSelectedComplaint(null)} className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all z-10">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="p-10 border-b" style={{ borderColor: '#e2e8f0' }}>
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border mb-6 inline-block ${
                                    selectedComplaint.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                    {selectedComplaint.status}
                                </span>
                                <h3 className="text-3xl font-black tracking-tight mb-2" style={{ color: '#0f172a' }}>{selectedComplaint.subject}</h3>
                                <div className="flex items-center gap-4" style={{ color: '#64748b' }}>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" style={{ color: '#3b82f6' }} />
                                        <span className="text-sm font-bold" style={{ color: '#475569' }}>{selectedComplaint.user?.first_name} {selectedComplaint.user?.last_name}</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#e2e8f0' }}></div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-bold">{new Date(selectedComplaint.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10" style={{ backgroundColor: '#f8fafc' }}>
                                <div className="p-8 rounded-[2rem] border shadow-sm mb-10" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: '#64748b' }}>Client Message</p>
                                    <p className="leading-relaxed font-medium" style={{ color: '#475569' }}>{selectedComplaint.description}</p>
                                </div>

                                <form onSubmit={handleUpdate} className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Case Status</label>
                                        <div className="flex gap-4">
                                            {['pending', 'resolved'].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setStatus(s)}
                                                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                                                        status === s 
                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/20' 
                                                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                                    }`}
                                                    style={status === s ? { backgroundColor: '#3b82f6', borderColor: '#3b82f6' } : {}}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Your Response</label>
                                        <textarea 
                                            required
                                            rows="4"
                                            className="w-full bg-white border border-slate-100 rounded-[2rem] py-6 px-8 outline-none transition-all text-sm font-medium resize-none shadow-sm"
                                            style={{ borderColor: '#e2e8f0' }}
                                            placeholder="Reply to the client here..."
                                            value={adminResponse}
                                            onChange={(e) => setAdminResponse(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="flex gap-4">
                                        <button 
                                            type="submit"
                                            className="w-full py-6 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl"
                                            style={{ backgroundColor: '#0f172a' }}
                                        >
                                            <Send className="w-5 h-5" /> Confirm
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ComplaintManagement;
