import React, { useState, useEffect } from 'react';
import {
    Package, Search, Filter, ChevronRight,
    Clock, CheckCircle, AlertCircle, Printer,
    Truck, MapPin, Eye, FileDown, Plus,
    UserPlus, X, ShieldCheck, RefreshCw, RotateCcw,
    Navigation, Info, Loader2, User, FileText, Star, Trash2, Receipt, Download
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentPreviewModal from '../layout/DocumentPreviewModal';
import DriverSelectionModal from './DriverSelectionModal';
import RatingModal from './RatingModal';
import { Badge } from '../ui/badge';

const DeliveriesList = ({ role }) => {
    const [loading, setLoading] = useState(true);
    const [deliveries, setDeliveries] = useState([]);
    
    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [regionFilter, setRegionFilter] = useState('');
    const [regions, setRegions] = useState([]);
    
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [staff, setStaff] = useState([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState({ url: '', title: '', fileName: '' });
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, deliveryId: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, deliveryId: null });
    const [trackModal, setTrackModal] = useState({ open: false, data: null, loading: false });

    const userRole = role || localStorage.getItem('role') || 'client';

    const steps = [
        { id: 'created',   label: 'Created',   icon: Package },
        { id: 'confirmed', label: 'Confirmed',  icon: CheckCircle },
        { id: 'picked_up', label: 'Picked Up',  icon: Package },
        { id: 'shipped',   label: 'Shipped',    icon: Truck },
        { id: 'delivered', label: 'Delivered',  icon: MapPin }
    ];

    const getCurrentStep = (status) => {
        const s = status?.toLowerCase();
        if (s === 'created') return 0;
        if (s === 'confirmed') return 1;
        if (s === 'picked_up') return 2;
        if (s === 'shipped') return 3;
        if (s === 'delivered' || s === 'completed') return 4;
        return -1;
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchDeliveries();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, statusFilter, regionFilter]);

    const fetchInitialData = async () => {
        if (userRole === 'admin') fetchStaff();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/regions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRegions(res.data || []);
        } catch (err) { console.error("Error fetching regions", err); }
    };

    const fetchStaff = async () => {
        try {
            const resp = await axios.get('/api/admin/staff', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setStaff(resp.data || []);
        } catch (err) { console.error("Error fetching staff", err); }
    };

    const fetchDeliveries = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const endpoint = userRole === 'admin' ? '/api/admin/deliveries' : '/api/deliveries';
            
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
            if (regionFilter) params.append('region_id', regionFilter);

            const response = await axios.get(`${endpoint}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const respData = response.data;
            const actualList = respData.data || (Array.isArray(respData) ? respData : []);
            
            setDeliveries(actualList);
        } catch (err) {
            console.error("Error during server-side filtering:", err);
            setDeliveries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (deliveryId) => {
        setExpandedRowId(prev => prev === deliveryId ? null : deliveryId);
    };

    const handleConfirmDelivery = async (deliveryId) => {
        if (userRole !== 'admin') return;
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(`/api/admin/deliveries/${deliveryId}`, { 
                status: 'confirmed' 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDeliveries();
            setConfirmModal({ open: false, deliveryId: null });
        } catch (err) {
            console.error("Error confirming delivery:", err);
            alert("Error during confirmation.");
        } finally {
            setLoading(false);
        }
    };

    const triggerConfirm = (e, deliveryId) => {
        e.stopPropagation();
        setConfirmModal({ open: true, deliveryId });
    };

    const handleDeleteDelivery = async (deliveryId) => {
        try {
            await axios.delete(`/api/admin/deliveries/${deliveryId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setDeliveries(prev => prev.filter(d => d.id !== deliveryId));
            setDeleteModal({ open: false, deliveryId: null });
        } catch (err) {
            console.error("Error deleting delivery:", err);
            alert("Error: could not delete the delivery.");
        }
    };

    const handleAssignDriver = async (deliveryId, staffId) => {
        if (!deliveryId || !staffId) return;
        try {
            setIsAssigning(true);
            const token = localStorage.getItem('token');
            await axios.put(`/api/admin/deliveries/${deliveryId}`, { 
                assigned_staff_id: staffId 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
             fetchDeliveries();
            setAssignmentModalOpen(false);
            // alert("Livreur assigné avec succès !");
        } catch (err) {
            console.error("Error assigning driver:", err);
            alert("Error during assignment.");
        } finally {
            setIsAssigning(false);
        }
    };

    const openAssignmentModal = (e, d) => {
        e.stopPropagation();
        setSelectedDelivery(d);
        setAssignmentModalOpen(true);
    };

    const openRatingModal = (e, d) => {
        e.stopPropagation();
        setSelectedDelivery(d);
        setRatingModalOpen(true);
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'created':   return 'Created';
            case 'confirmed': return 'Confirmed';
            case 'picked_up': return 'Picked Up';
            case 'shipped':   return 'Shipped';
            case 'delivered': return 'Delivered';
            case 'failed':    return 'Failed';
            case 'cancelled': return 'Cancelled';
            default: return status || 'Unknown';
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'shipped':   return 'bg-violet-50 text-violet-600 border-violet-100';
            case 'picked_up': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'confirmed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'created':   return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'failed':
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const handlePrint = async (id) => {
        try {
            const response = await axios.get(`/api/deliveries/${id}/print`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `delivery-slip-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (err) { alert("Error during download."); }
    };

    const handleViewBon = async (delivery) => {
        try {
            const response = await axios.get(`/api/deliveries/${delivery.id}/print`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob'
            });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            setPreviewData({ url: fileURL, title: 'Delivery Slip', fileName: `slip-${delivery.delivery_number}.pdf` });
            setIsPreviewOpen(true);
        } catch (err) { alert("Error opening document."); }
    };

    const handleViewInvoice = async (invoice) => {
        try {
            const resp = await axios.get(`/api/invoices/${invoice.id}/print`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob'
            });
            const file = new Blob([resp.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            setPreviewData({ url: fileURL, title: 'Digital Invoice', fileName: `invoice-${invoice.invoice_number}.pdf` });
            setIsPreviewOpen(true);
        } catch (err) { alert("Error opening document."); }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setRegionFilter('');
    };

    const openPdfInTab = async (url) => {
        try {
            const resp = await axios.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob'
            });
            const blob    = new Blob([resp.data], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            const link    = document.createElement('a');
            link.href     = blobUrl;
            link.target   = '_blank';
            link.rel      = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch { alert('Error opening document.'); }
    };

    const handleDownloadFile = async (url, filename) => {
        try {
            const resp = await axios.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob',
            });
            const blobUrl = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
        } catch { alert('Error downloading file.'); }
    };

    const handleTrackDelivery = async (id) => {
        setTrackModal({ open: true, data: null, loading: true });
        try {
            const resp = await axios.get(`/api/deliveries/${id}/track`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setTrackModal({ open: true, data: resp.data, loading: false });
        } catch {
            setTrackModal({ open: false, data: null, loading: false });
            alert('Error loading tracking information.');
        }
    };

    const getTrackingLabel = (status) => {
        const map = {
            created: 'Order Created', confirmed: 'Confirmed & Processed',
            picked_up: 'Picked Up', shipped: 'Shipped',
            delivered: 'Delivered', failed: 'Delivery Failed', cancelled: 'Cancelled',
        };
        return map[status] || (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search (ID, Client, Phone...)"
                            className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-6 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-slate-50 border-none rounded-2xl py-3.5 px-6 pr-10 focus:ring-2 focus:ring-blue-600 outline-none text-xs font-black uppercase tracking-widest appearance-none cursor-pointer"
                            >
                                <option value="">All statuses</option>
                                <option value="created">Created</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="picked_up">Picked Up</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="failed">Failed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select 
                                value={regionFilter}
                                onChange={(e) => setRegionFilter(e.target.value)}
                                className="bg-slate-50 border-none rounded-2xl py-3.5 px-6 pr-10 focus:ring-2 focus:ring-blue-600 outline-none text-xs font-black uppercase tracking-widest appearance-none cursor-pointer min-w-[150px]"
                            >
                                <option value="">All regions</option>
                                {regions.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        {(searchTerm || statusFilter || regionFilter) && (
                            <button 
                                onClick={resetFilters}
                                className="p-3.5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto px-4">
                    <table className="w-full text-left border-collapse my-4">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Reference</th>
                                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Shipping</th>
                                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Status</th>
                                {userRole === 'admin' && <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Driver</th>}
                                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan="5" className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                                <p className="text-sm font-bold text-slate-400">Loading...</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : deliveries.length === 0 ? (
                                    <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan="5" className="p-12 text-center">
                                            <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                            <p className="text-sm font-bold text-slate-400">No results found.</p>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    deliveries.map((d) => (
                                        <React.Fragment key={d.id}>
                                            <tr
                                                onClick={userRole !== 'client' ? () => handleRowClick(d.id) : undefined}
                                                className={`transition-all border-l-4 ${userRole !== 'client' ? 'cursor-pointer' : ''} ${
                                                    expandedRowId === d.id ? 'bg-blue-50/50 border-blue-600 shadow-inner' : 'hover:bg-slate-50 border-transparent'
                                                }`}
                                            >
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                                                            expandedRowId === d.id ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'bg-slate-900 text-white'
                                                        }`}>SD</div>
                                                        <p className="font-black text-slate-900 text-sm">#{d.delivery_number}</p>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                        <span className="text-xs font-bold truncate max-w-[150px]">{d.delivery_address_text}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span
                                                        onClick={(e) => d.status === 'created' && userRole === 'admin' ? triggerConfirm(e, d.id) : null}
                                                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(d.status)} ${
                                                            d.status === 'created' && userRole === 'admin' ? 'cursor-pointer hover:scale-105 hover:shadow-md hover:bg-indigo-600 hover:text-white hover:border-indigo-600' : ''
                                                        }`}
                                                        title={d.status === 'created' && userRole === 'admin' ? 'Click to confirm' : ''}
                                                    >
                                                        {getStatusLabel(d.status)}
                                                    </span>
                                                </td>
                                                {userRole === 'admin' && (
                                                    <td className="p-6">
                                                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                                            <motion.button 
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={(e) => openAssignmentModal(e, d)}
                                                                className={`group/btn flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all ${
                                                                    d.assigned_staff 
                                                                        ? 'bg-blue-50 border-blue-100 text-blue-700 hover:border-blue-300' 
                                                                        : 'bg-white border-slate-100 text-slate-400 hover:border-blue-600 hover:text-blue-600'
                                                                }`}
                                                            >
                                                                <div className={`p-1.5 rounded-xl transition-colors ${
                                                                    d.assigned_staff ? 'bg-blue-200 text-blue-700' : 'bg-slate-50 text-slate-400 group-hover/btn:bg-blue-50 group-hover/btn:text-blue-600'
                                                                }`}>
                                                                    <UserPlus className="size-3.5" />
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                                    {d.assigned_staff 
                                                                        ? `${d.assigned_staff.user?.first_name} ${d.assigned_staff.user?.last_name?.[0]}.` 
                                                                        : 'Assign'}
                                                                </span>
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="p-6 text-right">
                                                    <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                                                        {userRole === 'client' && (
                                                            <>
                                                                <button
                                                                    onClick={() => openPdfInTab(`/api/deliveries/${d.id}/print`)}
                                                                    className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                                    title="View Delivery Slip"
                                                                >
                                                                    <Printer className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadFile(`/api/deliveries/${d.id}/print`, `slip-${d.delivery_number}.pdf`)}
                                                                    className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                                    title="Download Delivery Slip"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                                {d.invoices?.length > 0 && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => openPdfInTab(`/api/invoices/${d.invoices[0].id}/print`)}
                                                                            className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                                            title="View Invoice"
                                                                        >
                                                                            <Receipt className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDownloadFile(`/api/invoices/${d.invoices[0].id}/print`, `invoice-${d.invoices[0].invoice_number}.pdf`)}
                                                                            className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                                            title="Download Invoice"
                                                                        >
                                                                            <FileDown className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => handleTrackDelivery(d.id)}
                                                                    className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-violet-600 hover:text-white transition-all shadow-sm"
                                                                    title="Track Delivery"
                                                                >
                                                                    <Navigation className="w-4 h-4" />
                                                                </button>
                                                                {d.status === 'delivered' && !d.rating && (
                                                                    <button
                                                                        onClick={(e) => openRatingModal(e, d)}
                                                                        className="p-2.5 bg-amber-50 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                                        title="Rate delivery"
                                                                    >
                                                                        <Star className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {d.rating && (
                                                                    <div className="flex items-center gap-1 bg-amber-50 text-amber-500 px-2 py-1 rounded-lg">
                                                                        <Star className="size-3 fill-amber-500" />
                                                                        <span className="text-[10px] font-black">{d.rating}</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                        {userRole === 'admin' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, deliveryId: d.id }); }}
                                                                className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                                title="Delete delivery"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {userRole !== 'client' && (
                                                            <motion.div
                                                                animate={{ rotate: expandedRowId === d.id ? 90 : 0 }}
                                                                onClick={(e) => { e.stopPropagation(); handleRowClick(d.id); }}
                                                                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                                                                    expandedRowId === d.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                                                                }`}
                                                            >
                                                                <ChevronRight className="w-4 h-4" />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            <AnimatePresence>
                                                {userRole !== 'client' && expandedRowId === d.id && (
                                                    <tr>
                                                        <td colSpan={userRole === 'admin' ? 5 : 4} className="p-0 border-none">
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden bg-slate-50/50"
                                                            >
                                                                <div className="p-10">
                                                                    {/* Horizontal Process Path */}
                                                                    <div className="max-w-4xl mx-auto px-10">
                                                                        <div className="relative flex justify-between items-center w-full">
                                                                            {/* Progress Line Background */}
                                                                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 -translate-y-1/2 z-0" />
                                                                            
                                                                            {/* Completed Progress Line */}
                                                                            <motion.div 
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${(Math.max(0, getCurrentStep(d.status)) / (steps.length - 1)) * 100}%` }}
                                                                                className="absolute top-1/2 left-0 h-[2px] bg-blue-600 -translate-y-1/2 z-0"
                                                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                                            />

                                                                            {steps.map((step, idx) => {
                                                                                const currentStepIdx = getCurrentStep(d.status);
                                                                                const isDone = idx <= currentStepIdx;
                                                                                const isCurrent = idx === currentStepIdx;

                                                                                return (
                                                                                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                                                                                        <div className={`size-12 rounded-2xl flex items-center justify-center shadow-lg transition-all border-2 ${
                                                                                            isDone 
                                                                                                ? 'bg-blue-600 border-blue-600 text-white scale-110' 
                                                                                                : 'bg-white border-slate-100 text-slate-300'
                                                                                        } ${isCurrent ? 'ring-4 ring-blue-600/20' : ''}`}>
                                                                                            <step.icon className={`size-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                                                                                        </div>
                                                                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                                                                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                                                                                                {step.label}
                                                                                            </p>
                                                                                            {isCurrent && <p className="text-[8px] font-bold text-blue-500 uppercase mt-0.5">In Progress</p>}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Space for step labels below */}
                                                                    <div className="h-12"></div>

                                                                </div>
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            <DocumentPreviewModal 
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title={previewData.title}
                fileUrl={previewData.url}
                fileName={previewData.fileName}
            />

            {/* Assignment Modal */}
            <DriverSelectionModal 
                open={assignmentModalOpen}
                onOpenChange={setAssignmentModalOpen}
                delivery={selectedDelivery}
                staff={staff}
                onAssign={handleAssignDriver}
                isAssigning={isAssigning}
            />

            <RatingModal
                open={ratingModalOpen}
                onClose={() => setRatingModalOpen(false)}
                delivery={selectedDelivery}
                onRated={() => {
                    fetchDeliveries();
                    alert("Thank you for your rating!");
                }}
            />

            {/* Tracking Modal */}
            <AnimatePresence>
                {trackModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setTrackModal({ open: false, data: null, loading: false })}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 max-h-[80vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Track Delivery</h3>
                                    {trackModal.data && (
                                        <p className="text-xs font-bold text-slate-400 mt-0.5">#{trackModal.data.delivery_number}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setTrackModal({ open: false, data: null, loading: false })}
                                    className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {trackModal.loading ? (
                                <div className="flex flex-col items-center py-12 gap-3">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    <p className="text-xs font-bold text-slate-400">Loading tracking info...</p>
                                </div>
                            ) : trackModal.data ? (
                                <div>
                                    <div className="mb-6 p-4 bg-blue-50 rounded-2xl flex items-center gap-3">
                                        <Navigation className="w-5 h-5 text-blue-600 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Current Status</p>
                                            <p className="text-sm font-black text-blue-700">{getTrackingLabel(trackModal.data.current_status)}</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">History</p>
                                    <div className="relative">
                                        <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-slate-100" />
                                        <div className="space-y-4">
                                            {trackModal.data.history?.length > 0 ? trackModal.data.history.map((entry, idx) => (
                                                <div key={idx} className="flex gap-4 relative">
                                                    <div className={`size-8 rounded-xl flex items-center justify-center z-10 shrink-0 ${
                                                        idx === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-2 border-slate-100 text-slate-400'
                                                    }`}>
                                                        {idx === 0 ? <CheckCircle className="size-4" /> : <Clock className="size-4" />}
                                                    </div>
                                                    <div className="flex-1 pb-4">
                                                        <p className={`text-xs font-black ${idx === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                                                            {getTrackingLabel(entry.status)}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                            {entry.created_at ? new Date(entry.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                                                        </p>
                                                        {entry.notes && entry.notes !== 'Status updated by staff' && (
                                                            <p className="text-[10px] font-medium text-slate-400 mt-1 italic">{entry.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="pl-12 py-6 text-center">
                                                    <p className="text-xs font-bold text-slate-400">No tracking history yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setDeleteModal({ open: false, deliveryId: null })}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center border border-slate-100"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="size-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="size-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Delivery</h3>
                            <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                                This action is <span className="text-red-500 font-bold">irreversible</span>. The delivery and all its data will be permanently removed.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleDeleteDelivery(deleteModal.deliveryId)}
                                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95"
                                >
                                    Yes, Delete
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ open: false, deliveryId: null })}
                                    className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.open && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setConfirmModal({ open: false, deliveryId: null })}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center border border-slate-100"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="size-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="size-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Confirmation</h3>
                            <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                                Do you really want to confirm this order and move it to <span className="text-indigo-600 font-bold">Processed</span> state?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => handleConfirmDelivery(confirmModal.deliveryId)}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    Yes, Confirm
                                </button>
                                <button 
                                    onClick={() => setConfirmModal({ open: false, deliveryId: null })}
                                    className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    No, Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeliveriesList;
