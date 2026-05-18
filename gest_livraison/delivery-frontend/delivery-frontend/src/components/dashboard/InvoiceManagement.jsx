import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import axios from "axios";
import {
  Search,
  Download,
  Eye,
  Banknote,
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  Inbox,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowRight,
  Star,
  Trash2,
  AlertTriangle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { motion, AnimatePresence } from "framer-motion";
import DocumentPreviewModal from "../layout/DocumentPreviewModal";
import RatingModal from "./RatingModal";

const getStatusBadge = (status) => {
  const norm = status ? status.toLowerCase() : "pending";
  const variants = {
    "paid": { label: "Settled", className: "bg-emerald-50 text-emerald-700 border-emerald-100 ring-4 ring-emerald-500/5" },
    "pending": { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-100 ring-4 ring-amber-500/5" },
    "overdue": { label: "Overdue", className: "bg-rose-50 text-rose-700 border-rose-100 ring-4 ring-rose-500/5" },
  };
  
  const config = variants[norm] || variants.pending;
  return (
    <Badge className={`px-4 py-1.5 rounded-full uppercase text-[9px] font-black tracking-[0.15em] border transition-all ${config.className}`}>
      {config.label}
    </Badge>
  );
};

export default function InvoiceManagement({ role = "admin" }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [previewData, setPreviewData] = useState({ url: '', title: '', fileName: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [role]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      if (role === 'admin') {
        await axios.post('/api/admin/invoices/generate-missing', {}, { headers }).catch(() => {});
      }
      const endpoint = role === 'admin' ? '/api/admin/invoices' : '/api/invoices';
      const response = await axios.get(endpoint, { headers });
      const data = response.data.data || response.data || [];
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      const resp = await axios.get(`/api/invoices/${invoice.id}/print`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      const file = new Blob([resp.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      setPreviewData({ 
        url: fileURL, 
        title: `Invoice #${invoice.invoice_number}`, 
        fileName: `invoice-${invoice.invoice_number}.pdf` 
      });
      setIsPreviewOpen(true);
    } catch (err) {
      alert("Error opening the document.");
    }
  };

  const handleDownload = async (invoice) => {
    try {
      const resp = await axios.get(`/api/invoices/${invoice.id}/print`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { alert("Error downloading."); }
  };

  const openRating = (delivery) => {
    setSelectedDelivery(delivery);
    setIsRatingOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/admin/invoices/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInvoices(prev => prev.filter(inv => inv.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Failed to delete invoice.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      !searchTerm ||
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.delivery?.delivery_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0),
    pending: invoices.filter(i => i.status === 'pending').length,
    paid: invoices.filter(i => i.status === 'paid').length
  };

  const pageTitle = "Invoices";
  const pageDesc = "All delivery invoices in one place.";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-6" />
            <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 font-inter">Synchronizing Financial Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 text-left pb-20 font-inter max-w-7xl mx-auto">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;800&family=Inter:wght@400;600;900&display=swap');
        .font-crimson { font-family: 'Crimson Pro', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="size-8 rounded-xl bg-blue-600/10 flex items-center justify-center">
                <Banknote className="size-4 text-blue-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Financial Ledger</span>
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{pageTitle}</h1>
          <p className="text-sm font-medium text-slate-500">{pageDesc}</p>
        </div>
        <div className="flex gap-4">
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={FileText} label="Total Count" value={stats.total} color="blue" subtitle="Documents Generated" />
        <StatCard icon={TrendingUp} label="Total Volume" value={`${stats.totalAmount.toLocaleString()} TND`} color="indigo" subtitle="Financial Flow" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="amber" subtitle="Awaiting Settlement" />
        <StatCard icon={CheckCircle} label="Settled" value={stats.paid} color="emerald" subtitle="Cleared Funds" />
      </div>

      {/* Search & Filters */}
      <Card className="p-2 border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-white/80 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 transition-colors group-focus-within:text-blue-600" />
            <input
              type="text"
              placeholder="Filter by ID, Client, or Order Number..."
              className="pl-16 pr-8 py-6 w-full bg-slate-50/50 border-transparent rounded-[1.8rem] text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Table Section */}
      <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden rounded-[3.5rem] bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none bg-slate-50/50">
                <TableHead className="px-12 py-10 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Invoice Ref</TableHead>
                <TableHead className="px-12 py-10 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Merchant/Client</TableHead>
                <TableHead className="px-12 py-10 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Order Ref</TableHead>
                <TableHead className="px-12 py-10 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Total Amount</TableHead>
                <TableHead className="px-12 py-10 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right pr-12">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="border-none">
              <AnimatePresence>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice, index) => (
                    <motion.tr 
                      key={invoice.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-all"
                    >
                      <TableCell className="px-12 py-8">
                          <div className="flex items-center gap-4">
                              <div className="size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-[10px] shadow-lg group-hover:scale-110 transition-transform">INV</div>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 text-sm tracking-tight">{invoice.invoice_number}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1">
                                    <Calendar className="size-2.5" /> {new Date(invoice.created_at).toLocaleDateString()}
                                </span>
                              </div>
                          </div>
                      </TableCell>
                      <TableCell className="px-12 py-8">
                          <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-xs uppercase tracking-tight">
                                {role === 'admin' ? (invoice.client?.company_name || 'Individual') : 'My Account'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold mt-0.5">{invoice.client?.user?.email || 'System Generated'}</span>
                          </div>
                      </TableCell>
                      <TableCell className="px-12 py-8">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-all">
                            <span className="font-black text-slate-900 text-[10px]">#{invoice.delivery?.delivery_number || '---'}</span>
                            <ArrowRight className="size-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                      </TableCell>
                      <TableCell className="px-12 py-8">
                        <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-base tabular-nums">{parseFloat(invoice.total).toFixed(3)}</span>
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-0.5">TND</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-12 py-8 text-right pr-12">
                        <div className="flex gap-3 justify-end">
                          {role === 'client' && invoice.delivery?.status === 'delivered' && !invoice.delivery?.rating && (
                            <button 
                                onClick={() => openRating(invoice.delivery)}
                                className="size-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center hover:bg-amber-500 hover:text-white hover:shadow-xl hover:shadow-amber-200 transition-all" 
                                title="Rate Delivery"
                            >
                                <Star className="size-5" />
                            </button>
                          )}
                          {invoice.delivery?.rating && (
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                                <Star className="size-3 fill-amber-500 text-amber-500" />
                                <span className="text-xs font-black text-amber-600">{invoice.delivery.rating}</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="size-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white hover:shadow-xl hover:shadow-blue-200 transition-all"
                            title="Preview"
                          >
                            <Eye className="size-5" />
                          </button>
                          {role === 'admin' && (
                            <button
                              onClick={() => setDeleteTarget(invoice)}
                              className="size-12 bg-rose-50 text-rose-400 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white hover:shadow-xl hover:shadow-rose-200 transition-all"
                              title="Delete Invoice"
                            >
                              <Trash2 className="size-5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="5" className="p-32 text-center">
                        <div className="relative inline-block mb-8">
                            <Inbox className="size-20 text-slate-100" />
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-4 -right-4"
                            >
                                <Sparkles className="size-10 text-amber-100" />
                            </motion.div>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-2">No Records Found</h4>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Try adjusting your filters or search term</p>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </Card>

      <DocumentPreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={previewData.title}
        fileUrl={previewData.url}
        fileName={previewData.fileName}
      />

      <RatingModal
        open={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
        delivery={selectedDelivery}
        onRated={() => {
            fetchInvoices();
        }}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => !deleteLoading && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl p-10 max-w-md w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="size-16 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="size-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Delete Invoice?</h3>
                <p className="text-sm font-medium text-slate-500">
                  Invoice <span className="font-black text-slate-800">#{deleteTarget.invoice_number}</span> will be permanently removed. This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleteLoading}
                    className="flex-1 py-4 rounded-2xl bg-slate-100 font-black text-slate-600 hover:bg-slate-200 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleteLoading}
                    className="flex-1 py-4 rounded-2xl bg-rose-600 font-black text-white hover:bg-rose-700 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {deleteLoading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, color, subtitle }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100 ring-blue-500/10',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 ring-indigo-500/10',
        amber: 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/10',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/10'
    };

    return (
        <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            className="group"
        >
            <Card className="px-10 py-12 border-none shadow-xl shadow-slate-200/40 rounded-[3rem] bg-white relative overflow-hidden transition-all group-hover:shadow-3xl group-hover:shadow-slate-200">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <Icon className="size-32 rotate-12" />
                </div>
                <div className={`p-5 rounded-[1.8rem] w-fit mb-8 border-2 ring-8 ${colors[color]}`}>
                    <Icon className="size-6" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">{label}</p>
                <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{value}</h4>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                    <span className={`w-1 h-1 rounded-full ${colors[color].split(' ')[1]}`}></span>
                    {subtitle}
                </p>
            </Card>
        </motion.div>
    );
};
