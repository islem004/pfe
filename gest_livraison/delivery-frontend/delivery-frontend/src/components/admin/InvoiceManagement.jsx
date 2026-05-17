import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Eye,
  Send,
  Banknote,
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  Calendar
} from "lucide-react";
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
    "overdue": { label: "Overdue", className: "bg-red-50 text-red-700 border-red-100" },
    "generated": { label: "Generated", className: "bg-blue-50 text-blue-700 border-blue-100" },
  };
  
  const config = variants[norm] || variants.pending;
  return <Badge className={`uppercase text-[9px] font-black tracking-widest ${config.className}`}>{config.label}</Badge>;
};

export default function InvoiceManagement(props) {
  const { role } = props;
  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState({ url: '', title: '', fileName: '' });
  
  const userRole = role || localStorage.getItem('role') || 'client';

  useEffect(() => {
    fetchData();
  }, [userRole, props.type]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (userRole === 'admin') {
        const res = await axios.get('/api/admin/invoices', { headers });
        const invoices = res.data.data || res.data || [];

        const delRes = await axios.get('/api/admin/deliveries', { headers });
        const deliveries = delRes.data.data || delRes.data || [];

        const missing = deliveries.filter(d => d.status === 'confirmed');
        if (missing.length > 0) {
            autoGenerateMissing(missing, headers);
        }

        const normalized = invoices.map(inv => ({
          id: inv.invoice_number || inv.id,
          real_id: inv.id,
          customer: inv.client ? (inv.client.company_name || `${inv.client.user?.first_name || ''} ${inv.client.user?.last_name || ''}`) : "Client",
          deliveryId: inv.delivery?.delivery_number || inv.delivery?.tracking_code || '---',
          base_fee: inv.base_fee || 0,
          trajet_fee: inv.trajet_fee || 0,
          weight_fee: inv.weight_fee || 0,
          fragile_amount: inv.fragile_amount || 0,
          subtotal: inv.delivery_fee_subtotal || inv.subtotal || 0,
          tva: inv.tva_amount || 0,
          amount: inv.total || 0,
          date: inv.invoice_date || inv.created_at,
          status: inv.status || 'generated',
          isGenerated: true,
          raw: inv
        }));
        setDataList(normalized);

      } else {
        const res = await axios.get('/api/invoices', { headers });
        const data = res.data.data || res.data || [];

        const items = Array.isArray(data) ? data : (data.data || []);
        const normalized = items.map(inv => ({
          id: inv.invoice_number || inv.id,
          real_id: inv.id,
          customer: "You",
          deliveryId: inv.delivery?.delivery_number || inv.delivery?.tracking_code || '---',
          base_fee: inv.base_fee || 0,
          trajet_fee: inv.trajet_fee || 0,
          weight_fee: inv.weight_fee || 0,
          fragile_amount: inv.fragile_amount || 0,
          subtotal: inv.delivery_fee_subtotal || inv.subtotal || 0,
          tva: inv.tva_amount || 0,
          amount: inv.total || 0,
          date: inv.invoice_date || inv.created_at,
          status: inv.status || 'paid',
          isGenerated: true,
          raw: inv
        }));
        setDataList(normalized);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateMissing = async (missing, headers) => {
    try {
        for (const d of missing) {
            await axios.post('/api/admin/invoices/generate', { delivery_id: d.id }, { headers });
        }
        fetchData();
    } catch (err) {
        console.error("Silent auto-generation failed:", err);
    }
  };

  // ACTIONS: Re-implementing the "Old Version" robust actions
  const handleDownload = async (real_id, inv_num) => {
    if (!real_id) return;
    try {
        const resp = await axios.get(`/api/invoices/${real_id}/print`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([resp.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${inv_num}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) { alert("Error during download."); }
  };

  const handleView = async (real_id, inv_num) => {
    if (!real_id) return;
    try {
        const resp = await axios.get(`/api/invoices/${real_id}/print`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            responseType: 'blob'
        });
        const file = new Blob([resp.data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        
        setPreviewData({
            url: fileURL,
            title: `Invoice #${inv_num}`,
            fileName: `invoice-${inv_num}.pdf`
        });
        setIsPreviewOpen(true);
    } catch (err) { alert("Error opening the file."); }
  };

  const filteredData = dataList.filter(inv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (inv.id && inv.id.toString().toLowerCase().includes(q)) ||
      (inv.customer && inv.customer.toLowerCase().includes(q)) ||
      (inv.deliveryId && inv.deliveryId.toString().toLowerCase().includes(q))
    );
  });

  const totals = {
    all: dataList.length,
    generated: dataList.filter(d => d.isGenerated).length,
    pending: dataList.filter(d => !d.isGenerated).length,
    amount: dataList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
  };

  return (
    <div className="space-y-6 text-left pb-10">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700;900&display=swap');
        `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Invoicing</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your financial documents in real time</p>
        </div>
      </div>

      {/* Stats Section with New Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border shadow-sm rounded-3xl" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f8fafc', color: '#3b82f6' }}>
              <FileText className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Documents</p>
              <p className="text-2xl font-black" style={{ color: '#0f172a' }}>{totals.all}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border shadow-sm rounded-3xl" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl flex items-center justify-center text-emerald-600 bg-emerald-50">
              <CheckCircle className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Total Amount</p>
              <p className="text-2xl font-black" style={{ color: '#0f172a' }}>{totals.amount.toFixed(0)} <span className="text-xs font-bold" style={{ color: '#64748b' }}>TND</span></p>
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
              <p className="text-2xl font-black" style={{ color: '#0f172a' }}>{totals.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border shadow-sm rounded-3xl" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl flex items-center justify-center text-indigo-600 bg-indigo-50">
              <Plus className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Generated</p>
              <p className="text-2xl font-black" style={{ color: '#0f172a' }}>{totals.generated}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Card */}
      <Card className="p-4 border shadow-sm rounded-3xl" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input 
              placeholder="Search by Invoice ID, Client, or Package..." 
              className="pl-12 w-full h-12 border-none rounded-2xl font-medium outline-none" 
              style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 h-12 rounded-2xl px-6 border hover:bg-slate-50 font-bold transition-all" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
            <Filter className="size-4" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Main Table with New Premium Design */}
      <Card className="border shadow-sm overflow-hidden rounded-[2.5rem]" style={{ borderColor: '#e2e8f0' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: '#f8fafc' }}>
              <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest" style={{ color: '#64748b' }}>Invoice ID</TableHead>
              {userRole === 'admin' && <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest" style={{ color: '#64748b' }}>Client</TableHead>}
              <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest" style={{ color: '#64748b' }}>Delivery</TableHead>
              <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest text-right" style={{ color: '#64748b' }}>Base</TableHead>
              <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest text-right" style={{ color: '#64748b' }}>Distance</TableHead>
              <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest text-right" style={{ color: '#64748b' }}>Weight</TableHead>
              <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest text-right" style={{ color: '#64748b' }}>Fragile</TableHead>
              <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest text-right" style={{ color: '#64748b' }}>Subtotal</TableHead>
              <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest text-right" style={{ color: '#64748b' }}>TVA (19%)</TableHead>
              <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest text-right" style={{ color: '#64748b' }}>Total</TableHead>
              <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest" style={{ color: '#64748b' }}>Date</TableHead>
              <TableHead className="px-6 py-6 font-black text-[10px] uppercase tracking-widest text-right" style={{ color: '#64748b' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin size-10" style={{ color: '#3b82f6' }} />
                    <span className="font-bold uppercase text-[10px] tracking-widest animate-pulse" style={{ color: '#64748b' }}>Loading in progress...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-20 font-bold uppercase text-[10px] tracking-widest italic" style={{ color: '#64748b' }}>
                  No document found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((invoice, index) => (
                <TableRow key={index} className="transition-colors group hover:bg-slate-50">
                  <TableCell className="px-6 py-5 font-black text-sm" style={{ color: '#3b82f6' }}>#{invoice.id}</TableCell>
                  {userRole === 'admin' && (
                    <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-2">
                             <Users className="size-4" style={{ color: '#64748b' }} />
                             <span className="font-bold text-sm" style={{ color: '#0f172a' }}>{invoice.customer}</span>
                        </div>
                    </TableCell>
                  )}
                  <TableCell className="px-6 py-5">
                      <span className="text-xs font-black text-slate-700">#{invoice.deliveryId}</span>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right text-xs font-semibold" style={{ color: '#475569' }}>
                    {parseFloat(invoice.base_fee).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right text-xs font-semibold" style={{ color: '#475569' }}>
                    {parseFloat(invoice.trajet_fee).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right text-xs font-semibold" style={{ color: '#475569' }}>
                    {parseFloat(invoice.weight_fee).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right text-xs font-semibold" style={{ color: parseFloat(invoice.fragile_amount) > 0 ? '#d97706' : '#94a3b8' }}>
                    {parseFloat(invoice.fragile_amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right text-xs font-bold" style={{ color: '#334155' }}>
                    {parseFloat(invoice.subtotal).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right text-xs font-semibold" style={{ color: '#64748b' }}>
                    {parseFloat(invoice.tva).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right font-black text-sm" style={{ color: '#0f172a' }}>
                    {parseFloat(invoice.amount).toFixed(2)} <span className="text-[10px]" style={{ color: '#64748b' }}>TND</span>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2 font-bold text-xs" style={{ color: '#475569' }}>
                           <Calendar className="size-3" style={{ color: '#3b82f6' }} />
                           {new Date(invoice.date).toLocaleDateString()}
                      </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    {invoice.isGenerated ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 rounded-xl transition-all shadow-sm flex items-center justify-center font-bold"
                          style={{ backgroundColor: '#f8fafc', color: '#475569' }}
                          onClick={() => handleView(invoice.real_id, invoice.id)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 rounded-xl transition-all shadow-sm flex items-center justify-center font-bold"
                          style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                          onClick={() => handleDownload(invoice.real_id, invoice.id)}
                        >
                          <Download className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 border-dashed">
                        <AlertCircle className="size-3" /> Pending
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Robust Preview Modal from the Old version */}
      <DocumentPreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={previewData.title}
        fileUrl={previewData.url}
        fileName={previewData.fileName}
      />
    </div>
  );
}
