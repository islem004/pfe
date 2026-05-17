import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FileText, Download, Search, RefreshCw, Eye,
    Calendar, Banknote, CheckCircle, Clock,
    Filter, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import DocumentPreviewModal from '../layout/DocumentPreviewModal';

const getStatusBadge = (status) => {
  const norm = status ? status.toLowerCase() : "pending";
  const variants = {
    "paid": { label: "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    "pending": { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-100" },
  };
  const config = variants[norm] || variants.pending;
  return <Badge className={`uppercase text-[9px] font-black tracking-widest ${config.className}`}>{config.label}</Badge>;
};

const ClientInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState({ url: '', title: '', fileName: '' });

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/invoices', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = response.data.data || response.data || [];
            setInvoices(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (id, number) => {
        try {
            const resp = await axios.get(`/api/invoices/${id}/print`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `facture-${number}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) { alert("Erreur lors du téléchargement."); }
    };

    const handleView = async (inv) => {
        try {
            const resp = await axios.get(`/api/invoices/${inv.id}/print`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob'
            });
            const file = new Blob([resp.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            
            setPreviewData({
                url: fileURL,
                title: `Invoice #${inv.invoice_number}`,
                fileName: `invoice-${inv.invoice_number}.pdf`
            });
            setIsPreviewOpen(true);
        } catch (err) {
            alert("Error opening the file.");
        }
    };

    const filteredInvoices = invoices.filter(inv => 
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: invoices.length,
        settled: invoices.filter(inv => inv.status === 'paid').length,
        pending: invoices.filter(inv => inv.status !== 'paid').length,
        totalAmount: invoices.reduce((acc, inv) => acc + (parseFloat(inv.total) || 0), 0)
    };

    return (
        <div className="space-y-6 text-left pb-10">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700;900&display=swap');
            `}</style>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900" style={{ fontFamily: "'Inter', serif", color: '#0f172a' }}>My Invoices</h1>
                    <p className="text-xs font-black uppercase tracking-widest mt-1" style={{ color: '#64748b', fontFamily: "'Inter', sans-serif" }}>History of your documents and payments</p>
                </div>
            </div>

            {/* Premium Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 border shadow-sm rounded-3xl" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f8fafc', color: '#3b82f6' }}>
                           <FileText className="size-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Invoices</p>
                           <p className="text-2xl font-black" style={{ color: '#0f172a' }}>{stats.total}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border shadow-sm rounded-3xl" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl flex items-center justify-center text-emerald-600 bg-emerald-50">
                           <CheckCircle className="size-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Total Revenue</p>
                           <p className="text-2xl font-black" style={{ color: '#0f172a' }}>{stats.totalAmount.toFixed(0)} <span className="text-xs font-bold" style={{ color: '#64748b' }}>TND</span></p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border shadow-sm rounded-3xl" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl flex items-center justify-center text-amber-600 bg-amber-50">
                           <Clock className="size-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Pending</p>
                           <p className="text-2xl font-black" style={{ color: '#0f172a' }}>{stats.pending}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border shadow-sm rounded-3xl" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl flex items-center justify-center text-indigo-600 bg-indigo-50">
                           <CheckCircle className="size-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Settled</p>
                           <p className="text-2xl font-black" style={{ color: '#0f172a' }}>{stats.settled}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search Tools */}
            <Card className="p-4 border shadow-sm rounded-3xl" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder="Search by invoice number..."
                            className="bg-slate-50 border-none rounded-2xl h-12 pl-12 pr-6 outline-none transition-all font-medium"
                            style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="gap-2 h-12 rounded-2xl px-6 border font-bold transition-all" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                        <Filter className="size-4" />
                        Filter
                    </Button>
                </div>
            </Card>

            {/* Clean Table with New Design */}
            <Card className="border shadow-sm overflow-hidden rounded-[2.5rem]" style={{ borderColor: '#e2e8f0' }}>
                <Table>
                    <TableHeader>
                        <TableRow style={{ backgroundColor: '#f8fafc' }}>
                            <TableHead className="px-8 py-6 font-black text-[10px] uppercase tracking-widest" style={{ color: '#64748b' }}>Invoice No.</TableHead>
                            <TableHead className="px-8 py-6 font-black text-[10px] uppercase tracking-widest" style={{ color: '#64748b' }}>Issue Date</TableHead>
                            <TableHead className="px-8 py-6 font-black text-[10px] uppercase tracking-widest" style={{ color: '#64748b' }}>Amount</TableHead>
                            <TableHead className="px-8 py-6 font-black text-[10px] uppercase tracking-widest" style={{ color: '#64748b' }}>Status</TableHead>
                            <TableHead className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-right" style={{ color: '#64748b' }}>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence>
                            {loading && invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="animate-spin size-10" style={{ color: '#3b82f6' }} />
                                            <span className="font-bold uppercase text-[10px] tracking-widest animate-pulse" style={{ color: '#64748b' }}>Syncing...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <div className="bg-slate-50 inline-flex p-6 rounded-full mb-4">
                                            <FileText className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="text-sm font-black uppercase tracking-widest italic" style={{ color: '#64748b' }}>No invoices found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <motion.tr 
                                        key={inv.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="transition-all group hover:bg-slate-50"
                                    >
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-lg" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                                                    INV
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-black text-sm" style={{ color: '#0f172a' }}>{inv.invoice_number}</p>
                                                        {inv.type === 'shipping' ? (
                                                            <Badge className="bg-purple-50 text-purple-600 border-purple-100 text-[8px] px-1 py-0 uppercase">Frais de port</Badge>
                                                        ) : (
                                                            <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[8px] px-1 py-0 uppercase">Destinataire</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: '#64748b' }}>Digital Invoice</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-2 font-bold text-xs" style={{ color: '#475569' }}>
                                                <Calendar className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
                                                {new Date(inv.invoice_date || inv.created_at).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6 font-black text-sm" style={{ color: '#0f172a' }}>
                                            {inv.total} <span className="text-[10px] ml-1" style={{ color: '#64748b' }}>TND</span>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            {getStatusBadge(inv.status)}
                                        </TableCell>
                                        <TableCell className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-10 h-10 rounded-xl transition-all shadow-lg text-white"
                                                    onClick={() => handleView(inv)}
                                                    title="View invoice"
                                                    style={{ backgroundColor: '#0f172a' }}
                                                >
                                                    <Eye className="size-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-10 h-10 rounded-xl transition-all shadow-sm"
                                                    onClick={() => handleDownload(inv.id, inv.invoice_number)}
                                                    title="Download"
                                                    style={{ backgroundColor: '#f8fafc', color: '#475569' }}
                                                >
                                                    <Download className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </Card>

            <DocumentPreviewModal 
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title={previewData.title}
                fileUrl={previewData.url}
                fileName={previewData.fileName}
            />
        </div>
    );
};

export default ClientInvoices;
