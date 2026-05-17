import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, Mail, Phone, MapPin, Package, Calendar, 
    Truck, X, Filter, Edit2, Trash2, CheckCircle2,
    Briefcase, Lock, Loader2, Check, UserMinus, UserCheck,
    Building2
} from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

// Local Avatar Component implementation
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

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [detailedStaff, setDetailedStaff] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', address: '', region_id: '', off_days: [] });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [staffDetailTab, setStaffDetailTab] = useState('details');
  const [staffActivityLogs, setStaffActivityLogs] = useState([]);
  const [staffActivityLoading, setStaffActivityLoading] = useState(false);

  const fetchStaffActivity = async (userId) => {
    try {
      setStaffActivityLoading(true);
      const resp = await axios.get(`/api/admin/users/${userId}/activity`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStaffActivityLogs(resp.data.data || resp.data || []);
    } catch (err) {
      console.error('Failed to fetch staff activity', err);
    } finally {
      setStaffActivityLoading(false);
    }
  };

  const fetchStaffDetails = async (staff) => {
    setStaffDetailTab('details');
    setStaffActivityLogs([]);
    setSelectedStaff(staff);
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/staff/${staff.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDetailedStaff(response.data);
    } catch (error) {
      console.error("Error fetching staff details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const [newDriver, setNewDriver] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    address: '',
    region_id: '',
    off_days: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const toggleOffDay = (day) => {
    setNewDriver(prev => ({
        ...prev,
        off_days: prev.off_days.includes(day) 
            ? prev.off_days.filter(d => d !== day) 
            : [...prev.off_days, day]
    }));
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    if (newDriver.password !== newDriver.password_confirmation) {
        alert("Passwords do not match");
        return;
    }
    try {
      setIsSubmitting(true);
      await axios.post('/api/admin/users', {
        ...newDriver,
        role: 'staff'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIsCreateModalOpen(false);
      setNewDriver({ 
        first_name: '', last_name: '', email: '', password: '', 
        password_confirmation: '', phone: '', address: '', 
        region_id: '', off_days: [] 
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setEditForm({
      first_name: staff.user?.first_name || '',
      last_name: staff.user?.last_name || '',
      phone: staff.user?.phone || '',
      address: staff.user?.address || '',
      region_id: staff.region_id || '',
      off_days: staff.off_days || [],
    });
    setIsEditModalOpen(true);
  };

  const handleEditDriver = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      setIsEditSubmitting(true);
      await axios.put(`/api/admin/staff/${editingStaff.id}`, editForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIsEditModalOpen(false);
      setEditingStaff(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating driver');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const toggleEditOffDay = (day) => {
    setEditForm(prev => ({
      ...prev,
      off_days: prev.off_days.includes(day)
        ? prev.off_days.filter(d => d !== day)
        : [...prev.off_days, day]
    }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [staffRes, regionsRes] = await Promise.all([
        axios.get('/api/admin/staff', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/regions', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStaffList(Array.isArray(staffRes.data) ? staffRes.data : []);
      setRegions(Array.isArray(regionsRes.data) ? regionsRes.data : []);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRegion = async (staffId, regionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/staff/${staffId}`, { region_id: regionId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      alert('Region assigned successfully.');
    } catch (error) {
      alert('Error assigning region.');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to permanently delete this account?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Error deleting driver.');
    }
  };

  const handleDisable = async (userId) => {
    if (!confirm('Disable this account?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/users/${userId}/disable`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Error disabling account.');
    }
  };

  const handleEnable = async (userId) => {
    if (!confirm('Reactivate this account?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/users/${userId}/enable`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Error reactivating account.');
    }
  };

  const normalizeStr = (str) => (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  const filteredStaff = staffList.filter(s => {
    const fullName = `${s.user?.first_name || ''} ${s.user?.last_name || ''} ${s.user?.name || ''} ${s.employee_id || ''} ${s.region?.name || ''}`;
    return normalizeStr(fullName).includes(normalizeStr(searchTerm));
  });

  return (
    <div className="min-h-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');

        .staff-page {
          font-family: 'Inter', sans-serif;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .staff-card {
          animation: fadeInUp 0.4s ease-out backwards;
        }
      `}</style>

      <div className="staff-page">
        {/* Header Section */}
        <div className="mb-6 text-left">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black text-slate-900 tracking-tight mb-2"
          >
            Drivers
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-medium text-slate-500"
          >
            Manage your logistics team and region assignments
          </motion.p>
        </div>

        {/* Search and Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5" style={{ color: '#94a3b8' }} />
            <Input
              placeholder="Search by name, ID or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-10 border-2"
              style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderRadius: '16px', fontSize: '1rem' }}
            />
          </div>

          <Button 
            className="h-10 px-6 rounded-xl gap-2 shadow-xl shadow-blue-200"
            style={{ backgroundColor: '#0f172a' }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Truck className="size-5 text-white" />
            <span className="font-black text-xs uppercase tracking-widest text-white">New Driver</span>
          </Button>
        </motion.div>

        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-72 bg-slate-50 rounded-3xl animate-pulse border-2 border-slate-100" />
                ))}
             </div>
        ) : filteredStaff.length === 0 ? (
            <div className="p-10 text-center rounded-[2rem] border-2 border-dashed border-slate-200">
                <Truck className="size-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest leading-loose">No drivers found.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="staff-card group"
                >
                  <div
                    className="p-6 rounded-3xl transition-all duration-300 hover:shadow-2xl text-left relative overflow-hidden"
                    style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0', transform: 'translateY(0)' }}
                  >
                    {/* Driver Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <Avatar className="size-14 border-2 shadow-sm" style={{ borderColor: '#e2e8f0', backgroundColor: '#f1f5f9' }}>
                        <AvatarFallback style={{ color: '#3b82f6', fontSize: '1.1rem', fontWeight: 700 }}>
                           {staff.user?.first_name?.[0] || '?'}{staff.user?.last_name?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg mb-0.5 truncate" style={{ fontWeight: 600, color: '#0f172a' }}>
                          {staff.user?.first_name} {staff.user?.last_name}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
                          <span className="size-2 rounded-full bg-emerald-400"></span> 
                          ID: {staff.employee_id || staff.id}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge
                            className="capitalize"
                            style={{ backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', padding: '3px 10px', fontSize: '0.7rem', fontWeight: 600 }}
                        >
                            Driver
                        </Badge>
                        <Badge
                            className="capitalize"
                            style={{ 
                                backgroundColor: staff.user?.status === 'active' ? '#dcfce7' : '#fee2e2', 
                                color: staff.user?.status === 'active' ? '#16a34a' : '#dc2626', 
                                border: 'none', 
                                padding: '2px 8px', 
                                fontSize: '0.6rem', 
                                fontWeight: 700 
                            }}
                        >
                            {staff.user?.status === 'active' ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>

                    {/* Region Selector */}
                    <div className="mb-6 space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Region</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-blue-600" />
                            <select 
                                value={staff.region_id || ''} 
                                onChange={(e) => handleUpdateRegion(staff.id, e.target.value)}
                                className="w-full h-12 pl-11 pr-6 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-xs appearance-none cursor-pointer text-slate-700"
                            >
                                <option value="">Select a Region</option>
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-3 mb-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                             <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-tighter">
                                <Mail className="size-3.5" />
                                Email
                             </div>
                             <span className="font-bold text-slate-900 truncate max-w-[150px]">{staff.user?.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                             <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-tighter">
                                <Calendar className="size-3.5" />
                                Joined
                             </div>
                             <span className="font-bold text-slate-900">{staff.hire_date ? new Date(staff.hire_date).toLocaleDateString() : '---'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                             <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-tighter">
                                <Briefcase className="size-3.5" />
                                Region
                             </div>
                             <span className="font-bold text-blue-600">{staff.region?.name || 'Not assigned'}</span>
                        </div>
                    </div>

                    {/* Off-Days Display */}
                    {staff.off_days && staff.off_days.length > 0 && (
                        <div className="mb-6">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Rest Days</p>
                            <div className="flex flex-wrap gap-1.5">
                                {staff.off_days.map(day => (
                                    <span key={day} className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-[8px] font-black uppercase">
                                        {day.slice(0, 3)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                        <Button
                            variant="outline"
                            className="h-11 px-4 rounded-xl border-slate-100 bg-white hover:bg-slate-50 transition-all font-black text-[9px] uppercase tracking-widest gap-2 flex-1"
                            onClick={() => fetchStaffDetails(staff)}
                        >
                            <Calendar className="size-3.5" /> Plan
                        </Button>
                        <Button
                            variant="outline"
                            className="size-11 p-0 rounded-xl border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                            onClick={() => openEditModal(staff)}
                            title="Edit Driver"
                        >
                            <Edit2 className="size-4" />
                        </Button>
                        
                        {staff.user?.status === 'active' ? (
                            <Button 
                                variant="outline"
                                className="size-11 p-0 rounded-xl border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all"
                                onClick={() => handleDisable(staff.user_id)}
                                title="Disable Driver"
                            >
                                <UserMinus className="size-4" />
                            </Button>
                        ) : (
                            <Button 
                                variant="outline"
                                className="size-11 p-0 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                                onClick={() => handleEnable(staff.user_id)}
                                title="Enable Driver"
                            >
                                <UserCheck className="size-4" />
                            </Button>
                        )}

                        <Button 
                            variant="ghost"
                            className="size-11 p-0 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-none"
                            onClick={() => handleDelete(staff.user_id)}
                            title="Delete Driver"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        )}

        {/* Driver Detail / Planning Modal Placeholder */}
        <AnimatePresence>
          {selectedStaff && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
              onClick={() => setSelectedStaff(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg rounded-[2.5rem] p-10 text-left bg-white shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                        <div className="size-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                            <Truck className="size-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 leading-tight">
                                {selectedStaff.user?.first_name} {selectedStaff.user?.last_name}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Planning</p>
                        </div>
                     </div>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setSelectedStaff(null); setDetailedStaff(null); }} 
                        className="rounded-full bg-slate-50 hover:bg-slate-100"
                    >
                        <X className="size-5" />
                     </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  {['details', 'history'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => {
                        setStaffDetailTab(tab);
                        if (tab === 'history' && staffActivityLogs.length === 0) {
                          const uid = selectedStaff?.user_id || selectedStaff?.user?.id;
                          if (uid) fetchStaffActivity(uid);
                        }
                      }}
                      className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${staffDetailTab === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      {tab === 'details' ? 'Planning' : 'History'}
                    </button>
                  ))}
                </div>

                {staffDetailTab === 'history' ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {staffActivityLoading ? (
                      <div className="flex flex-col items-center py-12">
                        <Loader2 className="size-8 animate-spin text-blue-600 mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading activity...</p>
                      </div>
                    ) : staffActivityLogs.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No activity recorded yet.</p>
                      </div>
                    ) : staffActivityLogs.map((log, i) => (
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
                ) : (
                <div className="space-y-6">
                    <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Assignments to Complete</h4>
                            <Badge className="bg-blue-600 text-white border-none text-[10px] px-3">
                                {loadingDetails ? '...' : (detailedStaff?.assigned_deliveries?.length || 0)} Packages
                            </Badge>
                        </div>

                        {loadingDetails ? (
                            <div className="flex flex-col items-center py-12">
                                <Loader2 className="size-8 animate-spin text-blue-600 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading daily plan...</p>
                            </div>
                        ) : detailedStaff?.assigned_deliveries?.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {detailedStaff.assigned_deliveries.map(delivery => (
                                    <div key={delivery.id} className="p-4 bg-white rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-black text-slate-900">#{delivery.delivery_number}</span>
                                            <Badge className="text-[8px] font-black uppercase bg-slate-900 text-white border-none">
                                                {delivery.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                                            <Building2 className="size-3 text-slate-400" />
                                            <span className="font-bold truncate">{delivery.client?.company_name || 'Individual'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                            <MapPin className="size-3 text-blue-500" />
                                            <span className="truncate">{delivery.dest_city || 'Main Zone'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                                <Package className="size-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed px-10">
                                    No active deliveries assigned to this driver for today.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl">
                             <Phone className="size-4 text-emerald-500" />
                             <div className="min-w-0">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Direct Line</p>
                                 <p className="font-bold text-slate-700 text-xs truncate">{selectedStaff.user?.phone || "No phone"}</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl">
                             <MapPin className="size-4 text-blue-500" />
                             <div className="min-w-0">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Base Region</p>
                                 <p className="font-bold text-slate-700 text-xs truncate">{selectedStaff.region?.name || "Not set"}</p>
                             </div>
                        </div>
                    </div>
                </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Create Driver Modal */}
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
                className="w-full max-w-lg rounded-[2rem] p-6 text-left bg-white max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Create New Driver</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} className="rounded-full bg-slate-100">
                    <X className="size-5" />
                  </Button>
                </div>

                <form onSubmit={handleCreateDriver} className="space-y-4">
                  {/* Identity Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                      <Input 
                        required
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all"
                        value={newDriver.first_name}
                        onChange={(e) => setNewDriver({...newDriver, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                      <Input 
                        required
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all"
                        value={newDriver.last_name}
                        onChange={(e) => setNewDriver({...newDriver, last_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                        <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input 
                            type="email"
                            required
                            className="h-12 border-2 rounded-2xl bg-slate-50 border-slate-100 pl-12 focus:bg-white transition-all"
                            value={newDriver.email}
                            onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                        />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <Input 
                            required
                            className="h-12 border-2 rounded-2xl bg-slate-50 border-slate-100 pl-12 focus:bg-white transition-all"
                            value={newDriver.phone}
                            onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                            />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Residential Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input 
                        required
                        placeholder="Enter full address..."
                        className="h-12 border-2 rounded-2xl bg-slate-50 border-slate-100 pl-12 focus:bg-white transition-all"
                        value={newDriver.address}
                        onChange={(e) => setNewDriver({...newDriver, address: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <Input 
                            type="password"
                            required
                            className="h-12 border-2 rounded-2xl bg-slate-50 border-slate-100 pl-12 focus:bg-white transition-all"
                            value={newDriver.password}
                            onChange={(e) => setNewDriver({...newDriver, password: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <Input 
                            type="password"
                            required
                            className="h-12 border-2 rounded-2xl bg-slate-50 border-slate-100 pl-12 focus:bg-white transition-all"
                            value={newDriver.password_confirmation}
                            onChange={(e) => setNewDriver({...newDriver, password_confirmation: e.target.value})}
                            />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Region Assignment</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-blue-600" />
                      <select 
                        required
                        value={newDriver.region_id}
                        onChange={(e) => setNewDriver({...newDriver, region_id: e.target.value})}
                        className="w-full h-10 pl-9 pr-6 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-sm appearance-none cursor-pointer"
                      >
                        <option value="">Select a Region</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Off-Days Section */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Weekly Off-Days (Rest Days)</label>
                    <div className="flex flex-wrap gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => toggleOffDay(day)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                    newDriver.off_days.includes(day)
                                    ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                }`}
                            >
                                {day.slice(0, 3)}
                            </button>
                        ))}
                    </div>
                    <p className="text-[9px] text-slate-400 italic">Select the days this driver will not be available for deliveries.</p>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all mt-4 flex items-center justify-center gap-3 shadow-xl"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin size-5" /> : <Check className="size-5" />}
                    {isSubmitting ? 'Creating Driver...' : 'Deploy Driver Account'}
                  </Button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

        {/* Edit Driver Modal */}
        <AnimatePresence>
          {isEditModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg rounded-[2rem] p-6 text-left bg-white max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Driver</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(false)} className="rounded-full bg-slate-100">
                    <X className="size-5" />
                  </Button>
                </div>

                <form onSubmit={handleEditDriver} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                      <Input
                        required
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all"
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                      <Input
                        required
                        className="h-10 border-2 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all"
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        className="h-12 border-2 rounded-2xl bg-slate-50 border-slate-100 pl-12 focus:bg-white transition-all"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Residential Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        placeholder="Enter full address..."
                        className="h-12 border-2 rounded-2xl bg-slate-50 border-slate-100 pl-12 focus:bg-white transition-all"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Region Assignment</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-blue-600" />
                      <select
                        value={editForm.region_id}
                        onChange={(e) => setEditForm({ ...editForm, region_id: e.target.value })}
                        className="w-full h-10 pl-9 pr-6 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-sm appearance-none cursor-pointer"
                      >
                        <option value="">Select a Region</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Weekly Off-Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleEditOffDay(day)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                            editForm.off_days.includes(day)
                              ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200'
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="w-full h-10 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all mt-4 flex items-center justify-center gap-3 shadow-xl"
                  >
                    {isEditSubmitting ? <Loader2 className="animate-spin size-5" /> : <Check className="size-5" />}
                    {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}

export default StaffManagement;
