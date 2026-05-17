import React, { useState } from 'react';
import { Star, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const RatingModal = ({ open, onClose, delivery, onRated }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hover, setHover] = useState(0);
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`/api/deliveries/${delivery.id}/rate`, {
                rating,
                rating_comment: comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onRated();
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Error during rating");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-900">Rate Delivery</h3>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="size-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="text-center space-y-6">
                            <p className="text-sm font-bold text-slate-500">
                                How was your delivery for order <span className="text-blue-600 font-black">#{delivery?.delivery_number}</span>?
                            </p>

                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                        onClick={() => setRating(star)}
                                        className="transition-all transform hover:scale-125"
                                    >
                                        <Star 
                                            className={`size-10 ${
                                                (hover || rating) >= star 
                                                    ? 'fill-amber-400 text-amber-400' 
                                                    : 'text-slate-200'
                                            } transition-colors`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                placeholder="Leave a short comment (optional)..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-600 transition-all min-h-[120px] resize-none"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-blue-600 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin size-4" /> : <Send className="size-4" />}
                                {loading ? 'Sending...' : 'Send Review'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RatingModal;
