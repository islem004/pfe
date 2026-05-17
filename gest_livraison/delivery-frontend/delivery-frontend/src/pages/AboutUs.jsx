import React from "react";
import { ShieldCheck, Zap, HeartHandshake, Eye, Star, MapPin, Truck, LayoutDashboard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import GlassBackButton from "../components/ui/GlassBackButton";

export default function AboutUs() {
  const navigate = useNavigate();

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
            padding-bottom: 15rem;
            clip-path: ellipse(150% 100% at 50% 0%);
        }
        .text-gradient {
            background: linear-gradient(to bottom right, #0f172a, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
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
                <Link to="/services" className="text-xs font-black uppercase tracking-widest text-[#64748b] hover:text-[#0f172a] transition-colors inter-font">Services</Link>
                <Link to="/about" className="text-xs font-black uppercase tracking-widest text-[#3b82f6] inter-font">About Us</Link>
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
            ABOUT <br /> SWIFTDELIVER?
          </h1>
          <div className="w-24 h-2 bg-white/30 mx-auto rounded-full mb-12"></div>
        </div>
      </section>

      {/* Intro Tagline */}
      <section className="py-24 px-6 sm:px-10 lg:px-12 -mt-32 relative z-20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black inter-font text-[#0f172a] mb-8 leading-tight">
            SWIFTDELIVER YOUR PARTNER IN <br />
            <span className="text-[#3b82f6]">B2B LOGISTICS SOLUTIONS #1</span> IN TUNISIA
          </h2>
          <div className="flex justify-center mb-12">
            <div className="size-20 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center">
              <Truck className="size-10 text-[#3b82f6]" />
            </div>
          </div>
        </div>
      </section>

      {/* Company Story & Illustration */}
      <section className="pb-32 px-6 sm:px-10 lg:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
              Positioned as an essential player specialized in B2B transport and delivery solutions,
              SwiftDeliver is a technology-driven logistics company founded to address the unique
              needs of modern businesses across the country.
            </p>
            <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
              Recognized for our expertise in handling both large-scale distribution and quick-packet
              deliveries, we offer our partners a complete service from the first-mile collection
              to the final-mile destination, backed by real-time tracking and automated financial reporting.
            </p>
            <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
              SwiftDeliver ensures a fast, efficient service thanks to a robust
              24/7 support network and specialized payment processing solutions.
              Trust our team to help you achieve your logistics goals with precision and transparency.
            </p>
          </div>
          <div className="relative">
            <div className="rounded-[4rem] bg-slate-100 border border-slate-200 aspect-[4/3]"></div>
          </div>
        </div>
      </section>

      {/* Our Values Grid */}
      <section className="py-32 px-6 sm:px-10 lg:px-12 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black inter-font text-[#0f172a] mb-4">OUR CORE VALUES</h2>
            <div className="w-20 h-1.5 bg-[#3b82f6] mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <ValueCard
              icon={ShieldCheck}
              title="Reliability"
              desc="Precision and security are at our core. We view reliability as a commitment to consistency, predictability, and business trust."
            />
            <ValueCard
              icon={Zap}
              title="Speed"
              desc="Every action we take is guided by our commitment to offering an exceptional, time-sensitive delivery experience."
            />
            <ValueCard
              icon={HeartHandshake}
              title="Partnership"
              desc="Solidarity and respect for our shippers and partners drive our daily operations and long-term growth."
            />
            <ValueCard
              icon={Star}
              title="Excellence"
              desc="We passionately consider every team member a contributor to achieving the highest standards in the industry."
            />
            <ValueCard
              icon={Eye}
              title="Transparency"
              desc="Responsibility and honesty are central to our relationships. We provide honest information and take responsibility for our actions."
            />
            <ValueCard
              icon={LayoutDashboard}
              title="Technology"
              desc="Leveraging advanced tracking and automated invoicing to give our B2B partners full control over their logistics lifecycle."
            />
          </div>
        </div>
      </section>

      {/* Regional Strength & Fleet */}
      <section className="py-32 px-6 sm:px-10 lg:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 relative group">
            <div className="absolute -inset-10 bg-blue-500/10 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative p-2 bg-slate-100 rounded-[4rem] overflow-hidden shadow-2xl border border-slate-100">
              <img
                src="/assets/tunisia_logistics.png"
                alt="Tunisia Regional Logistics Network"
                className="rounded-[3.8rem] w-full transform group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute top-8 left-8 p-4 bg-white/90 backdrop-blur rounded-2xl border border-slate-100 shadow-xl flex items-center gap-3">
                <MapPin className="size-5 text-[#3b82f6]" />
                <span className="text-sm font-black text-[#0f172a] uppercase tracking-wider">Sousse Sahloul Regional Hub</span>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-4xl font-black inter-font text-[#0f172a] leading-tight">
              NETWORK OF <br />
              <span className="text-[#3b82f6]">REGIONAL AGENCIES</span>
            </h2>
            <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
              With strategically distributed agencies across Tunisia, including our key hub in
              <span className="text-[#0f172a] ml-1">Sousse Sahloul</span>, we strive to offer
              a hassle-free delivery experience every time you call on our services.
            </p>
            <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
              We manage a fleet of modern delivery vehicles equipped with latest security
              technologies. This allowed us to manage a variety of parcels, from small packets
              to large-scale B2B orders, ensuring their integrity throughout the process.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div>
                <div className="text-4xl font-black text-[#0f172a]">14+</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#64748b] mt-1">Agencies</div>
              </div>
              <div>
                <div className="text-4xl font-black text-[#0f172a]">450+</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#64748b] mt-1">Vehicles</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Footer transition */}
      <div className="py-24 bg-[#0f172a] text-center px-6">
        <h2 className="text-4xl font-black text-white mb-10 inter-font">JOIN OUR B2B NETWORK</h2>
      </div>

      <Footer />
    </div>
  );
}

const ValueCard = ({ icon: Icon, title, desc }) => (
  <Card className="p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group bg-white">
    <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 group-hover:bg-[#3b82f6] transition-colors duration-500">
      <Icon className="size-8 text-[#3b82f6] group-hover:text-white transition-colors duration-500" />
    </div>
    <h3 className="text-2xl font-black inter-font text-[#0f172a] mb-4">{title}</h3>
    <p className="text-sm font-semibold inter-font text-[#64748b] leading-relaxed">
      {desc}
    </p>
  </Card>
);
