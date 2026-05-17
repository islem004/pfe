import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Plus, Edit2, Trash2, Search, Package, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RegionManagement = () => {
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newRegionName, setNewRegionName] = useState('');

    useEffect(() => {
        fetchRegions();
    }, []);

    const fetchRegions = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/regions');
            setRegions(response.data);
        } catch (error) {
            console.error('Error fetching regions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newRegionName.trim()) return;
        try {
            await axios.post('/api/admin/regions', { name: newRegionName });
            setNewRegionName('');
            fetchRegions();
        } catch (error) {
            alert('Error creating region.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this region?')) return;
        try {
            await axios.delete(`/api/admin/regions/${id}`);
            fetchRegions();
        } catch (error) {
            alert('Error during deletion.');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700;900&display=swap');
            `}</style>
            <div className="lg:col-span-1">
                <div className="p-8 rounded-[2.5rem] border shadow-sm sticky top-28" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 font-bold" style={{ backgroundColor: '#ffffff', color: '#3b82f6', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.05)' }}>
                        <Navigation className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Add Region</h3>
                    <p className="text-sm mb-8 leading-relaxed font-medium text-slate-500">
                        Create new delivery zones to better organize your routes.
                    </p>
                    
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest mb-3 ml-1" style={{ color: '#64748b' }}>Region Name</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 border-none rounded-2xl outline-none transition-all font-medium"
                                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                                placeholder="e.g. Tunis, Sousse, Sfax..."
                                value={newRegionName}
                                onChange={(e) => setNewRegionName(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl mt-4 active:scale-95"
                            style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                        >
                            <Plus className="w-5 h-5" /> Save
                        </button>
                    </form>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {loading ? (
                            [1, 2, 4].map(i => <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-slate-100" />)
                        ) : (
                            regions.map((region) => (
                                <motion.div
                                    key={region.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-6 rounded-3xl border flex items-center justify-between group transition-all"
                                    style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.05)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm" style={{ backgroundColor: '#f8fafc', color: '#3b82f6' }}>
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold" style={{ color: '#0f172a' }}>{region.name}</h4>
                                            <p className="text-xs uppercase font-black tracking-widest" style={{ color: '#64748b' }}>Tunisia</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-xl transition-all hover:bg-slate-50" style={{ color: '#475569' }}>
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(region.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
                {!loading && regions.length === 0 && (
                    <div className="p-20 text-center rounded-[3rem] border-2 border-dashed" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                        <Package className="w-12 h-12 mx-auto mb-4" style={{ color: '#e2e8f0' }} />
                        <p className="font-medium" style={{ color: '#64748b' }}>No regions registered yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegionManagement;
