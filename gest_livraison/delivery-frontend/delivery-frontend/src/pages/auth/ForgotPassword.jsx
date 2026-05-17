import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader, CheckCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import GlassBackButton from '../../components/ui/GlassBackButton';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [done, setDone] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await axios.post('/api/auth/reset-password', formData);
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 text-left relative overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
            <GlassBackButton dark />
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]" style={{ backgroundColor: '#3b82f6' }}></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px]" style={{ backgroundColor: '#6366f1' }}></div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                .inter-font { font-family: 'Inter', sans-serif; }
                .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-xl w-full"
            >
                {/* Logo */}
                <div className="text-center mb-12">
                    <Link to="/" className="inline-flex items-center gap-4 mb-8 group">
                        <div className="size-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 bg-slate-900 border border-slate-800">
                            <img src="/logo.png" alt="SwiftDeliver" className="w-10 h-10 object-contain" />
                        </div>
                        <span className="text-5xl font-black inter-font tracking-tight text-white">SwiftDeliver</span>
                    </Link>
                    <h2 className="text-3xl font-black inter-font mb-3 text-slate-100">
                        {done ? 'Password Updated' : 'Reset Password'}
                    </h2>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] inter-font text-slate-400">
                        {done ? 'You can now log in' : 'Enter your email and new password'}
                    </p>
                </div>

                <div className="glass-card rounded-[3.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] p-12 border border-white/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                    <AnimatePresence mode="wait">
                        {/* Form */}
                        {!done ? (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className="space-y-8 relative z-10"
                            >
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-red-50 text-red-600 p-5 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-100 flex items-center gap-3"
                                    >
                                        <div className="size-2 bg-red-600 rounded-full animate-pulse"></div>
                                        {error}
                                    </motion.div>
                                )}

                                {/* Email */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Account Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 group-focus-within:text-blue-600 text-slate-300" />
                                        <input
                                            type="email"
                                            required
                                            className="w-full border-2 rounded-[1.75rem] py-5 pr-8 focus:bg-white transition-all duration-300 outline-none font-bold inter-font"
                                            style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a', paddingLeft: '3.75rem' }}
                                            placeholder="name@company.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* New password */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 group-focus-within:text-blue-600 text-slate-300" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            className="w-full border-2 rounded-[1.75rem] py-5 pr-14 focus:bg-white transition-all duration-300 outline-none font-bold inter-font"
                                            style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a', paddingLeft: '3.75rem' }}
                                            placeholder="Min. 8 characters"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm password */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Confirm Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 group-focus-within:text-blue-600 text-slate-300" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            className="w-full border-2 rounded-[1.75rem] py-5 pr-8 focus:bg-white transition-all duration-300 outline-none font-bold inter-font"
                                            style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a', paddingLeft: '3.75rem' }}
                                            placeholder="••••••••"
                                            value={formData.password_confirmation}
                                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full text-white rounded-[1.75rem] py-6 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 transform active:scale-95 disabled:opacity-50 hover:bg-slate-800"
                                    style={{ backgroundColor: '#0f172a' }}
                                >
                                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Update Password</>}
                                </button>
                            </motion.form>
                        ) : (
                            /* Success */
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative z-10 text-center space-y-6"
                            >
                                <div className="flex justify-center">
                                    <div className="size-20 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center">
                                        <CheckCircle className="size-10 text-emerald-500" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-black text-lg text-slate-800">Password updated!</p>
                                    <p className="text-sm text-slate-500 font-bold mt-2">Log in with your new password.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full text-white rounded-[1.75rem] py-6 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 hover:bg-slate-800"
                                    style={{ backgroundColor: '#0f172a' }}
                                >
                                    Login <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!done && (
                        <div className="mt-10 pt-8 border-t text-center border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Remember it?{' '}
                                <Link to="/login" className="font-black hover:opacity-50 transition-all ml-2 text-blue-600">Login</Link>
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
