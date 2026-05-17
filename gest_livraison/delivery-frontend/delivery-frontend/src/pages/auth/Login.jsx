import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Mail, Lock, User, ShieldCheck, ArrowRight, Loader } from 'lucide-react';
import axios from 'axios';
import GlassBackButton from '../../components/ui/GlassBackButton';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/auth/login', formData);

            const { token, user, role } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('role', role);

            navigate('/dashboard');
        } catch (err) {
            const errData = err.response?.data;
            const status = err.response?.status;
            if (status === 403) {
                if (errData?.error === 'account_disabled') {
                    setError('Your account has been disabled. Please contact support.');
                } else if (errData?.error === 'account_deleted') {
                    setError('This account no longer exists.');
                } else {
                    setError(errData?.message || 'Access denied.');
                }
            } else {
                setError(errData?.errors?.email?.[0] || errData?.message || 'Invalid credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 text-left relative overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
            <GlassBackButton dark />
            {/* Premium Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]" style={{ backgroundColor: '#3b82f6' }}></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px]" style={{ backgroundColor: '#6366f1' }}></div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                .inter-font {
                    font-family: 'Inter', sans-serif;
                }

                .glass-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                }
            `}</style>
            
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-xl w-full"
            >
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-4 mb-8 group">
                        <div className="size-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 bg-slate-900 border border-slate-800">
                             <img src="/logo.png" alt="SwiftDeliver" className="w-10 h-10 object-contain" />
                        </div>
                        <span className="text-3xl font-black inter-font tracking-tight text-white">SwiftDeliver</span>
                    </Link>
                    <h2 className="text-3xl font-black inter-font mb-3 text-slate-100">Welcome Back</h2>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] inter-font text-slate-400">Secure access to your professional dashboard</p>
                </div>

                <div className="glass-card rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] p-8 border border-white/50 relative overflow-hidden">
                    {/* Subtle inner decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    
                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
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

                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Corporate Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 group-focus-within:text-blue-600 text-slate-300" />
                                <input
                                    type="email"
                                    required
                                    className="w-full border-2 rounded-[1rem] py-3 pl-15 pr-8 focus:bg-white transition-all duration-300 outline-none font-bold inter-font"
                                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a', paddingLeft: '3.75rem' }}
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between mb-1 ml-1 items-center">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security Phrase</label>
                                <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest hover:opacity-50 transition-all text-blue-600">Forgot password?</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 group-focus-within:text-blue-600 text-slate-300" />
                                <input
                                    type="password"
                                    required
                                    className="w-full border-2 rounded-[1rem] py-3 pl-15 pr-8 focus:bg-white transition-all duration-300 outline-none font-bold inter-font"
                                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a', paddingLeft: '3.75rem' }}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full text-white rounded-[1rem] py-4 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 transform active:scale-95 disabled:opacity-50 hover:bg-slate-800 hover:shadow-blue-500/10"
                            style={{ backgroundColor: '#0f172a' }}
                        >
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <>Access Dashboard <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t text-center border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            New partner? {' '}
                            <Link to="/register" className="font-black hover:opacity-50 transition-all ml-2 text-blue-600">Register Enterprise Account</Link>
                        </p>
                    </div>
                </div>
                
                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                        Protected by Global Logistics Security Standards
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
