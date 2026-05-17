import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, MapPin, Calendar, Info, Loader, 
    CheckCircle, User, Truck, ShieldAlert,
    ChevronRight, ChevronLeft, Building2, Phone,
    Hash, FileText, Banknote, StickyNote, Navigation,
    Printer, FileDown
} from 'lucide-react';
import axios from 'axios';

const CreateDelivery = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [regions, setRegions] = useState([]);
    const [success, setSuccess] = useState(false);
    const [createdDelivery, setCreatedDelivery] = useState(null);
    const profileRef = useRef(null); // stores client profile for on-focus autofill

    const [formData, setFormData] = useState({
        // Step 1: Client
        client_name: '',
        client_address_1: '',
        client_address_2: '',
        client_phone: '',
        client_fax: '',
        
        // Step 2: Package
        item_description: '',
        category: 'clothing',
        weight: '1.0',
        is_fragile: false,
        item_price: '',
        
        // Step 3: Destination
        region_id: '',
        dest_city: '',
        dest_postal_code: '',
        dest_street: '',
        dest_address_2: '',
        recipient_phone_1: '',
        recipient_phone_2: '',
        note: '',
    });

    useEffect(() => {
        // Fetch regions
        axios.get('/api/regions', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(r => setRegions(r.data)).catch(e => console.error(e));

        // Load client profile into ref (for on-focus autofill)
        const role = localStorage.getItem('role');
        if (role !== 'client') return;

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser?.client) {
            profileRef.current = storedUser;
        } else {
            axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }).then(res => {
                localStorage.setItem('user', JSON.stringify(res.data));
                profileRef.current = res.data;
            }).catch(err => console.error('Profile fetch error', err));
        }
    }, []);

    // Fill a single sender field on focus (only if still empty)
    const handleSenderFocus = (field) => {
        const profile = profileRef.current;
        if (!profile) return;
        const client = profile.client || {};
        const map = {
            client_name:      client.company_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            client_phone:     profile.phone || '',
            client_fax:       (client.contact_phone && client.contact_phone !== profile.phone) ? client.contact_phone : '',
            client_address_1: client.billing_address || '',
            client_address_2: client.shipping_address || '',
        };
        setFormData(prev => ({
            ...prev,
            [field]: prev[field] === '' ? (map[field] || '') : prev[field],
        }));
    };


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post('/api/deliveries', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setCreatedDelivery(response.data.delivery);
            setSuccess(true);
        } catch (err) {
            alert(err.response?.data?.message || "Error during creation");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (url, filename) => {
        try {
            const resp = await axios.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob'
            });
            const blobUrl = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) { alert("Download error"); }
    };

    if (success && createdDelivery) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 rounded-[3rem] shadow-2xl text-center max-w-2xl mx-auto"
                style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderStyle: 'solid', borderWidth: '1px' }}
            >
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner" style={{ backgroundColor: '#f8fafc', color: '#3b82f6' }}>
                    <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black mb-2" style={{ fontFamily: "'Inter', serif", color: '#0f172a' }}>Order Validated!</h2>
                <p className="mb-10 font-bold tracking-widest uppercase text-sm" style={{ color: '#64748b' }}>Reference: {createdDelivery.delivery_number}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                    <button
                        onClick={() => handleDownload(`/api/deliveries/${createdDelivery.id}/print`, `slip-${createdDelivery.delivery_number}.pdf`)}
                        className="flex flex-col items-center gap-4 p-8 rounded-[2rem] transition-all group shadow-sm border"
                        style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0f172a'; e.currentTarget.style.color = '#ffffff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = 'inherit'; }}
                    >
                        <Printer className="w-8 h-8 text-slate-400 group-hover:text-white" />
                        <span className="font-black text-xs uppercase tracking-widest">Delivery Slip</span>
                    </button>
                    <button
                        onClick={() => handleDownload(`/api/invoices/${createdDelivery.invoices?.[0]?.id}/print`, `Facture-${createdDelivery.invoices?.[0]?.invoice_number || createdDelivery.delivery_number}.pdf`)}
                        className="flex flex-col items-center gap-4 p-8 rounded-[2rem] transition-all group shadow-sm border"
                        style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6'; e.currentTarget.style.color = '#ffffff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = 'inherit'; }}
                    >
                        <FileDown className="w-8 h-8 text-slate-400 group-hover:text-white" />
                        <span className="font-black text-xs uppercase tracking-widest">Invoice</span>
                    </button>
                </div>

                <button
                    onClick={() => { setSuccess(false); setCurrentStep(1); }}
                    className="text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all w-full shadow-xl"
                    style={{ backgroundColor: '#0f172a' }}
                >
                    New Order
                </button>
            </motion.div>
        );
    }

    const steps = [
        { id: 1, title: 'Sender', icon: User },
        { id: 2, title: 'Package', icon: Package },
        { id: 3, title: 'Destination', icon: MapPin },
        { id: 4, title: 'Confirmation', icon: CheckCircle },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700;900&display=swap');
            `}</style>
            {/* Stepper Header */}
            <div className="p-6 rounded-[2.5rem] shadow-sm border mb-8 overflow-hidden relative" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="flex items-center justify-between relative z-10">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex flex-col items-center gap-3 relative">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                currentStep >= step.id 
                                ? 'text-white shadow-lg' 
                                : 'bg-slate-50 text-slate-300'
                             }`} style={{ backgroundColor: currentStep >= step.id ? '#0f172a' : '#f8fafc' }}>
                                <step.icon className="w-6 h-6" />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                currentStep === step.id ? 'text-slate-900' : 'text-slate-400'
                            }`}>{step.title}</span>
                            
                            {idx < steps.length - 1 && (
                                <div className={`hidden md:block absolute top-7 left-20 w-24 h-[2px] ${
                                    currentStep > step.id ? 'bg-slate-900' : 'bg-slate-100'
                                }`} style={{ backgroundColor: currentStep > step.id ? '#0f172a' : '#e2e8f0' }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <AnimatePresence mode='wait'>
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-10 rounded-[3rem] shadow-sm border space-y-8"
                            style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f8fafc', color: '#3b82f6' }}>
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900" style={{ fontFamily: "'Inter', serif", color: '#0f172a' }}>Sender Information</h3>
                                    <p className="text-sm font-medium" style={{ color: '#64748b', fontFamily: "'Inter', sans-serif" }}>Information about the company sending the order.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput label="Name / Company" name="client_name" value={formData.client_name} onChange={handleChange} onFocus={() => handleSenderFocus('client_name')} placeholder="Company name..." icon={User} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput label="Phone" name="client_phone" value={formData.client_phone} onChange={handleChange} onFocus={() => handleSenderFocus('client_phone')} placeholder="XX XXX XXX" icon={Phone} required />
                                    <FormInput label="Phone 2 (optional)" name="client_fax" value={formData.client_fax} onChange={handleChange} onFocus={() => handleSenderFocus('client_fax')} placeholder="XX XXX XXX" icon={Hash} />
                                </div>
                                <FormInput label="Main Address" name="client_address_1" value={formData.client_address_1} onChange={handleChange} onFocus={() => handleSenderFocus('client_address_1')} placeholder="Street, number, city..." icon={MapPin} required />
                                <FormInput label="Secondary Address" name="client_address_2" value={formData.client_address_2} onChange={handleChange} onFocus={() => handleSenderFocus('client_address_2')} placeholder="Entrance, floor, etc." icon={Navigation} />
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Delivery Description</h3>
                                    <p className="text-sm text-slate-400 font-medium">Details about the contents and characteristics of the package.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <FormTextarea label="Content Description" name="item_description" value={formData.item_description} onChange={handleChange} placeholder="Briefly describe the items..." icon={FileText} required />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                                        <select
                                            name="category"
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-600 outline-none font-bold text-slate-700 appearance-none"
                                            value={formData.category}
                                            onChange={handleChange}
                                        >
                                            <option value="clothing">Clothing / Textile</option>
                                            <option value="furniture">Furniture / Decoration</option>
                                            <option value="electronics">Electronics / Tech</option>
                                            <option value="documents">Documents / Papers</option>
                                            <option value="other">Other / Miscellaneous</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Estimated Weight (Kg)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="weight"
                                                step="0.1"
                                                className="w-full border-none rounded-2xl py-4 px-6 outline-none font-bold text-slate-700"
                                                style={{ backgroundColor: '#f8fafc' }}
                                                value={formData.weight}
                                                onChange={handleChange}
                                                required
                                            />
                                            <Truck className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 p-6 rounded-[2rem] items-center" style={{ backgroundColor: '#f8fafc' }}>
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${formData.is_fragile ? 'bg-red-100 text-red-600' : 'bg-white text-slate-300'}`}>
                                            <ShieldAlert className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm" style={{ color: '#0f172a' }}>Fragile Package?</p>
                                            <p className="text-xs font-medium" style={{ color: '#64748b' }}>Handle with extreme care.</p>
                                        </div>
                                        <div className="ml-auto">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" name="is_fragile" checked={formData.is_fragile} onChange={handleChange} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-64">
                                        <FormInput label="Total Price (TND)" name="item_price" value={formData.item_price} onChange={handleChange} placeholder="0.00" icon={Banknote} required type="number" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f8fafc', color: '#3b82f6' }}>
                                    <Truck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900" style={{ fontFamily: "'Inter', serif", color: '#0f172a' }}>Delivery Destination</h3>
                                    <p className="text-sm font-medium" style={{ color: '#64748b' }}>Information about the recipient and final location.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: '#64748b' }}>Destination Region</label>
                                    <select
                                        name="region_id"
                                        required
                                        className="w-full border-none rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 appearance-none"
                                        style={{ backgroundColor: '#f8fafc' }}
                                        value={formData.region_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select a region...</option>
                                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <FormInput label="City" name="dest_city" value={formData.dest_city} onChange={handleChange} placeholder="e.g. Algiers" icon={Navigation} required />
                                <FormInput label="Street / Neighborhood" name="dest_street" value={formData.dest_street} onChange={handleChange} placeholder="Street name or estate" icon={MapPin} required />
                                <FormInput label="Postal Code" name="dest_postal_code" value={formData.dest_postal_code} onChange={handleChange} placeholder="00000" icon={Hash} required />
                                <FormInput label="Phone 1" name="recipient_phone_1" value={formData.recipient_phone_1} onChange={handleChange} placeholder="Primary contact" icon={Phone} required />
                                <FormInput label="Phone 2 (Optional)" name="recipient_phone_2" value={formData.recipient_phone_2} onChange={handleChange} placeholder="Secondary contact" icon={Phone} />
                                <div className="md:col-span-2">
                                    <FormInput label="Address Details (Apt, Floor...)" name="dest_address_2" value={formData.dest_address_2} onChange={handleChange} placeholder="Additional address info" icon={Building2} />
                                </div>
                                <div className="md:col-span-2">
                                    <FormTextarea label="Special Notes" name="note" value={formData.note} onChange={handleChange} placeholder="Specific instructions for the driver..." icon={StickyNote} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8"
                        >
                            <div className="text-center mb-10">
                                <h3 className="text-3xl font-black mb-2" style={{ fontFamily: "'Inter', serif", color: '#0f172a' }}>Verification</h3>
                                <p className="font-medium" style={{ color: '#64748b' }}>Verify details before validating your shipment.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <SummarySection title="Sender" icon={User}>
                                    <p className="font-bold">{formData.client_name}</p>
                                    <p className="text-sm text-slate-500">{formData.client_address_1}</p>
                                    <p className="text-sm text-slate-500">{formData.client_phone}</p>
                                </SummarySection>

                                <SummarySection title="Content" icon={Package}>
                                    <p className="font-bold capitalize">{formData.category}</p>
                                    <p className="text-sm text-slate-500">{formData.item_description}</p>
                                    <p className="text-sm font-black text-blue-600 mt-2">{formData.item_price} TND</p>
                                </SummarySection>

                                <SummarySection title="Destination" icon={MapPin} className="md:col-span-2">
                                    <div className="grid grid-cols-2">
                                        <div>
                                            <p className="font-bold">{formData.dest_street}, {formData.dest_city}</p>
                                            <p className="text-sm text-slate-500">{regions.find(r => r.id == formData.region_id)?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formData.recipient_phone_1}</p>
                                            {formData.recipient_phone_2 && <p className="text-xs text-slate-400">{formData.recipient_phone_2}</p>}
                                        </div>
                                    </div>
                                </SummarySection>
                            </div>

                            {formData.is_fragile && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                                    <ShieldAlert className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-widest">Warning: Fragile Content</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-4 p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                    {currentStep > 1 ? (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="flex items-center gap-2 px-8 py-4 font-black uppercase tracking-widest text-xs transition-all"
                            style={{ color: '#64748b' }}
                        >
                            <ChevronLeft className="w-5 h-5" /> Previous
                        </button>
                    ) : <div />}

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl"
                            style={{ backgroundColor: '#0f172a' }}
                        >
                            Next <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={loading}
                            className="text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl disabled:opacity-50"
                            style={{ backgroundColor: '#3b82f6' }}
                        >
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Confirm & Ship</>}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

const FormInput = ({ label, icon: Icon, required, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            <input
                {...props}
                required={required}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-blue-600 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300"
            />
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />}
        </div>
    </div>
);

const FormTextarea = ({ label, icon: Icon, required, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            <textarea
                {...props}
                required={required}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-blue-600 outline-none font-bold text-slate-700 transition-all min-h-[100px] placeholder:text-slate-300"
            />
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />}
        </div>
    </div>
);

const SummarySection = ({ title, icon: Icon, children, className = "" }) => (
    <div className={`p-6 bg-slate-50 rounded-3xl border border-slate-100 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
            <Icon className="w-4 h-4 text-blue-600" />
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</h4>
        </div>
        <div className="text-slate-700">
            {children}
        </div>
    </div>
);

export default CreateDelivery;
