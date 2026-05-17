import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Clock, MessageSquare, Truck, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationBell = ({ setActiveTab }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const handleNotificationClick = async (notif) => {
        setIsOpen(false);
        
        // Mark as read immediately
        if (!notif.is_read) {
            markAsRead(notif.id);
        }

        if (setActiveTab) {
            if (notif.type === 'complaint_update' || notif.type === 'new_complaint') {
                setActiveTab('complaints');
            } else if (notif.type === 'delivery_update') {
                setActiveTab('deliveries');
            } else {
                setActiveTab('notifications_page');
            }
        }
    };

    const handleViewAll = () => {
        setIsOpen(false);
        if (setActiveTab) setActiveTab('notifications_page');
    };

    useEffect(() => {
        fetchNotifications();
        // Polling every 10 seconds
        const interval = setInterval(fetchNotifications, 10000);
        
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            // Fetch ALL recent notifications to keep them visible
            const response = await axios.get('/api/notifications', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            // Laravel pagination returns data in .data.data
            const allNotifs = response.data.data || response.data || [];
            setNotifications(allNotifs);
            
            // We still need the unread count for the badge
            const unreadRes = await axios.get('/api/notifications/unread', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUnreadCount(unreadRes.data.count || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
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
            case 'delivery_update': return <Truck className="w-4 h-4 text-blue-600" />;
            case 'new_complaint': return <MessageSquare className="w-4 h-4 text-amber-600" />;
            case 'complaint_update': return <AlertCircle className="w-4 h-4 text-emerald-600" />;
            default: return <Bell className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white shadow-lg shadow-blue-600/30 ring-2 ring-white animate-bounce-short">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Alerts</h4>
                                <span className="text-[9px] font-black text-slate-400 opacity-60 uppercase">{unreadCount} unread</span>
                            </div>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllRead}
                                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
                                    title="Mark all as read"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div 
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 border-b border-slate-50 last:border-0 transition-all group flex gap-4 cursor-pointer relative ${
                                            notif.is_read ? 'bg-white opacity-60 hover:opacity-100' : 'bg-blue-50/30 hover:bg-white active:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`shrink-0 w-10 h-10 bg-white border rounded-xl flex items-center justify-center shadow-sm ${
                                            notif.is_read ? 'border-slate-100' : 'border-blue-100'
                                        }`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <p className={`text-xs truncate ${notif.is_read ? 'font-medium text-slate-500' : 'font-black text-slate-900'}`}>{notif.title}</p>
                                                    {!notif.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    {!notif.is_read && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                                            className="p-1 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-relaxed mb-2 line-clamp-2">{notif.message}</p>
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <Clock className="w-2.5 h-2.5" />
                                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <Bell className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No notifications</p>
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                                <button 
                                    onClick={handleViewAll}
                                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                                >
                                    View all history
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
