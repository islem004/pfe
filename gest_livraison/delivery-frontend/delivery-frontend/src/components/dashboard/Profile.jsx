import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    User, 
    Mail, 
    Phone, 
    Briefcase, 
    MapPin, 
    Save, 
    Shield, 
    Camera, 
    Globe, 
    Building,
    CheckCircle,
    Loader2,
    AlertCircle,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck
} from 'lucide-react';
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const Profile = ({ user: initialUser }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [user, setUser] = useState(initialUser || JSON.parse(localStorage.getItem('user') || '{}'));
    const [regions, setRegions] = useState([]);
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        company_name: user?.client?.company_name || '',
        billing_address: user?.client?.billing_address || '',
        region_id: user?.client?.region_id || '',
        website: user?.client?.website || ''
    });
    const [passwords, setPasswords] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');

    const isClient = !!user?.client;

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get('/api/regions', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setRegions(r.data))
            .catch(() => {});
    }, []);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        try {
            await axios.put('/api/auth/update-password', passwords, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPasswordSuccess(true);
            setPasswords({ current_password: '', password: '', password_confirmation: '' });
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (err) {
            alert(err.response?.data?.message || "Error during update");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Image size must not exceed 2 MB.");
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            const profileData = new FormData();
            profileData.append('first_name', formData.first_name);
            profileData.append('last_name', formData.last_name);
            profileData.append('phone', formData.phone || '');
            if (avatarFile) {
                profileData.append('avatar', avatarFile);
            }

            await axios.post('/api/auth/profile', profileData, {
                headers: { 
                    Authorization: `Bearer ${token}`
                }
            });

            if (isClient) {
                await axios.put('/api/client/profile', {
                    company_name: formData.company_name,
                    billing_address: formData.billing_address,
                    region_id: formData.region_id || undefined,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // Refresh user data
            const meResponse = await axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const updatedUser = meResponse.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setFormData(prev => ({ ...prev, region_id: updatedUser.client?.region_id || '' }));
            if (updatedUser.avatar_url) {
                setAvatarPreview(updatedUser.avatar_url);
            }
            setAvatarFile(null);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Error during update");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 text-left">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700;900&display=swap');
                
                .profile-title {
                    font-family: 'Inter', serif;
                }
            `}</style>

            {/* Profile Header Card */}
            <div className="relative group">
                <div className="h-48 bg-gradient-to-r rounded-[3rem] shadow-2xl overflow-hidden relative" style={{ background: 'linear-gradient(to right, #0f172a, #3b82f6, #0f172a)' }}>
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] pointer-events-none"></div>
                    <div className="absolute bottom-4 right-8 flex gap-2">
                        <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl px-4 py-2 text-xs font-bold transition-all">
                           <Camera className="size-4 mr-2" /> Change Cover
                        </Button>
                    </div>
                </div>
                
                <div className="px-12 -mt-16 relative flex flex-col md:flex-row items-end gap-8">
                    <div className="relative">
                        <div className="w-32 h-32 bg-white rounded-[2.5rem] p-1.5 shadow-2xl relative overflow-hidden">
                            <div className="w-full h-full bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 border-4 border-slate-50 overflow-hidden">
                                {avatarPreview ? (
                                    <img src={avatarPreview + (avatarPreview.startsWith('http') ? `?t=${Date.now()}` : '')} alt="Avatar" className="w-full h-full object-cover rounded-[2rem]" />
                                ) : (
                                    <User className="size-16" />
                                )}
                            </div>
                        </div>
                        <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 size-10 text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer" style={{ backgroundColor: '#0f172a' }}>
                            <Camera className="size-4" />
                            <input 
                                id="avatar-upload"
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                        </label>
                    </div>
                    
                    <div className="pb-4 flex-1 text-left">
                        <div className="flex items-center gap-3">
                            <h2 className="text-4xl font-black leading-tight profile-title" style={{ color: '#0f172a' }}>
                                {formData.first_name} {formData.last_name}
                            </h2>
                            {user?.role === 'admin' ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white shadow-lg">
                                    <Shield className="size-3.5 text-blue-400" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">System Administrator</span>
                                </div>
                            ) : isClient && (
                                <CheckCircle className="size-6" style={{ color: '#3b82f6' }} />
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                            <p className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest" style={{ color: '#64748b' }}>
                                <Shield className="size-3.5" style={{ color: user?.role === 'admin' ? '#0f172a' : '#3b82f6' }} /> {user?.role || 'User'} Level
                            </p>
                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                            <p className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest" style={{ color: '#64748b' }}>
                                <Mail className="size-3.5" style={{ color: '#3b82f6' }} /> {formData.email}
                            </p>
                            {isClient && (
                                <>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                    <p className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest" style={{ color: '#64748b' }}>
                                        <Building className="size-3.5" style={{ color: '#3b82f6' }} /> {formData.company_name}
                                    </p>
                                </>
                            )}
                            {user?.role === 'admin' && (
                                <>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                    <p className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-blue-600">
                                        <Globe className="size-3.5" /> Full System Access
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                {/* Main Form */}
                <Card className="w-full p-10 shadow-sm rounded-[3rem]" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                    <div className="mb-10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f8fafc', color: '#3b82f6' }}>
                            <User className="size-5" />
                        </div>
                        <div className="text-left">
                           <h3 className="text-xl font-black profile-title" style={{ color: '#0f172a' }}>Personal Information</h3>
                           <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: '#64748b' }}>Identity and contact details</p>
                        </div>
                    </div>
                    
                    {success && (
                        <div className="mb-6 flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            <CheckCircle className="size-5 shrink-0" />
                            Profile updated successfully!
                        </div>
                    )}
                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3 text-left">
                                <Label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>First Name</Label>
                                <Input
                                    className="border-2 rounded-2xl h-14 px-6 focus:bg-white transition-all outline-none font-bold text-slate-900"
                                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3 text-left">
                                <Label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Last Name</Label>
                                <Input
                                    className="border-2 rounded-2xl h-14 px-6 focus:bg-white transition-all outline-none font-bold text-slate-900"
                                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3 text-left">
                                <Label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Phone Number</Label>
                                <Input
                                    className="border-2 rounded-2xl h-14 px-6 focus:bg-white transition-all outline-none font-bold text-slate-900"
                                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3 text-left">
                                <Label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Email Address (Unchangeable)</Label>
                                <Input
                                    disabled
                                    className="border-2 rounded-2xl h-14 px-6 opacity-60 cursor-not-allowed font-bold"
                                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}
                                    value={formData.email}
                                />
                            </div>
                        </div>

                        {isClient && (
                            <div className="pt-6 space-y-8 border-t" style={{ borderColor: '#f5efeb' }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f8fafc', color: '#3b82f6' }}>
                                        <Briefcase className="size-5" />
                                    </div>
                                    <div className="text-left">
                                       <h3 className="text-xl font-black profile-title" style={{ color: '#0f172a' }}>Company Details</h3>
                                       <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: '#64748b' }}>B2B Settings & Billing</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 text-left">
                                    <Label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Company Name</Label>
                                    <Input
                                        className="border-2 rounded-2xl h-14 px-6 focus:bg-white transition-all outline-none font-bold text-slate-900"
                                        style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3 text-left">
                                    <Label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Billing Address</Label>
                                    <Textarea
                                        className="border-2 rounded-3xl p-6 focus:bg-white transition-all outline-none font-bold text-slate-900 min-h-[140px] resize-none"
                                        style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                        value={formData.billing_address}
                                        onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3 text-left">
                                    <Label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Region / Governorate</Label>
                                    <select
                                        className="w-full border-2 rounded-2xl h-14 px-6 focus:bg-white transition-all outline-none font-bold text-slate-900 appearance-none"
                                        style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                        value={formData.region_id}
                                        onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                                    >
                                        <option value="">Select a governorate...</option>
                                        {regions.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-6">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="text-white px-12 h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
                                style={{ backgroundColor: '#0f172a' }}
                            >
                                {loading ? <Loader2 className="animate-spin size-4" /> : <Save className="size-4" />}
                                {loading ? 'Saving...' : 'Update Profile'}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Security Section */}
                <Card className="w-full p-10 shadow-sm rounded-[3rem] mt-8" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                    <div className="mb-10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                            <Lock className="size-5" />
                        </div>
                        <div className="text-left">
                           <h3 className="text-xl font-black profile-title" style={{ color: '#0f172a' }}>Account Security</h3>
                           <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: '#64748b' }}>Change your login password</p>
                        </div>
                    </div>

                    {passwordSuccess && (
                        <div className="mb-6 flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            <ShieldCheck className="size-5 shrink-0" />
                            Password updated successfully!
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3 text-left">
                                <Label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Current Password</Label>
                                <Input
                                    type="password"
                                    required
                                    className="border-2 rounded-2xl h-14 px-6 focus:bg-white transition-all outline-none font-bold text-slate-900"
                                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={passwords.current_password}
                                    onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3 text-left">
                                <Label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>New Password</Label>
                                <Input
                                    type="password"
                                    required
                                    className="border-2 rounded-2xl h-14 px-6 focus:bg-white transition-all outline-none font-bold text-slate-900"
                                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={passwords.password}
                                    onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3 text-left">
                                <Label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Confirm New Password</Label>
                                <Input
                                    type="password"
                                    required
                                    className="border-2 rounded-2xl h-14 px-6 focus:bg-white transition-all outline-none font-bold text-slate-900"
                                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={passwords.password_confirmation}
                                    onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-6">
                            <Button
                                type="submit"
                                disabled={passwordLoading}
                                className="text-white px-12 h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
                                style={{ backgroundColor: '#0f172a' }}
                            >
                                {passwordLoading ? <Loader2 className="animate-spin size-4" /> : <ShieldCheck className="size-4" />}
                                {passwordLoading ? 'Updating...' : 'Change Password'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
