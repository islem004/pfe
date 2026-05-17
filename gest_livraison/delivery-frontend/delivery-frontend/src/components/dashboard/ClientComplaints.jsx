import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, Plus, Search, Clock, CheckCircle, 
    AlertCircle, X, Send, Package, HelpCircle 
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ClientComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        delivery_id: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [compRes, delRes] = await Promise.all([
                axios.get('/api/complaints', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                axios.get('/api/deliveries', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
            ]);
            setComplaints(compRes.data || []);
            setDeliveries(delRes.data.data || delRes.data || []);
        } catch (error) {
            console.error("Error fetching complaints:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/complaints', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setShowModal(false);
            setFormData({ subject: '', description: '', delivery_id: '' });
            fetchData();
        } catch (error) {
            alert("Error sending complaint.");
        }
    };

    const filteredComplaints = complaints.filter(c => 
        c.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-2xl font-black text-slate-900">My Complaints</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Support & Assistance</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
                >
                    <Plus className="w-4 h-4" /> New Complaint
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search complaint..."
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Clock className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading...</p>
                        </div>
                    ) : filteredComplaints.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredComplaints.map((c) => (
                                <motion.div 
                                    key={c.id} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-slate-200 hover:shadow-xl transition-all"
                                >
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                                c.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                            }`}>
                                                <MessageSquare className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-lg mb-1">{c.subject}</h4>
                                                <p className="text-sm text-slate-500 leading-relaxed max-w-2xl mb-4">{c.description}</p>
                                                
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white px-3 py-1.5 rounded-full border border-slate-100">
                                                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                                                        {new Date(c.created_at).toLocaleDateString()}
                                                    </div>
                                                    {c.delivery && (
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white px-3 py-1.5 rounded-full border border-slate-100">
                                                            <Package className="w-3.5 h-3.5 text-slate-600" />
                                                            #{c.delivery.delivery_number}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                                c.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                                {c.status === 'pending' ? 'Pending' : 'Resolved'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {c.admin_response && (
                                        <div className="mt-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                <CheckCircle className="w-3.5 h-3.5" /> Administrator Response
                                            </p>
                                            <p className="text-sm text-slate-600 leading-relaxed italic">{c.admin_response}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <HelpCircle className="w-10 h-10 text-slate-200" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-2">No Complaints</h4>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">If you have an issue, we're here to help.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">New Complaint</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">We will process your request promptly</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium"
                                        placeholder="E.g. Package not received, Item damaged..."
                                        value={formData.subject}
                                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Related Package (Optional)</label>
                                    <select 
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium appearance-none"
                                        value={formData.delivery_id}
                                        onChange={(e) => setFormData({...formData, delivery_id: e.target.value})}
                                    >
                                        <option value="">Select a package...</option>
                                        {deliveries.map(d => (
                                            <option key={d.id} value={d.id}>Package #{d.delivery_number} - {d.dest_city}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                    <textarea 
                                        required
                                        rows="4"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium resize-none"
                                        placeholder="Explain your issue in detail..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    ></textarea>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                                >
                                    <Send className="w-4 h-4" /> Send Complaint
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClientComplaints;
