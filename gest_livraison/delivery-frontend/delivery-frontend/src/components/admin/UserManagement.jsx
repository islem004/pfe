import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Mail, Phone, MapPin, Package, Banknote,
    Calendar, Star, TrendingUp, X, Filter,
    UserCheck, UserMinus, Trash2, Building2, UserPlus,
    Lock, Loader2, Check, Hash, Pencil
} from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

// Simple Local Avatar Component since it's missing in UI folder
const Avatar = ({ children, className, style }) => (
    <div className={`rounded-full flex items-center justify-center overflow-hidden ${className}`} style={style}>
        {children}
    </div>
);

const AvatarFallback = ({ children, style }) => (
    <div className="w-full h-full flex items-center justify-center" style={style}>
        {children}
    </div>
);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailTab, setDetailTab] = useState('details');
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    company_name: '',
    phone: '',
    phone2: '',
    email: '',
    address: '',
    address2: '',
    tax_id: '',
    password: '',
    password_confirmation: ''
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    billing_address: '',
    tax_id: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setDetailTab('details');
      setActivityLogs([]);
      setPackages([]);
    }
  }, [selectedUser]);

  const fetchActivity = async (userId) => {
    try {
      setActivityLoading(true);
      const resp = await axios.get(`/api/admin/users/${userId}/activity`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setActivityLogs(resp.data.data || resp.data || []);
    } catch (err) {
      console.error('Failed to fetch activity', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchPackages = async (clientId) => {
    try {
      setPackagesLoading(true);
      const resp = await axios.get(`/api/admin/deliveries?client_id=${clientId}&per_page=50`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = resp.data;
      setPackages(data.data || data || []);
    } catch (err) {
      console.error('Failed to fetch packages', err);
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (newClient.password !== newClient.password_confirmation) {
        alert("Passwords do not match!");
        return;
    }
    try {
      setIsSubmitting(true);
      await axios.post('/api/admin/users', {
        ...newClient,
        role: 'client'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewClient({ 
        company_name: '', tax_id: '', email: '', 
        phone: '', phone2: '', 
        address: '', address2: '',
        password: '', password_confirmation: ''
      });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const allUsers = Array.isArray(response.data) ? response.data : [];
      // Filter to show only clients (not drivers/livreurs)
      const clientsOnly = allUsers.filter(user => 
        user.role === 'client' || (!user.role && user.client)
      );
      setUsers(clientsOnly);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm('Approve this account?')) return;
    try {
      await axios.post(`/api/admin/users/${userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (error) {
      alert('Error during approval.');
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('Reject this account? The user will not be able to log in.')) return;
    try {
      await axios.post(`/api/admin/users/${userId}/reject`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (error) {
      alert('Error during rejection.');
    }
  };

  const handleDisable = async (userId) => {
    if (!confirm('Disable this account?')) return;
    try {
      await axios.post(`/api/admin/users/${userId}/disable`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (error) {
      alert('Error during disable.');
    }
  };

  const handleEnable = async (userId) => {
    if (!confirm('Reactivate this account?')) return;
    try {
      await axios.post(`/api/admin/users/${userId}/enable`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (error) {
      alert('Error during reactivation.');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Permanently delete this account?')) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (error) {
      alert('Error during deletion.');
    }
  };

  const handleEditOpen = (user) => {
    setEditForm({
      company_name:    user.client?.company_name    || '',
      contact_email:   user.client?.contact_email   || user.email || '',
      contact_phone:   user.client?.contact_phone   || user.phone || '',
      billing_address: user.client?.billing_address || '',
      tax_id:          user.client?.tax_id          || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedUser?.client?.id) return;
    if (!editForm.company_name.trim()) { alert('Company name is required.'); return; }
    if (editForm.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.contact_email)) {
      alert('Invalid email format.'); return;
    }
    setEditLoading(true);
    try {
      await axios.put(`/api/admin/clients/${selectedUser.client.id}`, editForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIsEditModalOpen(false);
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating client.');
    } finally {
      setEditLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''} ${user.email || ''} ${user.client?.company_name || ''}`;
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusLabel = (status) => {
    switch (status) {
        case 'active':    return 'Active';
        case 'pending':   return 'Pending Approval';
        case 'rejected':  return 'Rejected';
        default:          return status ?? 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
        case 'active':   return { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' };
        case 'pending':  return { bg: '#fef9c3', color: '#ca8a04', border: '#fef08a' };
        case 'rejected': return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' };
        default:         return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
    }
  };


  return (
    <div className="min-h-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');

        .customers-page {
          font-family: 'Inter', sans-serif;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .customer-card {
          animation: fadeInUp 0.4s ease-out backwards;
        }
      `}</style>

      <div className="customers-page">
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-left">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black text-slate-900 tracking-tight mb-2"
            >
              Clients
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium text-slate-500"
            >
              Manage your client relations and platform access
            </motion.p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3"
          >
            <UserPlus className="size-5" />
            New Client
          </Button>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5" style={{ color: '#94a3b8' }} />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 border-2"
              style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderRadius: '16px', fontSize: '1rem' }}
            />
          </div>

          <div className="flex gap-2">
            {[
              { id: 'all',      label: 'All' },
              { id: 'active',   label: 'Active' },
              { id: 'pending',  label: 'Pending' },
              { id: 'rejected', label: 'Rejected' }
            ].map((filter) => (
              <Button
                key={filter.id}
                variant={statusFilter === filter.id ? "default" : "outline"}
                onClick={() => setStatusFilter(filter.id)}
                className="h-14 px-6"
                style={{
                  backgroundColor: statusFilter === filter.id ? '#3b82f6' : 'transparent',
                  borderColor: '#e2e8f0',
                  borderWidth: '2px',
                  borderRadius: '16px',
                  color: statusFilter === filter.id ? '#ffffff' : '#64748b',
                  fontWeight: 500,
                  transition: 'all 0.3s ease'
                }}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {loading ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-64 bg-slate-50 rounded-3xl animate-pulse border-2 border-slate-100" />
                ))}
             </div>
        ) : filteredUsers.length === 0 ? (
            <div className="p-20 text-center rounded-[3rem] border-2 border-dashed border-slate-200">
                <Package className="size-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest leading-loose">No clients found matching these criteria.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
              {filteredUsers.map((user) => {
                const statusStyle = getStatusColor(user.status);
                return (
                <div
                  key={user.id}
                  className="customer-card group cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <div
                    className="p-6 rounded-3xl transition-all duration-300 hover:shadow-2xl text-left"
                    style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0', transform: 'translateY(0)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    {/* Customer Header */}
                    <div className="flex items-start gap-4 mb-5">
                      <Avatar className="size-16 border-2" style={{ borderColor: '#e2e8f0', backgroundColor: '#f1f5f9' }}>
                        <AvatarFallback style={{ color: '#3b82f6', fontSize: '1.25rem', fontWeight: 700 }}>
                           {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl mb-1 truncate" style={{ fontWeight: 600, color: '#0f172a' }}>
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
                          <span className="size-2 rounded-full bg-blue-400"></span> 
                          ID: {user.id.toString().slice(0, 8)}
                        </p>
                      </div>

                      <Badge
                        className="capitalize"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        {getStatusLabel(user.status)}
                      </Badge>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-5 pb-5 border-b" style={{ borderColor: '#e2e8f0' }}>
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
                        <Mail className="size-4" style={{ color: '#94a3b8' }} />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
                        <Building2 className="size-4" style={{ color: '#94a3b8' }} />
                        <span className="font-bold text-slate-900">{user.client?.company_name || "Independent Client"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
                        <MapPin className="size-4" style={{ color: '#94a3b8' }} />
                        <span className="truncate">{user.client?.region?.name || user.client?.billing_address || '—'}</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Package className="size-4" style={{ color: '#94a3b8' }} />
                          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                            Packages
                          </span>
                        </div>
                        <p className="text-2xl" style={{ fontWeight: 700, color: '#0f172a' }}>
                          {user.client?.deliveries_count ?? 0}
                        </p>
                      </div>
                    </div>

                    {/* Pending approval actions */}
                    {user.status === 'pending' && (
                      <div className="flex gap-2 pt-3 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                        <Button
                          className="flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={() => handleApprove(user.id)}
                        >
                          <UserCheck className="size-3.5 mr-1.5" /> Approve
                        </Button>
                        <Button
                          className="flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => handleReject(user.id)}
                        >
                          <UserMinus className="size-3.5 mr-1.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </div>
        )}

        {/* Customer Detail Modal */}
        <AnimatePresence>
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
              onClick={() => setSelectedUser(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-10 text-left"
                style={{ backgroundColor: '#ffffff' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <Avatar className="size-20 border-3" style={{ borderColor: '#e2e8f0', backgroundColor: '#f1f5f9' }}>
                         <AvatarFallback style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 700 }}>
                           {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-3xl mb-1" style={{ fontWeight: 700, color: '#0f172a' }}>
                        {selectedUser.first_name} {selectedUser.last_name}
                      </h2>
                      <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#64748b' }}>
                        Account {getStatusLabel(selectedUser.status)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedUser(null)}
                    className="rounded-full bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    <X className="size-5" />
                  </Button>
                </div>

                {/* Actions Group for Admin */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <Button
                        variant="outline"
                        className="h-12 px-8 rounded-2xl border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-black text-[10px] uppercase tracking-widest grow"
                        onClick={() => handleEditOpen(selectedUser)}
                    >
                        <Pencil className="size-4 mr-2" /> Edit Client
                    </Button>
                    {selectedUser.status === 'pending_admin' && (
                        <Button 
                            className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-[10px] uppercase tracking-widest grow text-white"
                            onClick={() => handleApprove(selectedUser.id)}
                        >
                            <UserCheck className="size-4 mr-2" /> Approve Account
                        </Button>
                    )}
                    {selectedUser.status === 'active' && (
                        <Button 
                            variant="outline"
                            className="h-12 px-8 rounded-2xl border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 font-black text-[10px] uppercase tracking-widest grow"
                            onClick={() => handleDisable(selectedUser.id)}
                        >
                            <UserMinus className="size-4 mr-2" /> Disable Account
                        </Button>
                    )}
                    {selectedUser.status === 'rejected' && (
                        <Button 
                            variant="outline"
                            className="h-12 px-8 rounded-2xl border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-black text-[10px] uppercase tracking-widest grow"
                            onClick={() => handleEnable(selectedUser.id)}
                        >
                            <UserCheck className="size-4 mr-2" /> Reactivate Account
                        </Button>
                    )}
                    <Button 
                        variant="destructive"
                        className="h-12 px-8 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest border border-red-100 shadow-none"
                        onClick={() => handleDelete(selectedUser.id)}
                    >
                        <Trash2 className="size-4 mr-2" /> Delete
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  {['details', 'packages', 'history'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => {
                        setDetailTab(tab);
                        if (tab === 'history' && activityLogs.length === 0) fetchActivity(selectedUser.id);
                        if (tab === 'packages' && packages.length === 0) fetchPackages(selectedUser.client?.id);
                      }}
                      className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${detailTab === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      {tab === 'details' ? 'Details' : tab === 'packages' ? `Packages (${selectedUser.client?.deliveries_count ?? 0})` : 'History'}
                    </button>
                  ))}
                </div>

                {detailTab === 'history' ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {activityLoading ? (
                      <div className="flex flex-col items-center py-12">
                        <Loader2 className="size-8 animate-spin text-blue-600 mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading activity...</p>
                      </div>
                    ) : activityLogs.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No activity recorded yet.</p>
                      </div>
                    ) : activityLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className={`size-8 rounded-xl flex items-center justify-center text-white text-[9px] font-black shrink-0 ${
                          log.action === 'login' ? 'bg-blue-600' :
                          log.action === 'delivery_created' ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}>
                          {log.action === 'login' ? '→' : log.action === 'delivery_created' ? '+' : '↔'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                            {log.action === 'login' ? 'Login' : log.action === 'delivery_created' ? 'Delivery Created' : 'Status Changed'}
                          </p>
                          {log.new_values?.delivery_number && (
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">#{log.new_values.delivery_number}</p>
                          )}
                          {log.action === 'delivery_status_changed' && log.old_values?.status && (
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{log.old_values.status} → {log.new_values?.status}</p>
                          )}
                          <p className="text-[9px] text-slate-400 mt-1">{new Date(log.created_at).toLocaleString()} {log.ip_address ? `· ${log.ip_address}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : detailTab === 'packages' ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {packagesLoading ? (
                      <div className="flex flex-col items-center py-12">
                        <Loader2 className="size-8 animate-spin text-blue-600 mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading packages...</p>
                      </div>
                    ) : packages.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No packages yet.</p>
                      </div>
                    ) : packages.map((pkg, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-wider">#{pkg.delivery_number}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{pkg.dest_city || pkg.delivery_address_text || '—'}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            pkg.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                            pkg.status === 'in_transit' ? 'bg-blue-50 text-blue-600' :
                            pkg.status === 'failed' ? 'bg-red-50 text-red-600' :
                            pkg.status === 'cancelled' ? 'bg-slate-100 text-slate-400' :
                            'bg-amber-50 text-amber-600'
                          }`}>{pkg.status?.replace('_', ' ')}</span>
                          <p className="text-[9px] text-slate-400 mt-1">{new Date(pkg.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl" style={{ backgroundColor: '#f8fafc', border: '2px solid #e2e8f0' }}>
                    <h3 className="text-xl mb-4" style={{ fontWeight: 700, color: '#0f172a' }}>
                      Contact Card
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Mail className="size-5" style={{ color: '#94a3b8' }} />
                        <span className="font-bold">{selectedUser.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone className="size-5" style={{ color: '#94a3b8' }} />
                        <span className="font-bold">{selectedUser.phone || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <MapPin className="size-5" style={{ color: '#94a3b8' }} />
                        <span className="font-bold">{selectedUser.client?.region?.name || selectedUser.client?.billing_address || '—'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Calendar className="size-5" style={{ color: '#94a3b8' }} />
                        <span className="font-bold">Client since {new Date(selectedUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl" style={{ backgroundColor: '#f8fafc', border: '2px solid #e2e8f0' }}>
                    <h3 className="text-xl mb-4" style={{ fontWeight: 700, color: '#0f172a' }}>
                      Client Performance
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>
                          Total Packages
                        </p>
                        <p className="text-3xl" style={{ fontWeight: 700, color: '#0f172a' }}>
                          {selectedUser.client?.deliveries_count ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Edit Client Modal */}
        <AnimatePresence>
          {isEditModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60] backdrop-blur-sm"
              onClick={() => !editLoading && setIsEditModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg rounded-[2rem] p-8 text-left max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: '#ffffff' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Client</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(false)} className="rounded-full bg-slate-100" disabled={editLoading}>
                    <X className="size-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company Name *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        placeholder="Company name"
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white font-bold"
                        value={editForm.company_name}
                        onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="contact@company.com"
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white font-bold"
                        value={editForm.contact_email}
                        onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        placeholder="+216 XX XXX XXX"
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white font-bold"
                        value={editForm.contact_phone}
                        onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Billing Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        placeholder="Street, City, Country"
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white font-bold"
                        value={editForm.billing_address}
                        onChange={(e) => setEditForm({ ...editForm, billing_address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tax ID</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        placeholder="TAX-XXXXXXXX"
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white font-bold"
                        value={editForm.tax_id}
                        onChange={(e) => setEditForm({ ...editForm, tax_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-2xl border-slate-200 font-black text-[10px] uppercase tracking-widest"
                      onClick={() => setIsEditModalOpen(false)}
                      disabled={editLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest"
                      onClick={handleEditSave}
                      disabled={editLoading}
                    >
                      {editLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Check className="size-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Client Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg rounded-[2rem] p-6 text-left max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: '#ffffff' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Create New Client</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} className="rounded-full bg-slate-100">
                    <X className="size-5" />
                  </Button>
                </div>

                <form onSubmit={handleCreateClient} className="space-y-4">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company Name *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input 
                        required
                        autoComplete="off"
                        name="company-name-new"
                        placeholder="Ex: Tech Logistics Solutions"
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white transition-all font-bold"
                        value={newClient.company_name}
                        onChange={(e) => setNewClient({...newClient, company_name: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Phones */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone N° 1 *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input 
                          required
                          autoComplete="off"
                          name="client-phone-1-new"
                          placeholder="+216 XX XXX XXX"
                          className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white transition-all font-bold"
                          value={newClient.phone}
                          onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone N° 2 *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input 
                          required
                          autoComplete="off"
                          name="client-phone-2-new"
                          placeholder="+216 XX XXX XXX"
                          className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white transition-all font-bold"
                          value={newClient.phone2}
                          onChange={(e) => setNewClient({...newClient, phone2: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input 
                        type="email"
                        required
                        autoComplete="off"
                        name="client-email-new"
                        placeholder="contact@company.tn"
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white transition-all font-bold"
                        value={newClient.email}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Main Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input 
                          required
                          autoComplete="off"
                          name="main-address-new"
                          placeholder="Street number, neighborhood, city"
                          className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white transition-all font-bold"
                          value={newClient.address}
                          onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secondary Address (Optional)</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input 
                          autoComplete="off"
                          name="secondary-address-new"
                          placeholder="Warehouse, branch..."
                          className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white transition-all font-bold"
                          value={newClient.address2}
                          onChange={(e) => setNewClient({...newClient, address2: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tax ID */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tax ID / NIF *</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input 
                        required
                        placeholder="Tax ID / CR / Commercial Register"
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white transition-all font-bold"
                        value={newClient.tax_id}
                        onChange={(e) => setNewClient({...newClient, tax_id: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input 
                          type="password"
                          required
                          autoComplete="new-password"
                          name="client-password-new"
                          placeholder="••••••••"
                          className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white transition-all font-bold"
                          value={newClient.password}
                          onChange={(e) => setNewClient({...newClient, password: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input 
                          type="password"
                          required
                          autoComplete="new-password"
                          name="client-confirm-new"
                          placeholder="••••••••"
                          className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 pl-10 focus:bg-white transition-all font-bold"
                          value={newClient.password_confirmation}
                          onChange={(e) => setNewClient({...newClient, password_confirmation: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all mt-4 flex items-center justify-center gap-3 shadow-xl"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin size-5" /> : <Check className="size-5" />}
                    {isSubmitting ? 'Creating Account...' : 'Create Client Account'}
                  </Button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default UserManagement;
