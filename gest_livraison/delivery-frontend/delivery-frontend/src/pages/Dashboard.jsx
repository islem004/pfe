import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, User, LogOut,
    PlusCircle, List, Bell, Menu, X,
    Package, Clock, CheckCircle, Users, Truck,
    MapPin, BarChart3, FileText, Printer, MessageSquare,
    ChevronDown, ChevronUp, Home, Banknote
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

// Import sub-components
import Overview from '../components/dashboard/Overview';
import DashboardHome from '../components/admin/DashboardHome';
import CreateDelivery from '../components/dashboard/CreateDelivery';
import Profile from '../components/dashboard/Profile';
import DeliveriesList from '../components/dashboard/DeliveriesList';
// import ClientInvoices from '../components/dashboard/ClientInvoices';

// Admin components
import UserManagement from '../components/admin/UserManagement';
import StaffManagement from '../components/admin/StaffManagement';
import RegionManagement from '../components/admin/RegionManagement';
import Stats from '../components/admin/Stats';
import InvoiceManagement from '../components/dashboard/InvoiceManagement';
import ComplaintManagement from '../components/admin/ComplaintManagement';
import DeliverySlipManagement from '../components/admin/DeliverySlipManagement';
import NotificationBell from '../components/layout/NotificationBell';
import ClientComplaints from '../components/dashboard/ClientComplaints';
import NotificationsView from '../components/dashboard/NotificationsView';
import ClientStatistics from './client/Statistics';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = localStorage.getItem('role') || 'client';
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCommandesOpen, setIsCommandesOpen] = useState(true);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/', { replace: true });
    };

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        ...(role === 'client' ? [
            { id: 'create', label: 'New Delivery', icon: PlusCircle },
            { id: 'deliveries', label: 'My Deliveries', icon: List },
            { id: 'client_stats', label: 'Statistics', icon: BarChart3 },
            { id: 'complaints', label: 'Complaints', icon: MessageSquare },
        ] : [
            {
                id: 'commandes_group',
                label: 'Orders',
                icon: Package,
                isGroup: true,
                children: [
                    { id: 'deliveries', label: 'All Deliveries', icon: List },
                    { id: 'delivery_slips', label: 'Delivery Slips', icon: Printer },
                ]
            },
            { id: 'invoices', label: 'Invoices', icon: FileText },
            { id: 'users', label: 'Clients', icon: Users },
            { id: 'staff', label: 'Drivers', icon: Truck },
            { id: 'complaints', label: 'Complaints', icon: MessageSquare },
            { id: 'stats', label: 'Statistics', icon: BarChart3 }
        ]),
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <Overview role={role} user={user} setActiveTab={setActiveTab} />;
            case 'create': return <CreateDelivery />;
            case 'deliveries': return <DeliveriesList role={role} />;
            case 'users': return <UserManagement />;
            case 'staff': return <StaffManagement />;
            case 'regions': return <RegionManagement />;
            case 'invoices': return <InvoiceManagement role={role} />;
            case 'complaints': return role === 'admin' ? <ComplaintManagement /> : <ClientComplaints />;
            case 'delivery_slips': return <DeliverySlipManagement role={role} />;
            case 'notifications_page': return <NotificationsView />;
            case 'stats': return <Stats />;
            case 'client_stats': return <ClientStatistics setActiveTab={setActiveTab} />;
            case 'profile': return <Profile user={user} />;
            default: return <Overview role={role} user={user} setActiveTab={setActiveTab} />;
        }
    };

    return (
        <div className="min-h-screen flex font-['Inter']" style={{ backgroundColor: '#f8fafc' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
            `}</style>

            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 flex flex-col fixed h-full z-50 border-r`}
                style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
                <div className="p-5 flex items-center justify-between">
                    {isSidebarOpen && (
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <img src="/logo.png" alt="SwiftDeliver" className="w-10 h-10 rounded-xl object-contain" />
                            <span className="text-2xl font-bold text-white tracking-tight">SwiftDeliver</span>
                        </Link>
                    )}
                    <button 
                        onClick={() => setSidebarOpen(!isSidebarOpen)} 
                        className="p-2 hover:opacity-80 rounded-xl transition-all"
                        style={{ color: '#3b82f6' }}
                    >
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        if (item.isGroup) {
                            return (
                                <div key={item.id} className="space-y-2">
                                    <button
                                        onClick={() => setIsCommandesOpen(!isCommandesOpen)}
                                        className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest`}
                                        style={{ color: '#94a3b8' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5 shrink-0" style={{ color: '#3b82f6' }} />
                                            {isSidebarOpen && <span>{item.label}</span>}
                                        </div>
                                        {isSidebarOpen && (isCommandesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                                    </button>
                                    
                                    <AnimatePresence>
                                        {isCommandesOpen && isSidebarOpen && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden pl-4 space-y-2"
                                            >
                                                {item.children.map(child => (
                                                    <button
                                                        key={child.id}
                                                        onClick={() => setActiveTab(child.id)}
                                                        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest ${activeTab === child.id
                                                                ? 'shadow-xl'
                                                                : 'hover:bg-white/5'
                                                            }`}
                                                        style={{ 
                                                            backgroundColor: activeTab === child.id ? '#3b82f6' : 'transparent',
                                                            color: activeTab === child.id ? '#ffffff' : '#64748b'
                                                        }}
                                                    >
                                                        <child.icon className="w-4 h-4 shrink-0" />
                                                        <span>{child.label}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        }

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest ${activeTab === item.id
                                        ? 'shadow-2xl'
                                        : 'hover:bg-white/5'
                                    }`}
                                style={{ 
                                    backgroundColor: activeTab === item.id ? '#3b82f6' : 'transparent',
                                    color: activeTab === item.id ? '#ffffff' : '#94a3b8'
                                }}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t" style={{ borderColor: '#1e293b' }}>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 h-14 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest"
                        style={{ color: '#94a3b8' }}
                    >
                        <LogOut className="w-5 h-5" style={{ color: '#3b82f6' }} />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {/* Header */}
                <header
                    className="h-16 backdrop-blur-xl border-b flex items-center justify-between px-6 sticky top-0 z-40"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: '#e2e8f0' }}
                >
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black" style={{ color: '#0f172a' }}>
                            {/* Logic to find label even in children */}
                            {(() => {
                                const findLabel = (items, id) => {
                                    for (const item of items) {
                                        if (item.id === id) return item.label;
                                        if (item.children) {
                                            const child = item.children.find(c => c.id === id);
                                            if (child) return child.label;
                                        }
                                    }
                                    return '';
                                };
                                return findLabel(menuItems, activeTab);
                            })()}
                        </h2>
                    </div>

                    <div className="flex items-center gap-8">
                        <NotificationBell setActiveTab={setActiveTab} />
                        <div className="h-10 w-[1px]" style={{ backgroundColor: '#e2e8f0' }}></div>
                        
                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                className="flex items-center gap-4 p-1.5 rounded-[1.5rem] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black flex items-center justify-end gap-2" style={{ color: '#0f172a' }}>
                                        {user.first_name} {user.last_name}
                                        {user.client?.is_premium && (
                                            <span className="bg-amber-100 text-amber-500 p-1 rounded-full" title="Premium Account">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.956-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#3b82f6' }}>{role}</p>
                                </div>
                                <div 
                                    className="w-12 h-12 rounded-[1rem] flex items-center justify-center text-white font-black shadow-xl uppercase transition-transform active:scale-95 overflow-hidden"
                                    style={{ backgroundColor: '#0f172a' }}
                                >
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`
                                    )}
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} style={{ color: '#3b82f6' }} />
                            </button>

                            <AnimatePresence>
                                {isProfileDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                        className="absolute right-0 mt-4 w-64 rounded-[2rem] shadow-2xl border p-3 z-[60]"
                                        style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
                                    >
                                        <div className="px-4 py-2 border-b mb-2" style={{ borderColor: '#f1f5f9' }}>
                                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Account Management</p>
                                        </div>
                                        <button 
                                            onClick={() => { setActiveTab('profile'); setIsProfileDropdownOpen(false); }}
                                            className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest"
                                            style={{ color: '#0f172a' }}
                                        >
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f1f5f9', color: '#3b82f6' }}>
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span>My Profile</span>
                                        </button>

                                        <div className="h-[1px] my-2" style={{ backgroundColor: '#f1f5f9' }}></div>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest"
                                            style={{ color: '#ef4444' }}
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                                                <LogOut className="w-4 h-4" />
                                            </div>
                                            <span>Logout</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <div className="p-6 max-w-[1400px] mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
