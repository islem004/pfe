import React from "react";
import { Package, TruckIcon, FileText, MapPin, Clock, Shield, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../components/layout/Footer";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-left" style={{ backgroundColor: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        .inter-font {
            font-family: 'Inter', sans-serif;
        }
        
        .glass-nav {
            background: #ffffff;
            border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        }
      `}</style>

      {/* Navigation */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SwiftDeliver" className="w-10 h-10 rounded-xl object-contain" />
              <span className="text-2xl font-black inter-font tracking-tight" style={{ color: '#0f172a' }}>SwiftDeliver</span>
            </div>
            <div className="flex items-center gap-10">
              <div className="hidden md:flex items-center gap-8">
                <Link to="/services" className="text-xs font-black uppercase tracking-widest text-[#64748b] hover:text-[#0f172a] transition-colors inter-font">Services</Link>
                <Link to="/about" className="text-xs font-black uppercase tracking-widest text-[#64748b] hover:text-[#0f172a] transition-colors inter-font">About Us</Link>
                <Link to="/commitments" className="text-xs font-black uppercase tracking-widest text-[#64748b] hover:text-[#0f172a] transition-colors inter-font">Commitments</Link>
              </div>
              <div className="flex items-center gap-6">
                <Link to="/login" className="text-sm font-black uppercase tracking-widest hover:opacity-70 transition-all inter-font text-[#0f172a]">
                  Login
                </Link>
                <Button 
                  className="rounded-xl px-6 h-10 font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-200 transition-transform active:scale-95 bg-[#3b82f6] text-white"
                  onClick={() => navigate("/register")}
                >
                  Create an Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 sm:px-10 lg:px-12 overflow-hidden relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <span className="size-2 rounded-full animate-pulse" style={{ backgroundColor: '#3b82f6' }}></span>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Professional B2B Logistics</span>
              </div>
              <h1 className="text-5xl font-black inter-font leading-[1.05] mb-6" style={{ color: '#0f172a' }}>
                Streamline Your <br />
                <span style={{ color: '#3b82f6' }}>Delivery</span> Operations
              </h1>
              <p className="text-base inter-font leading-relaxed max-w-lg mb-8" style={{ color: '#475569', fontWeight: 500 }}>
                The complete delivery management solution for creating deliveries, 
                tracking shipments in real-time, and managing invoices—all in one place.
              </p>
              <div className="flex flex-wrap gap-6">
                <Button 
                    size="lg"
                    className="h-11 px-8 rounded-[1.25rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-blue-200 transition-transform active:scale-95"
                    style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                    onClick={() => navigate("/register")}
                >
                  Create an Account <ArrowRight className="size-4" />
                </Button>
              </div>
              
              <div className="mt-8 flex items-center gap-8">
                <div>
                  <div className="text-4xl font-black inter-font" style={{ color: '#0f172a' }}>10K+</div>
                  <div className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: '#64748b' }}>Active Businesses</div>
                </div>
                <div className="w-[1px] h-10" style={{ backgroundColor: '#e2e8f0' }}></div>
                <div>
                  <div className="text-4xl font-black inter-font" style={{ color: '#0f172a' }}>500K+</div>
                  <div className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: '#64748b' }}>Packets Delivered</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-10 bg-blue-500/5 rounded-[3rem] blur-3xl -z-10"></div>
              <div className="relative p-4 bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border" style={{ borderColor: '#e2e8f0' }}>
                <img 
                  src="https://images.unsplash.com/photo-1760662052295-f84068499a03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMHRydWNrJTIwbG9naXN0aWNzfGVufDF8fHx8MTc3MTMzMTI1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Delivery truck"
                  className="rounded-[2.5rem] w-full"
                />
                
                {/* Floating Card */}
                <div 
                    className="absolute -bottom-10 -left-10 p-6 rounded-[2rem] shadow-2xl border flex items-center gap-4 animate-bounce"
                    style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
                >
                    <div className="size-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>
                        <TruckIcon className="size-6" style={{ color: '#3b82f6' }} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Live Status</p>
                        <p className="text-sm font-black inter-font" style={{ color: '#0f172a' }}>Out for Delivery</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-32 px-6 sm:px-10 lg:px-12" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black inter-font mb-6" style={{ color: '#0f172a' }}>
              Everything You Need to Scale
            </h2>
            <p className="text-lg inter-font max-w-2xl mx-auto" style={{ color: '#475569' }}>
              Our comprehensive platform provides all the tools to run your delivery 
              business efficiently and professionally.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
                icon={Package} 
                title="Create Deliveries" 
                desc="Quickly create and schedule deliveries with our intuitive interface. Add customer details and preferences in seconds."
                color="#3b82f6"
            />
            <FeatureCard 
                icon={MapPin} 
                title="Real-Time Tracking" 
                desc="Track every delivery in real-time with GPS monitoring. Keep customers informed with live updates."
                color="#0f172a"
            />
            <FeatureCard 
                icon={FileText} 
                title="Invoice Management" 
                desc="Generate professional invoices automatically. Track payments and maintain complete financial records."
                color="#475569"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 sm:px-10 lg:px-12">
        <div className="max-w-5xl mx-auto rounded-[4rem] p-20 text-center relative overflow-hidden shadow-2xl" style={{ backgroundColor: '#0f172a' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          <h2 className="text-5xl font-black inter-font text-white mb-8 relative z-10">
            Ready to Transform Your <br />
            Delivery Business?
          </h2>
          <p className="text-xl inter-font mb-12 relative z-10" style={{ color: '#94a3b8' }}>
            Join thousands of businesses already using SwiftDeliver to streamline their operations.
          </p>
          <div className="flex flex-wrap gap-6 justify-center relative z-10">
            <Button 
                size="lg" 
                className="h-16 px-12 rounded-[2rem] font-black uppercase tracking-widest text-xs transform transition hover:scale-105 active:scale-95" 
                style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                onClick={() => navigate("/register")}
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
    <Card className="p-10 rounded-[3rem] border shadow-sm hover:shadow-2xl transition-all duration-500 group" style={{ borderColor: '#e2e8f0' }}>
        <div 
            className="size-16 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg" 
            style={{ backgroundColor: color }}
        >
            <Icon className="size-8 text-white" />
        </div>
        <h3 className="text-2xl font-black inter-font mb-4" style={{ color: '#0f172a' }}>{title}</h3>
        <p className="text-sm inter-font leading-relaxed" style={{ color: '#475569', fontWeight: 500 }}>
            {desc}
        </p>
    </Card>
);
