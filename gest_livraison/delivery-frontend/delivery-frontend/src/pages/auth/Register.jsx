import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowRight, ArrowLeft, Loader, Building, Phone, Mail,
    MapPin, Hash, Lock, Eye, EyeOff, CheckCircle, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import GlassBackButton from '../../components/ui/GlassBackButton';

/* ─── Helpers ───────────────────────────────────────────────── */
const isValidEmail   = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone   = v => /^[0-9+\s\-().]{7,20}$/.test(v.trim());
const isValidTaxId   = v => v.trim().length >= 4;
const isStrongPwd    = v => v.length >= 8;

/* ─── Inline field component ────────────────────────────────── */
const Field = ({ label, icon: Icon, error, children }) => (
    <div className="space-y-2 text-left">
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] ml-1"
               style={{ color: '#64748b' }}>
            {label}
        </label>
        <div className="relative group">
            {Icon && (
                <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors group-focus-within:text-blue-500 pointer-events-none z-10"
                      style={{ color: '#cbd5e1' }} />
            )}
            {children}
        </div>
        <AnimatePresence>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[10px] font-bold text-red-500 ml-2 flex items-center gap-1"
                >
                    <AlertCircle className="w-3 h-3" /> {error}
                </motion.p>
            )}
        </AnimatePresence>
    </div>
);

const inputClass = (hasIcon, hasError) =>
    `w-full border-2 rounded-2xl py-4 ${hasIcon ? 'pl-12 pr-5' : 'px-5'} ` +
    `focus:bg-white transition-all outline-none font-semibold text-sm inter-font ` +
    `${hasError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} text-slate-900 ` +
    `focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]`;

/* ─── Main Component ────────────────────────────────────────── */
const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        company_name: '',
        phone: '',
        phone2: '',
        email: '',
        address: '',
        address2: '',
        region_id: '',
        tax_id: '',
        password: '',
        password_confirmation: '',
    });

    const [regions, setRegions]   = useState([]);
    const [errors, setErrors]     = useState({});
    const [loading, setLoading]   = useState(false);
    const [apiError, setApiError] = useState('');
    const [showPwd, setShowPwd]   = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        axios.get('/api/regions').then(r => setRegions(r.data)).catch(() => {});
    }, []);

    /* ── Validation ── */
    const validate = () => {
        const e = {};

        if (!formData.company_name.trim())
            e.company_name = 'Company name is required.';

        if (!formData.phone.trim())
            e.phone = 'Phone number is required.';
        else if (!isValidPhone(formData.phone))
            e.phone = 'Invalid phone number.';

        if (!formData.phone2.trim())
            e.phone2 = 'Second phone number is required.';
        else if (!isValidPhone(formData.phone2))
            e.phone2 = 'Invalid phone number.';

        if (!formData.email.trim())
            e.email = "Email address is required.";
        else if (!isValidEmail(formData.email))
            e.email = 'Invalid email address.';

        if (!formData.address.trim())
            e.address = "Main address is required.";

        if (!formData.region_id)
            e.region_id = 'Region is required.';

        if (!formData.tax_id.trim())
            e.tax_id = 'Tax ID is required.';
        else if (!isValidTaxId(formData.tax_id))
            e.tax_id = 'Invalid Tax ID (minimum 4 characters).';

        if (!formData.password)
            e.password = 'Password is required.';
        else if (!isStrongPwd(formData.password))
            e.password = 'Minimum 8 characters.';

        if (!formData.password_confirmation)
            e.password_confirmation = 'Please confirm your password.';
        else if (formData.password !== formData.password_confirmation)
            e.password_confirmation = 'Passwords do not match.';

        return e;
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // clear error on change
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setApiError('');

        try {
            const payload = {
                company_name: formData.company_name,
                phone: formData.phone,
                phone2: formData.phone2 || null,
                email: formData.email,
                address: formData.address,
                address2: formData.address2 || null,
                region_id: formData.region_id,
                tax_id: formData.tax_id,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
            };

            await axios.post('/api/auth/register', payload);
            // Registration successful — account is pending admin approval.
            // Do NOT issue a token or redirect to dashboard.
            navigate('/login', {
                state: {
                    registrationSuccess: true,
                    message: 'Account created successfully. An admin will review and approve your account — you\'ll be able to log in once approved.',
                }
            });
        } catch (err) {
            if (err.response?.data?.errors) {
                const firstError = Object.values(err.response.data.errors)[0][0];
                setApiError(firstError);
            } else {
                setApiError(err.response?.data?.message || "Error during registration.");
            }
        } finally {
            setLoading(false);
        }
    };

    /* ── Password strength indicator ── */
    const pwdStrength = (() => {
        const p = formData.password;
        if (!p) return 0;
        let score = 0;
        if (p.length >= 8) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        return score;
    })();

    const strengthLabel = ['', 'Weak', 'Medium', 'Good', 'Strong'][pwdStrength];
    const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][pwdStrength];

    return (
        <div className="min-h-screen flex items-center justify-center p-6 py-16" style={{ backgroundColor: '#f8fafc' }}>
            <GlassBackButton />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                .inter-font { font-family: 'Inter', sans-serif; }
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="max-w-2xl w-full inter-font"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
                        <img src="/logo.png" alt="SwiftDeliver"
                             className="w-11 h-11 rounded-xl object-contain shadow-xl transform rotate-3 group-hover:rotate-0 transition-transform duration-300" />
                        <span className="text-3xl font-black tracking-tight" style={{ color: '#0f172a' }}>SwiftDeliver</span>
                    </Link>
                    <h2 className="text-2xl font-black mb-2" style={{ color: '#0f172a' }}>Create a Business Account</h2>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                        Join the professional logistics network
                    </p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100 relative overflow-hidden">

                    {/* API Error */}
                    <AnimatePresence>
                        {apiError && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-6 bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-100 flex items-center gap-3"
                            >
                                <div className="size-2 bg-red-500 rounded-full animate-pulse" />
                                {apiError}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-6">

                        {/* ── Nom de société ── */}
                        <Field label="Company Name *" icon={Building} error={errors.company_name}>
                            <input
                                id="company_name"
                                type="text"
                                autoComplete="organization"
                                className={inputClass(true, !!errors.company_name)}
                                placeholder="Ex: Tech Logistics Solutions"
                                value={formData.company_name}
                                onChange={e => handleChange('company_name', e.target.value)}
                            />
                        </Field>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Phone No. 1 *" error={errors.phone}>
                                <div className="flex rounded-2xl border-2 overflow-hidden"
                                     style={{ borderColor: errors.phone ? '#fca5a5' : '#e2e8f0', backgroundColor: errors.phone ? '#fff1f2' : '#f8fafc' }}>
                                    <span className="flex items-center gap-1 px-4 border-r-2 text-xs font-black bg-slate-100 text-slate-500 shrink-0"
                                          style={{ borderColor: '#e2e8f0' }}>
                                        🇹🇳 +216
                                    </span>
                                    <input
                                        id="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        className="flex-1 py-4 px-4 outline-none font-semibold text-sm bg-transparent text-slate-900"
                                        placeholder="XX XXX XXX"
                                        value={formData.phone}
                                        onChange={e => handleChange('phone', e.target.value)}
                                    />
                                </div>
                            </Field>
                            <Field label="Phone No. 2 *" error={errors.phone2}>
                                <div className="flex rounded-2xl border-2 overflow-hidden"
                                     style={{ borderColor: errors.phone2 ? '#fca5a5' : '#e2e8f0', backgroundColor: errors.phone2 ? '#fff1f2' : '#f8fafc' }}>
                                    <span className="flex items-center gap-1 px-4 border-r-2 text-xs font-black bg-slate-100 text-slate-500 shrink-0"
                                          style={{ borderColor: '#e2e8f0' }}>
                                        🇹🇳 +216
                                    </span>
                                    <input
                                        id="phone2"
                                        type="tel"
                                        autoComplete="tel"
                                        className="flex-1 py-4 px-4 outline-none font-semibold text-sm bg-transparent text-slate-900"
                                        placeholder="XX XXX XXX"
                                        value={formData.phone2}
                                        onChange={e => handleChange('phone2', e.target.value)}
                                    />
                                </div>
                            </Field>
                        </div>

                        {/* ── Email ── */}
                        <Field label="Email Address *" icon={Mail} error={errors.email}>
                            <input
                                id="email"
                                type="email"
                                autoComplete="new-email"
                                className={inputClass(true, !!errors.email)}
                                placeholder="contact@company.tn"
                                value={formData.email}
                                onChange={e => handleChange('email', e.target.value)}
                            />
                        </Field>

                        {/* ── Adresses ── */}
                        <Field label="Main Address *" icon={MapPin} error={errors.address}>
                            <input
                                id="address"
                                type="text"
                                autoComplete="street-address"
                                className={inputClass(true, !!errors.address)}
                                placeholder="Street number, neighborhood, city"
                                value={formData.address}
                                onChange={e => handleChange('address', e.target.value)}
                            />
                        </Field>
                        <Field label="Secondary Address (optional)" icon={MapPin} error={errors.address2}>
                            <input
                                id="address2"
                                type="text"
                                autoComplete="off"
                                className={inputClass(true, !!errors.address2)}
                                placeholder="Warehouse, branch..."
                                value={formData.address2}
                                onChange={e => handleChange('address2', e.target.value)}
                            />
                        </Field>

                        {/* ── Region ── */}
                        <Field label="Region / Governorate *" icon={MapPin} error={errors.region_id}>
                            <select
                                id="region_id"
                                className={inputClass(true, !!errors.region_id) + ' appearance-none'}
                                value={formData.region_id}
                                onChange={e => handleChange('region_id', e.target.value)}
                            >
                                <option value="">Select a governorate...</option>
                                {regions.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </Field>

                        {/* ── Tax ID ── */}
                        <Field label="Tax ID / Commercial Register *" icon={Hash} error={errors.tax_id}>
                            <input
                                id="tax_id"
                                type="text"
                                autoComplete="off"
                                className={inputClass(true, !!errors.tax_id)}
                                placeholder="Tax ID / CR / Commercial Register"
                                value={formData.tax_id}
                                onChange={e => handleChange('tax_id', e.target.value)}
                            />
                        </Field>

                        {/* ── Divider ── */}
                        <div className="flex items-center gap-4 my-2">
                            <div className="flex-1 h-px bg-slate-100" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security</span>
                            <div className="flex-1 h-px bg-slate-100" />
                        </div>

                        {/* ── Mot de passe ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <Field label="Password *" icon={Lock} error={errors.password}>
                                    <input
                                        id="password"
                                        type={showPwd ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        className={inputClass(true, !!errors.password) + ' pr-12'}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={e => handleChange('password', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(p => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </Field>
                                {/* Strength bar */}
                                {formData.password && (
                                    <div className="mt-2 px-1">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                                                     style={{ backgroundColor: i <= pwdStrength ? strengthColor : '#e2e8f0' }} />
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-bold" style={{ color: strengthColor }}>
                                            {strengthLabel}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Field label="Confirm Password *" icon={Lock} error={errors.password_confirmation}>
                                <input
                                    id="password_confirmation"
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    className={inputClass(true, !!errors.password_confirmation) + ' pr-12'}
                                    placeholder="••••••••"
                                    value={formData.password_confirmation}
                                    onChange={e => handleChange('password_confirmation', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(p => !p)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                {/* Match indicator */}
                                {formData.password_confirmation && (
                                    <div className="absolute right-11 top-1/2 -translate-y-1/2 pointer-events-none">
                                        {formData.password === formData.password_confirmation
                                            ? <CheckCircle className="w-4 h-4 text-green-500" />
                                            : <AlertCircle className="w-4 h-4 text-red-400" />
                                        }
                                    </div>
                                )}
                            </Field>
                        </div>

                        {/* ── Submit ── */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full text-white rounded-2xl py-5 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 transform active:scale-[0.98] disabled:opacity-50 hover:opacity-90 mt-4"
                            style={{ backgroundColor: '#0f172a', boxShadow: '0 20px 40px -10px rgba(15,23,42,0.25)' }}
                        >
                            {loading
                                ? <Loader className="w-5 h-5 animate-spin" />
                                : <><span>Create My Account</span><ArrowRight className="w-5 h-5" /></>
                            }
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t text-center" style={{ borderColor: '#f1f5f9' }}>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                            Already have an account?{' '}
                            <Link to="/login" className="font-black hover:opacity-60 transition-opacity ml-1"
                                  style={{ color: '#3b82f6' }}>
                                Login
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: '#cbd5e1' }}>
                        Join the future of logistics with SwiftDeliver
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
