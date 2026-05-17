import React from 'react';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="w-full">
            {/* Main Links Section */}
            <div className="bg-white py-20 px-6 sm:px-10 lg:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-8">
                        {/* Brand Column */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <img src="/logo.png" alt="SwiftDeliver" className="w-12 h-12 rounded-xl object-contain" />
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black inter-font tracking-tighter text-[#0f172a]">SWIFT</span>
                                    <span className="text-xl font-bold inter-font tracking-[0.2em] text-[#64748b] -mt-2">DELIVERY</span>
                                </div>
                            </div>
                            <p className="text-sm font-bold inter-font text-[#64748b] leading-loose uppercase tracking-wider">
                                YOUR PARTNER IN <br />
                                DELIVERY SOLUTIONS #1
                            </p>
                        </div>

                        {/* Swift Group */}
                        <div>
                            <h3 className="text-xl font-black inter-font text-[#3b82f6] mb-8 uppercase tracking-wider">
                                Swift Group
                            </h3>
                            <ul className="space-y-4">
                                <FooterLink to="/about">About Us</FooterLink>
                                <FooterLink to="/commitments">Our Commitments</FooterLink>
                            </ul>
                        </div>

                        {/* Swift Services */}
                        <div>
                            <h3 className="text-xl font-black inter-font text-[#3b82f6] mb-8 uppercase tracking-wider">
                                Swift Services
                            </h3>
                            <ul className="space-y-4">
                                <FooterLink to="/services#delivery">Delivery</FooterLink>
                                <FooterLink to="/services#pickup">Pick up</FooterLink>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="space-y-8">
                            <h3 className="text-xl font-black inter-font text-[#3b82f6] mb-8 uppercase tracking-wider">
                                Contact
                            </h3>
                            <div className="space-y-6">
                                <ContactItem 
                                    icon={MapPin} 
                                    text="Sousse Sahloul, Tunisia" 
                                />
                                <ContactItem 
                                    icon={Mail} 
                                    text="contact@swiftdeliver.com" 
                                />
                                <div className="pt-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-2">Customer Service</p>
                                    <div className="flex items-center gap-3">
                                        <Phone className="size-4 text-[#3b82f6]" />
                                        <span className="text-lg font-black text-[#0f172a]">+216 36 010 550</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-[#0f172a] py-8 px-6 sm:px-10 lg:px-12 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#94a3b8]">
                        ©2026 All Rights Reserved.
                    </p>

                    <div className="flex items-center gap-5">
                        <SocialIcon icon={Facebook} />
                        <SocialIcon icon={Instagram} />
                    </div>
                </div>
            </div>
        </footer>
    );
};

const FooterLink = ({ to, children }) => (
    <li>
        <Link to={to} className="text-sm font-bold inter-font text-[#475569] hover:text-[#3b82f6] transition-colors duration-300">
            {children}
        </Link>
    </li>
);

const ContactItem = ({ icon: Icon, text }) => (
    <div className="flex items-start gap-4">
        <Icon className="size-5 text-[#3b82f6] shrink-0 mt-1" />
        <span className="text-sm font-bold text-[#475569] leading-relaxed">
            {text}
        </span>
    </div>
);

const SocialIcon = ({ icon: Icon }) => (
    <a 
        href="#" 
        className="p-2 rounded-lg bg-white/5 hover:bg-[#3b82f6] text-[#94a3b8] hover:text-white transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
    >
        <Icon className="size-5" />
    </a>
);

export default Footer;
