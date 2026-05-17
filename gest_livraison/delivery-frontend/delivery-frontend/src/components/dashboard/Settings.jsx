import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const Settings = () => {
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put('/api/auth/update-password', passwords, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert("Password updated successfully!");
            setPasswords({ current_password: '', password: '', password_confirmation: '' });
        } catch (err) {
            const msg = err.response?.data?.message || "Error during update";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 text-left">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700;900&display=swap');
                
                .settings-title {
                    font-family: 'Inter', serif;
                }
            `}</style>
            
            {/* Password Section */}
            <div className="p-10 rounded-[2.5rem] shadow-sm border flex flex-col md:flex-row gap-12" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="w-full md:w-1/3 space-y-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f8fafc', color: '#3b82f6' }}>
                        <Lock className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold settings-title" style={{ color: '#0f172a' }}>Security</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#64748b', fontWeight: 500 }}>
                        Update your password regularly to ensure the security of your professional account.
                    </p>
                </div>

                <form onSubmit={handlePasswordChange} className="flex-1 space-y-6">
                    <div className="space-y-4">
                        <label className="text-sm font-bold ml-1 uppercase tracking-widest" style={{ color: '#64748b' }}>Current Password</label>
                        <input
                            type="password"
                            required
                            className="w-full border-2 rounded-2xl py-4 px-6 focus:bg-white transition-all outline-none font-bold"
                            style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a' }}
                            placeholder="••••••••"
                            value={passwords.current_password}
                            onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-sm font-bold ml-1 uppercase tracking-widest" style={{ color: '#64748b' }}>New Password</label>
                        <input
                            type="password"
                            required
                            className="w-full border-2 rounded-2xl py-4 px-6 focus:bg-white transition-all outline-none font-bold"
                            style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a' }}
                            placeholder="••••••••"
                            value={passwords.password}
                            onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-sm font-bold ml-1 uppercase tracking-widest" style={{ color: '#64748b' }}>Confirm New Password</label>
                        <input
                            type="password"
                            required
                            className="w-full border-2 rounded-2xl py-4 px-6 focus:bg-white transition-all outline-none font-bold"
                            style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a' }}
                            placeholder="••••••••"
                            value={passwords.password_confirmation}
                            onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50"
                            style={{ backgroundColor: '#0f172a' }}
                        >
                            <ShieldCheck className="w-5 h-5 text-[#3b82f6]" /> {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
};

export default Settings;
