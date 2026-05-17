import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { Package, TruckIcon, Banknote, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const DashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overviewStats, setOverviewStats] = useState({
    total: 0,
    active: 0,
    revenue: 0,
    completionRate: 0
  });
  const [statusData, setStatusData] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [deliveryData, setDeliveryData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, delRes] = await Promise.all([
        axios.get('/api/admin/statistiques', { headers }).catch(e => {
            console.error("Stats API error", e);
            return { data: {} };
        }),
        axios.get('/api/admin/deliveries', { headers }).catch(e => {
            console.error("Deliveries API error", e);
            return { data: { data: [] } };
        })
      ]);

      const data = statsRes.data || {};
      const delList = Array.isArray(delRes.data.data) ? delRes.data.data : (Array.isArray(delRes.data) ? delRes.data : []);

      const counts = {
          pending: (data.pending || 0) + (data.confirmed || 0),
          in_transit: (data.in_transit || 0) + (data.picked_up || 0),
          delivered: (data.delivered || data.completed || 0),
          cancelled: (data.cancelled || 0),
          failed: (data.failed || 0)
      };

      const total = counts.pending + counts.in_transit + counts.delivered + counts.cancelled + counts.failed;
      const active = counts.pending + counts.in_transit;
      const completed = counts.delivered;
      const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
      
      let revenue = 0;
      delList.forEach(d => {
        if (d.status === 'delivered' || d.status === 'completed') {
           revenue += (parseFloat(d.price) || 0);
        }
      });

      setOverviewStats({
        total: total || delList.length,
        active: active || delList.filter(d => ['pending', 'in_transit', 'confirmed', 'picked_up'].includes(d.status)).length,
        revenue: revenue || 0,
        completionRate: completionRate || 0
      });

      const sData = [
        { name: "Delivered", value: counts.delivered || 0.1, color: "#10b981" },
        { name: "In Transit", value: counts.in_transit || 0, color: "#f59e0b" },
        { name: "Pending", value: counts.pending || 0, color: "#3b82f6" },
        { name: "Failed/Cancelled", value: (counts.cancelled + counts.failed) || 0, color: "#94a3b8" },
      ].filter(item => item.name === "Delivered" || item.value > 0);
      setStatusData(sData);

      const recent = delList.slice(0, 5).map(delivery => ({
        id: delivery.delivery_number || delivery.tracking_code || delivery.id,
        customer: (delivery.client?.company_name || delivery.receiver_name || "Client"),
        address: delivery.delivery_address_text || "N/A",
        status: delivery.status === 'delivered' || delivery.status === 'completed' ? "Completed" 
                : delivery.status === 'in_transit' || delivery.status === 'picked_up' ? "In Transit" 
                : "Pending",
        time: delivery.created_at ? new Date(delivery.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "---"
      }));
      setRecentDeliveries(recent);

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const chartMap = {};
      const last7Days = Array.from({length: 7}).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toLocaleDateString();
        chartMap[key] = { name: days[d.getDay()], deliveries: 0, revenue: 0 };
        return key;
      });

      delList.forEach(d => {
          const dateKey = new Date(d.created_at).toLocaleDateString();
          if (chartMap[dateKey]) {
              chartMap[dateKey].deliveries += 1;
              if (d.status === 'delivered' || d.status === 'completed') {
                  chartMap[dateKey].revenue += (parseFloat(d.price) || 0);
              }
          }
      });

      const finalChartData = last7Days.map(key => chartMap[key]);
      setDeliveryData(finalChartData);
      setRevenueData(finalChartData.map(d => ({ name: d.name, revenue: d.revenue })));

    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96" style={{ color: '#64748b' }}>
        <Loader2 className="animate-spin size-12 mb-4" style={{ color: '#3b82f6' }} />
        <p className="font-bold animate-pulse">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
      return (
          <div className="p-12 rounded-[2.5rem] text-center space-y-4" style={{ backgroundColor: '#f8fafc', border: '2px solid #e2e8f0' }}>
              <AlertCircle className="w-12 h-12 mx-auto" style={{ color: '#3b82f6' }} />
              <h3 className="text-xl font-black" style={{ color: '#0f172a' }}>Oops! Error</h3>
              <p className="font-medium" style={{ color: '#475569' }}>{error}</p>
              <button onClick={fetchRealData} className="px-8 py-3 rounded-2xl font-bold text-white transition-all shadow-xl" style={{ backgroundColor: '#3b82f6' }}>Retry</button>
          </div>
      );
  }

  return (
    <div className="min-h-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');

        .dashboard-home {
          font-family: 'Inter', sans-serif;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dash-card {
          animation: fadeInUp 0.4s ease-out backwards;
          background-color: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: 1.5rem;
          transition: all 0.3s ease;
        }
        
        .dash-card:hover {
            border-color: #cbd5e1;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        }
      `}</style>

      <div className="dashboard-home space-y-6 text-left pb-10">
        <div className="mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black text-slate-900 tracking-tight mb-2"
          >
            Statistics
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-medium text-slate-500"
          >
            Real-time overview of your logistics operations
          </motion.p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="dash-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Total Packages</p>
                <p className="text-4xl font-bold mt-2" style={{ color: '#0f172a' }}>{overviewStats.total}</p>
              </div>
              <div className="size-14 rounded-2xl flex items-center justify-center bg-blue-50 border-2" style={{ borderColor: '#e2e8f0' }}>
                <Package className="size-6" style={{ color: '#3b82f6' }} />
              </div>
            </div>
          </div>

          <div className="dash-card p-6" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Active Packages</p>
                <p className="text-4xl font-bold mt-2" style={{ color: '#0f172a' }}>{overviewStats.active}</p>
              </div>
              <div className="size-14 rounded-2xl flex items-center justify-center bg-amber-50 border-2" style={{ borderColor: '#e2e8f0' }}>
                <TruckIcon className="size-6" style={{ color: '#f59e0b' }} />
              </div>
            </div>
          </div>

          <div className="dash-card p-6" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Revenue</p>
                <p className="text-4xl font-bold mt-2" style={{ color: '#0f172a' }}>{overviewStats.revenue} <span className="text-sm font-medium" style={{ color: '#64748b' }}>TND</span></p>
              </div>
              <div className="size-14 rounded-2xl flex items-center justify-center bg-emerald-50 border-2" style={{ borderColor: '#e2e8f0' }}>
                <Banknote className="size-6" style={{ color: '#10b981' }} />
              </div>
            </div>
          </div>

          <div className="dash-card p-6" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Success Rate</p>
                <p className="text-4xl font-bold mt-2" style={{ color: '#0f172a' }}>{overviewStats.completionRate}%</p>
              </div>
              <div className="size-14 rounded-2xl flex items-center justify-center bg-slate-50 border-2" style={{ borderColor: '#e2e8f0' }}>
                <CheckCircle className="size-6" style={{ color: '#64748b' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="dash-card p-8" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-2xl font-bold mb-6" style={{ color: '#0f172a' }}>Weekly Deliveries</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deliveryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} fontStyle="bold" dy={10} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} fontStyle="bold" tick={{ fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="deliveries" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }} activeDot={{ r: 8, fill: '#60a5fa', stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dash-card p-8" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-2xl font-bold mb-6" style={{ color: '#0f172a' }}>Revenue Stream</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} fontStyle="bold" dy={10} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} fontStyle="bold" tick={{ fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Delivery Status & Recent Deliveries */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="dash-card p-8" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-2xl font-bold mb-6" style={{ color: '#0f172a' }}>Status Distribution</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-3">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs font-bold" style={{ color: '#475569' }}>{item.name}</span>
                  </div>
                  <span className="text-sm font-black" style={{ color: '#0f172a' }}>{item.value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-card p-8 lg:col-span-2" style={{ animationDelay: '0.7s' }}>
            <h3 className="text-2xl font-bold mb-6" style={{ color: '#0f172a' }}>Recent Activity</h3>
            {recentDeliveries.length === 0 ? (
               <div className="text-center py-16" style={{ color: '#64748b' }}>No recent packages found.</div>
            ) : (
               <div className="space-y-6">
                 {recentDeliveries.map((delivery, index) => (
                   <div key={index} className="flex items-center justify-between pb-6 border-b last:border-0 last:pb-0 group" style={{ borderColor: '#e2e8f0' }}>
                     <div className="flex-1">
                       <div className="flex items-center gap-4">
                         <div className="size-12 rounded-xl flex items-center justify-center font-bold text-lg bg-blue-50 border-2" style={{ borderColor: '#e2e8f0', color: '#3b82f6' }}>
                            {delivery.customer?.[0] || '?'}
                         </div>
                         <div>
                             <div className="flex items-center gap-3">
                               <span className="text-sm font-bold" style={{ color: '#0f172a' }}>{delivery.customer}</span>
                               <span className="font-bold text-xs" style={{ color: '#3b82f6' }}>#{delivery.id}</span>
                             </div>
                             <p className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>{delivery.address}</p>
                         </div>
                       </div>
                     </div>
                     <div className="text-right">
                       <span className={`inline-block px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest`}
                             style={{
                               backgroundColor: '#ffffff',
                               border: '2px solid',
                               borderColor: delivery.status === "Completed" ? "#10b981" :
                                            delivery.status === "In Transit" ? "#f59e0b" : "#3b82f6",
                               color: delivery.status === "Completed" ? "#10b981" :
                                      delivery.status === "In Transit" ? "#f59e0b" : "#3b82f6"
                             }}>
                         {delivery.status}
                       </span>
                       <p className="text-[10px] font-bold mt-2 uppercase tracking-tighter" style={{ color: '#94a3b8' }}>{delivery.time}</p>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
