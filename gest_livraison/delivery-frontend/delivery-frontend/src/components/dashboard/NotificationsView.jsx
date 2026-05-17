import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Bell, Check, Trash2, Clock, MessageSquare, 
    Truck, AlertCircle, RefreshCw, MailOpen, Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationsView = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/notifications', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // Handle pagination if necessary, but response.data.data is common in Laravel
            setNotifications(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put('/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'delivery_update': return <Truck className="w-6 h-6" />;
            case 'new_complaint': return <MessageSquare className="w-6 h-6" />;
            case 'complaint_update': return <AlertCircle className="w-6 h-6" />;
            default: return <Bell className="w-6 h-6" />;
        }
    };

    return (
        <div className="space-y-8">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700;900&display=swap');
            `}</style>
            
            {/* Header Area */}
            <div className="p-8 rounded-[3rem] border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                        <Bell className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black" style={{ fontFamily: "'Inter', serif", color: '#0f172a' }}>Notification Center</h3>
                        <p className="text-sm font-bold uppercase tracking-widest leading-none" style={{ color: '#64748b' }}>History & Alerts</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={markAllRead}
                        className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border"
                        style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#475569' }}
                    >
                        <MailOpen className="w-4 h-4" /> Mark all read
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="rounded-[3rem] border shadow-sm overflow-hidden min-h-[500px]" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <RefreshCw className="w-12 h-12 animate-spin mb-6" style={{ color: '#3b82f6' }} />
                            <h4 className="text-xl font-black uppercase tracking-tight" style={{ color: '#0f172a' }}>Fetching alerts</h4>
                            <p className="text-sm font-bold uppercase tracking-widest mt-2" style={{ color: '#64748b' }}>One moment please...</p>
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="grid gap-4">
                            {notifications.map((notif) => (
                                <motion.div 
                                    key={notif.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-6 rounded-[2.5rem] border flex flex-col md:flex-row items-center justify-between gap-6 transition-all group ${
                                        notif.is_read 
                                            ? 'opacity-60' 
                                            : 'shadow-xl shadow-slate-200/20'
                                    }`}
                                    style={{ 
                                        backgroundColor: notif.is_read ? '#ffffff' : '#f8fafc',
                                        borderColor: notif.is_read ? '#f5efeb' : '#e2e8f0'
                                    }}
                                >
                                    <div className="flex items-center gap-6 w-full">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                            notif.is_read ? 'text-slate-400' : ''
                                        }`} style={{ backgroundColor: '#ffffff', color: notif.is_read ? '#64748b' : '#3b82f6' }}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-black text-lg truncate pr-10" style={{ color: '#0f172a' }}>{notif.title}</h4>
                                                {!notif.is_read && (
                                                    <span className="shrink-0 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#3b82f6' }}></span>
                                                )}
                                            </div>
                                            <p className="leading-relaxed font-medium mb-3" style={{ color: '#475569' }}>{notif.message}</p>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>
                                                    <Clock className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
                                                    {new Date(notif.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {!notif.is_read && (
                                            <button 
                                                onClick={() => markAsRead(notif.id)}
                                                className="whitespace-nowrap px-6 py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
                                                style={{ backgroundColor: '#3b82f6' }}
                                            >
                                                <Check className="w-3.5 h-3.5 inline mr-2" /> Mark as read
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-32 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 border border-dashed" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                <Inbox className="w-12 h-12" style={{ color: '#94a3b8' }} />
                            </div>
                            <h4 className="text-2xl font-black mb-2 tracking-tight" style={{ color: '#0f172a' }}>Empty Inbox</h4>
                            <p className="text-sm font-bold uppercase tracking-widest max-w-xs mx-auto" style={{ color: '#64748b' }}>You haven't received any notifications yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsView;
