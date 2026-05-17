import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search, Eye, Calendar,
    MapPin, Download,
    ClipboardCheck, Truck,
    Loader2, CheckCircle, X,
    User, Phone, Building2, Package
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const getStatusBadge = (status) => {
    const norm = status ? status.toLowerCase() : "pending";
    const configs = {
        pending:    { label: 'Pending',    color: 'bg-amber-50 text-amber-700 border-amber-100' },
        confirmed:  { label: 'Confirmed',  color: 'bg-blue-50 text-blue-700 border-blue-100' },
        picked_up:  { label: 'Picked Up',  color: 'bg-sky-50 text-sky-700 border-sky-100' },
        in_transit: { label: 'In Transit', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
        delivered:  { label: 'Delivered',  color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        failed:     { label: 'Failed',     color: 'bg-red-50 text-red-700 border-red-100' },
        cancelled:  { label: 'Cancelled',  color: 'bg-slate-50 text-slate-700 border-slate-100' },
    };
    const config = configs[norm] || { label: status, color: 'bg-slate-50 text-slate-700 border-slate-100' };
    return <Badge className={`uppercase text-[9px] font-black tracking-widest border ${config.color}`}>{config.label}</Badge>;
};

const fmt = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const DeliverySlipManagement = ({ role }) => {
    const [loading, setLoading] = useState(true);
    const [deliveries, setDeliveries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Detail modal state
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(false);

    const userRole = role || localStorage.getItem('role') || 'client';

    useEffect(() => {
        fetchDeliveries();
    }, [userRole]);

    const fetchDeliveries = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const endpoint = userRole === 'admin' ? '/api/admin/deliveries' : '/api/deliveries';
            const response = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            const data = response.data.data || response.data || [];
            setDeliveries(Array.isArray(data) ? data : (data.data || []));
        } catch (err) {
            console.error("Error loading delivery slips", err);
        } finally {
            setLoading(false);
        }
    };

    // Eye button: fetch full delivery details and open modal
    const handleView = async (delivery) => {
        setDetailOpen(true);
        setSelectedDelivery(null);
        setDetailError(false);
        setDetailLoading(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = userRole === 'admin'
                ? `/api/admin/deliveries/${delivery.id}`
                : `/api/deliveries/${delivery.id}`;
            const response = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            setSelectedDelivery(response.data);
        } catch (err) {
            console.error("Error loading delivery details", err);
            setDetailError(true);
        } finally {
            setDetailLoading(false);
        }
    };

    // Download button: download delivery form PDF
    const handleDownload = async (id, number) => {
        try {
            const token = localStorage.getItem('token');
            const endpoint = userRole === 'admin'
                ? `/api/admin/deliveries/${id}/print`
                : `/api/deliveries/${id}/print`;
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `DS-${number}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Error downloading delivery slip.");
        }
    };

    const filteredDeliveries = deliveries.filter(d => {
        const matchesSearch =
            d.delivery_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.client?.company_name && d.client.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.client_name && d.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.dest_city && d.dest_city.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total:     deliveries.length,
        inTransit: deliveries.filter(d => ['in_transit', 'picked_up'].includes(d.status)).length,
        delivered: deliveries.filter(d => d.status === 'delivered').length,
        pending:   deliveries.filter(d => ['pending', 'confirmed'].includes(d.status)).length,
    };

    return (
        <div className="space-y-6 text-left pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">
                        {userRole === 'admin' ? 'Delivery Slips' : 'My Slips'}
                    </h1>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                        {userRole === 'admin' ? 'Logistics and transport document management' : 'Your transport documents and package tracking'}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Slips',  value: stats.total,     icon: <ClipboardCheck className="size-6" />, bg: 'bg-blue-50',    ic: 'text-blue-600' },
                    { label: 'Delivered',    value: stats.delivered, icon: <CheckCircle className="size-6" />,    bg: 'bg-emerald-50', ic: 'text-emerald-600' },
                    { label: 'In Transit',   value: stats.inTransit, icon: <Truck className="size-6" />,          bg: 'bg-amber-50',   ic: 'text-amber-600' },
                    { label: 'To Confirm',   value: stats.pending,   icon: <Calendar className="size-6" />,       bg: 'bg-slate-50',   ic: 'text-slate-400' },
                ].map(s => (
                    <Card key={s.label} className="p-6 border-slate-100 shadow-sm rounded-3xl bg-white">
                        <div className="flex items-center gap-4">
                            <div className={`size-12 ${s.bg} rounded-2xl flex items-center justify-center ${s.ic}`}>{s.icon}</div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="p-4 border-slate-100 shadow-sm rounded-3xl bg-white">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder="Search by slip ID, client or city..."
                            className="bg-slate-50 border-none rounded-2xl h-12 pl-12 pr-6 outline-none font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] h-12 rounded-2xl border-slate-200 font-bold uppercase text-[10px] tracking-widest">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="picked_up">Picked Up</SelectItem>
                            <SelectItem value="in_transit">In Transit</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Table */}
            <Card className="border-slate-100 shadow-sm overflow-hidden rounded-[2.5rem] bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Slip No.</TableHead>
                            <TableHead className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Client</TableHead>
                            <TableHead className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Destination</TableHead>
                            <TableHead className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Status</TableHead>
                            <TableHead className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence>
                            {loading && deliveries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="animate-spin size-10 text-blue-600" />
                                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Loading slips...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredDeliveries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <div className="bg-slate-50 inline-flex p-6 rounded-full mb-4">
                                            <ClipboardCheck className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">No slips found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDeliveries.map((delivery) => (
                                    <motion.tr
                                        key={delivery.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-slate-50/80 transition-all group"
                                    >
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg">DS</div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm">#{delivery.delivery_number}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {delivery.created_at ? new Date(delivery.created_at).toLocaleDateString('en-GB') : '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">
                                                    {delivery.client?.company_name || delivery.client_name || 'Direct Client'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {delivery.client?.user?.first_name} {delivery.client?.user?.last_name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="size-3.5 text-red-500" />
                                                <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{delivery.dest_city || '—'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            {getStatusBadge(delivery.status)}
                                        </TableCell>
                                        <TableCell className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-10 h-10 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg"
                                                    onClick={() => handleView(delivery)}
                                                    title="View Details"
                                                >
                                                    <Eye className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-sm"
                                                    onClick={() => handleDownload(delivery.id, delivery.delivery_number)}
                                                    title="Download Delivery Slip (PDF)"
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

            {/* ── Delivery Detail Modal ── */}
            <AnimatePresence>
                {detailOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setDetailOpen(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">
                                        Delivery #{selectedDelivery?.delivery_number || '…'}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        {selectedDelivery && getStatusBadge(selectedDelivery.status)}
                                        {selectedDelivery?.created_at && (
                                            <span className="text-xs text-slate-400">{fmt(selectedDelivery.created_at)}</span>
                                        )}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setDetailOpen(false)} className="rounded-xl">
                                    <X className="size-4" />
                                </Button>
                            </div>

                            {detailLoading ? (
                                <div className="flex items-center justify-center py-24">
                                    <Loader2 className="animate-spin size-10 text-blue-600" />
                                </div>
                            ) : detailError ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center">
                                        <X className="size-8 text-red-400" />
                                    </div>
                                    <p className="text-sm font-black text-slate-700">Failed to load delivery details.</p>
                                    <p className="text-xs text-slate-400 font-medium">Check your connection or try again.</p>
                                    <Button variant="outline" onClick={() => setDetailOpen(false)} className="rounded-xl mt-2">
                                        Close
                                    </Button>
                                </div>
                            ) : selectedDelivery && (
                                <div className="p-6 space-y-6">

                                    {/* Client Info */}
                                    <section>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Client</p>
                                        <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="size-4 text-slate-400 flex-shrink-0" />
                                                <span className="font-bold">{selectedDelivery.client?.company_name || selectedDelivery.client_name || 'Direct Client'}</span>
                                            </div>
                                            {(selectedDelivery.client?.user?.first_name || selectedDelivery.client?.user?.last_name) && (
                                                <div className="flex items-center gap-2">
                                                    <User className="size-4 text-slate-400 flex-shrink-0" />
                                                    <span>{selectedDelivery.client.user.first_name} {selectedDelivery.client.user.last_name}</span>
                                                </div>
                                            )}
                                            {selectedDelivery.client_phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="size-4 text-slate-400 flex-shrink-0" />
                                                    <span>{selectedDelivery.client_phone}</span>
                                                </div>
                                            )}
                                            {(selectedDelivery.recipient_phone_1 || selectedDelivery.recipient_phone_2) && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="size-4 text-slate-400 flex-shrink-0" />
                                                    <span className="text-slate-500">Recipient: {selectedDelivery.recipient_phone_1}{selectedDelivery.recipient_phone_2 ? ` / ${selectedDelivery.recipient_phone_2}` : ''}</span>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Addresses */}
                                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Pickup Address</p>
                                            <div className="bg-slate-50 rounded-2xl p-4 text-sm min-h-[72px]">
                                                <p>{selectedDelivery.pickup_address_text || '—'}</p>
                                                {selectedDelivery.scheduled_pickup_time && (
                                                    <p className="text-xs text-slate-400 mt-1">Scheduled: {fmt(selectedDelivery.scheduled_pickup_time)}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Delivery Address</p>
                                            <div className="bg-slate-50 rounded-2xl p-4 text-sm min-h-[72px]">
                                                <p>{selectedDelivery.delivery_address_text || '—'}</p>
                                                {selectedDelivery.dest_city && (
                                                    <p className="text-xs text-slate-400 mt-1">{selectedDelivery.dest_city}{selectedDelivery.dest_postal_code ? ` — ${selectedDelivery.dest_postal_code}` : ''}</p>
                                                )}
                                                {selectedDelivery.scheduled_delivery_time && (
                                                    <p className="text-xs text-slate-400 mt-1">Scheduled: {fmt(selectedDelivery.scheduled_delivery_time)}</p>
                                                )}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Package Info */}
                                    {(selectedDelivery.item_description || selectedDelivery.weight || selectedDelivery.category) && (
                                        <section>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Package Info</p>
                                            <div className="bg-slate-50 rounded-2xl p-4 flex flex-wrap gap-4 text-sm">
                                                {selectedDelivery.item_description && <span><span className="text-slate-400">Description:</span> {selectedDelivery.item_description}</span>}
                                                {selectedDelivery.category && <span><span className="text-slate-400">Category:</span> {selectedDelivery.category}</span>}
                                                {selectedDelivery.weight && <span><span className="text-slate-400">Weight:</span> {selectedDelivery.weight} kg</span>}
                                                {selectedDelivery.is_fragile && <span className="text-amber-700 font-bold">⚠ Fragile</span>}
                                            </div>
                                        </section>
                                    )}

                                    {/* Assigned Driver */}
                                    {selectedDelivery.assignedStaff && (
                                        <section>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Assigned Driver</p>
                                            <div className="bg-blue-50 rounded-2xl p-4 space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <User className="size-4 text-blue-500 flex-shrink-0" />
                                                    <span className="font-bold">
                                                        {selectedDelivery.assignedStaff.user?.first_name} {selectedDelivery.assignedStaff.user?.last_name}
                                                    </span>
                                                    {selectedDelivery.assignedStaff.employee_id && (
                                                        <span className="text-xs text-slate-500 font-mono">({selectedDelivery.assignedStaff.employee_id})</span>
                                                    )}
                                                </div>
                                                {selectedDelivery.assignedStaff.user?.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="size-4 text-blue-400 flex-shrink-0" />
                                                        <span>{selectedDelivery.assignedStaff.user.phone}</span>
                                                    </div>
                                                )}
                                                {selectedDelivery.region?.name && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="size-4 text-blue-400 flex-shrink-0" />
                                                        <span>{selectedDelivery.region.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    )}

                                    {/* Items Table */}
                                    {selectedDelivery.items && selectedDelivery.items.length > 0 && (
                                        <section>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Items</p>
                                            <div className="border border-slate-100 rounded-2xl overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-bold text-slate-500 text-xs">Item</th>
                                                            <th className="px-4 py-3 text-center font-bold text-slate-500 text-xs">Qty</th>
                                                            <th className="px-4 py-3 text-right font-bold text-slate-500 text-xs">Unit Price</th>
                                                            <th className="px-4 py-3 text-right font-bold text-slate-500 text-xs">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedDelivery.items.map((item, i) => (
                                                            <tr key={i} className="border-t border-slate-100">
                                                                <td className="px-4 py-3">{item.item_name}</td>
                                                                <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                                <td className="px-4 py-3 text-right">{parseFloat(item.unit_price || 0).toFixed(3)} TND</td>
                                                                <td className="px-4 py-3 text-right font-bold">{parseFloat(item.total || 0).toFixed(3)} TND</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                    )}

                                    {/* Special Instructions */}
                                    {selectedDelivery.special_instructions && (
                                        <section>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Special Instructions</p>
                                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm">
                                                {selectedDelivery.special_instructions}
                                            </div>
                                        </section>
                                    )}

                                    {/* Status Timeline */}
                                    {selectedDelivery.statusHistories && selectedDelivery.statusHistories.length > 0 && (
                                        <section>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Status Timeline</p>
                                            <div className="space-y-3">
                                                {[...selectedDelivery.statusHistories].reverse().map((h, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {getStatusBadge(h.status)}
                                                                <span className="text-xs text-slate-400">{fmt(h.created_at)}</span>
                                                            </div>
                                                            {h.notes && <p className="text-xs text-slate-500 mt-0.5">{h.notes}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                        <Button variant="outline" onClick={() => setDetailOpen(false)} className="rounded-xl">
                                            Close
                                        </Button>
                                        <Button
                                            className="rounded-xl bg-slate-900 text-white hover:bg-blue-600"
                                            onClick={() => handleDownload(selectedDelivery.id, selectedDelivery.delivery_number)}
                                        >
                                            <Download className="size-4 mr-2" />
                                            Download Slip
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeliverySlipManagement;
