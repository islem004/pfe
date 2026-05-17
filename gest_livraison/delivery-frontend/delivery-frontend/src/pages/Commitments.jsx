import React from "react";
import { ShieldCheck, Zap, HeartHandshake, Award, Cpu, UserCheck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import GlassBackButton from "../components/ui/GlassBackButton";

export default function Commitments() {
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
                <Link to="/about" className="text-xs font-black uppercase tracking-widest text-[#64748b] hover:text-[#0f172a] transition-colors inter-font">About Us</Link>
                <Link to="/commitments" className="text-xs font-black uppercase tracking-widest text-[#3b82f6] inter-font">Commitments</Link>
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
            OUR <br /> COMMITMENTS
          </h1>
          <div className="w-24 h-2 bg-white/30 mx-auto rounded-full mb-12"></div>
        </div>
      </section>

      {/* Title Section */}
      <section className="py-24 px-6 sm:px-10 lg:px-12 -mt-32 relative z-20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black inter-font text-[#0f172a] mb-4">
             Our Commitment to <span className="text-[#1e3a8a]">Quality</span>
          </h2>
          <div className="flex justify-center">
             <div className="w-20 h-1.5 bg-[#1e3a8a]/40 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* The Promise Section */}
      <section className="pb-32 px-6 sm:px-10 lg:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
                    <ShieldCheck className="size-4 text-[#3b82f6]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#3b82f6]">Unwavering Reliability</span>
                </div>
                <h3 className="text-4xl font-black inter-font text-[#0f172a] leading-tight">
                    Every Delivery is a <br />
                    <span className="text-[#1e3a8a]">Promise Kept</span>
                </h3>
                <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
                    We consider every delivery as a personal promise to our shippers and business partners. 
                    At SwiftDeliver, we have engraved in our values the absolute reliability that our 
                    partners depend on.
                </p>
                <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed">
                    Every parcel we transport becomes a token of quality—a symbol of our engagement 
                    towards operational excellence, unwavering reliability, and the total satisfaction 
                    of our clients.
                </p>
                <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <Award className="size-6 text-[#3b82f6]" />
                    <p className="text-sm font-black text-[#0f172a] uppercase tracking-wider">
                        Exceptional delivery, at every moment.
                    </p>
                </div>
            </div>
            <div className="relative">
                <div className="rounded-[4rem] bg-slate-100 border border-slate-200 aspect-[4/3]"></div>
            </div>
        </div>
      </section>

      {/* Expertise & Innovation Section */}
      <section className="py-32 px-6 sm:px-10 lg:px-12 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative order-2 lg:order-1">
                <div className="rounded-[4rem] bg-slate-100 border border-slate-200 aspect-[4/3]"></div>
            </div>
            <div className="space-y-8 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200">
                    <UserCheck className="size-4 text-[#0f172a]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0f172a]">Human Expertise</span>
                </div>
                <h3 className="text-4xl font-black inter-font text-[#0f172a] leading-tight text-right">
                    Expertise and Enthusiasm <br />
                    <span className="text-[#1e3a8a]">Driven by People</span>
                </h3>
                <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed text-right ml-auto max-w-lg">
                    At the heart of SwiftDeliver, the expertise and enthusiasm of every team member is 
                    the ultimate key to our success. We invest in people, ensuring that our team 
                    is always ready to go the extra mile for your business.
                </p>
                <p className="text-lg font-bold inter-font text-[#64748b] leading-relaxed text-right ml-auto max-w-lg">
                    Our professional team is backed by a determined, reactive, and reliable administration. 
                    Always at the forefront of technical progress, we provide our staff with the tools 
                    necessary to serve our shippers with unmatched precision.
                </p>
                <div className="flex items-center justify-end gap-4 p-6 bg-white rounded-3xl border border-slate-100 ml-auto max-w-md">
                    <p className="text-sm font-black text-[#0f172a] uppercase tracking-wider text-right">
                        Making every delivery a <br />history of success.
                    </p>
                    <div className="size-12 rounded-xl bg-[#3b82f6] flex items-center justify-center shrink-0">
                        <Zap className="size-6 text-white" />
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Call to Action Transition */}
      <section className="py-40 px-6 sm:px-10 lg:px-12 text-center bg-white">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black inter-font text-[#0f172a] mb-12 uppercase tracking-tighter">
                READY TO WORK WITH A TEAM <br />
                THAT <span className="text-[#1e3a8a]">DELIVERS ON PROMISES?</span>
            </h2>
        </div>
      </section>

      <Footer />
    </div>
  );
}
