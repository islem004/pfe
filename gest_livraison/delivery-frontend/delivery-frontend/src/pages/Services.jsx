import React from "react";
import { Package, Truck, Clock, ShieldCheck, MapPin, PlusCircle, Printer, CheckCircle, MousePointerClick } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Footer from "../components/layout/Footer";
import GlassBackButton from "../components/ui/GlassBackButton";

export default function Services() {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return (
    <div className="min-h-screen text-left bg-white overflow-hidden">
      <GlassBackButton />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .inter-font { font-family: 'Inter', sans-serif; }
        .glass-nav {
            background: #ffffff;
            border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        }
        .hero-curve {
            position: relative;
            background: #3b82f6;
            padding-bottom: 12rem;
            clip-path: ellipse(150% 100% at 50% 0%);
        }
        .step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: #3b82f6;
            color: white;
            border-radius: 50%;
            font-weight: 900;
            font-size: 1.2rem;
            margin-right: 1.5rem;
            flex-shrink: 0;
            box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
        }
      `}</style>

      {/* Navigation */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 h-24 flex items-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="SwiftDeliver" className="w-10 h-10 rounded-xl object-contain" />
              <span className="text-2xl font-black inter-font tracking-tight text-[#0f172a]">SwiftDeliver</span>
            </Link>
            <div className="flex items-center gap-8">
              <div className="hidden md:flex items-center gap-8">
                <Link to="/services" className="text-xs font-black uppercase tracking-widest text-[#3b82f6] inter-font">Services</Link>
                <Link to="/about" className="text-xs font-black uppercase tracking-widest text-[#64748b] hover:text-[#0f172a] transition-colors inter-font">About Us</Link>
                <Link to="/commitments" className="text-xs font-black uppercase tracking-widest text-[#64748b] hover:text-[#0f172a] transition-colors inter-font">Commitments</Link>
              </div>
              <div className="flex items-center gap-6">
                <Link to="/login" className="text-sm font-black uppercase tracking-widest hover:opacity-70 transition-all inter-font text-[#0f172a]">
                  Login
                </Link>
                <Button
                  className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-200 transition-transform active:scale-95 bg-[#3b82f6] text-white"
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
      <section className="hero-curve pt-48 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 text-center text-white relative z-10">
          <h1 className="text-7xl md:text-8xl font-black inter-font tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            OUR <br /> SERVICES
          </h1>
          <div className="w-24 h-2 bg-white/30 mx-auto rounded-full mb-12"></div>
          <p className="text-xl md:text-2xl font-bold inter-font opacity-90 max-w-2xl mx-auto leading-relaxed">
            Simple, efficient delivery and collection solutions designed for modern businesses.
          </p>
        </div>
      </section>

      {/* Welcome Tagline */}
      <section className="py-24 px-6 sm:px-10 lg:px-12 -mt-20 relative z-20">
        <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-12 shadow-2xl shadow-blue-100 border border-slate-100 text-center">
          <h2 className="text-2xl md:text-3xl font-black inter-font text-[#0f172a] leading-tight">
            THE SIMPLICITY OF THE <br />
            <span className="text-[#3b82f6]">PICK-UP & DELIVERY</span> EXPERIENCE.
          </h2>
        </div>
      </section>

      {/* Livraison (Delivery) Section */}
      <section id="delivery" className="py-24 px-6 sm:px-10 lg:px-12 overflow-hidden scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20">
                <Truck className="size-5 text-[#3b82f6]" />
                <span className="text-xs font-black uppercase tracking-widest text-[#3b82f6]">Reliable Shipping</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black inter-font text-[#0f172a] leading-tight">
                DELIVERY <br />
                <span className="text-[#3b82f6]">SOLUTIONS</span>
              </h2>
              <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
                Take advantage of our home parcel delivery service within 48 hours, 7 days a week.
              </p>
              <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
                We are committed to offering you a punctual and secure delivery, with particular attention paid to the integrity of each shipment. With our specialized last-mile service, you can rest assured that your packages are in good hands from the moment they are dispatched until final delivery.
              </p>
              <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
                Simplify your shipments and trust our expertise to ensure your packages arrive at their destination with complete confidence.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-10 bg-blue-500/5 rounded-[4rem] blur-3xl"></div>
              <div className="relative p-4 bg-slate-100 rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden group">
                <img
                  src="/assets/services_delivery.png"
                  alt="Delivery Service"
                  className="rounded-[3.5rem] w-full transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/40 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pick-up Section */}
      <section id="pickup" className="py-24 px-6 sm:px-10 lg:px-12 bg-[#f8fafc] scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="rounded-[4rem] bg-slate-100 border border-slate-200 aspect-[4/3]"></div>
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-[#0f172a]/5 border border-[#0f172a]/10">
                <MapPin className="size-5 text-[#0f172a]" />
                <span className="text-xs font-black uppercase tracking-widest text-[#0f172a]">On-site Collection</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black inter-font text-[#0f172a] leading-tight">
                DOOR TO DOOR <br />
                <span className="text-[#3b82f6]">PICK UP</span>
              </h2>
              <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
                SwiftDeliver provides its senders with a home parcel pick-up service available Monday to Sunday, 7/7.
              </p>
              <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
                Enjoy the convenience of not having to leave your home or warehouse to ship your parcels. Our pick-up service at your doorstep is there to simplify your life and offer you peace of mind by guaranteeing that your packages are taken care of in complete safety.
              </p>
              <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
                Opt for simplicity with our Home Parcel Pickup Service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-32 px-6 sm:px-10 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black inter-font text-[#0f172a] mb-6 animate-pulse">HOW IT WORKS</h2>
            <div className="w-24 h-2 bg-[#3b82f6] mx-auto rounded-full"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <Step 
                number="1" 
                icon={MousePointerClick} 
                title="Log In" 
                desc="Access your secure dashboard to manage all your delivery operations."
              />
              <Step 
                number="2" 
                icon={PlusCircle} 
                title="Add Your Parcels" 
                desc="Input destination details and parcel specifications in seconds."
              />
              <Step 
                number="3" 
                icon={Printer} 
                title="Print Your Labels" 
                desc="Generate and print standardized delivery slips for tracking."
              />
              <Step 
                number="4" 
                icon={Package} 
                title="Parcel Collection" 
                desc="Our team picks up your parcels directly from your location."
              />
              <Step 
                number="5" 
                icon={CheckCircle} 
                title="Delivered in 48h" 
                desc="Fast and secure delivery to the final destination within two days."
              />
            </div>
            
            <div className="hidden lg:block relative">
              <div className="absolute -inset-20 bg-blue-500/5 rounded-full blur-[100px]"></div>
              <div className="relative scale-110">
                <div className="p-8 bg-slate-50 rounded-[4rem] border-8 border-white shadow-2xl">
                    <img 
                        src="/assets/services_process.png" 
                        alt="Logistics Technology" 
                        className="rounded-[3rem] w-full"
                    />
                </div>
                {/* Floating elements */}
                <div className="absolute -top-10 -right-10 p-6 bg-white rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="size-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Status</p>
                        <p className="text-sm font-black text-[#0f172a]">Successfully Delivered</p>
                    </div>
                </div>
                <div className="absolute -bottom-10 -left-10 p-6 bg-white rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Clock className="size-6 text-[#3b82f6]" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Timing</p>
                        <p className="text-sm font-black text-[#0f172a]">Under 48 Hours</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#0f172a] text-center px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-10 inter-font">READY TO SCALE YOUR BUSINESS?</h2>
            <Button
            className="h-16 px-12 rounded-full font-black uppercase tracking-widest text-xs bg-[#3b82f6] text-white hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-blue-500/20"
            onClick={() => navigate("/register")}
            >
            Become a Swift Partner
            </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const Step = ({ number, icon: Icon, title, desc }) => (
  <div className="flex items-start group hover:-translate-x-2 transition-transform duration-300">
    <div className="step-number group-hover:scale-110 transition-transform">{number}</div>
    <div className="flex-1 p-6 rounded-3xl border border-slate-100 bg-slate-50/50 group-hover:bg-white group-hover:shadow-xl group-hover:border-blue-100 transition-all">
      <div className="flex items-center gap-4 mb-2">
        <Icon className="size-5 text-[#3b82f6]" />
        <h3 className="text-xl font-bold text-[#0f172a] inter-font">{title}</h3>
      </div>
      <p className="text-sm font-semibold text-[#64748b] leading-relaxed">
        {desc}
      </p>
    </div>
  </div>
);
