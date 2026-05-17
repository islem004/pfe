import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const GlassBackButton = ({ dark = false }) => {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, backgroundColor: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate("/");
        }
      }}
      className={`fixed top-8 left-8 z-[100] flex items-center gap-2.5 px-4 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 ${
        dark 
          ? "bg-white/5 border-white/10 text-white/70 hover:text-white" 
          : "bg-white/30 border-slate-200/50 text-slate-600 hover:text-[#0f172a] shadow-sm hover:shadow-md"
      }`}
    >
      <ArrowLeft className="size-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.15em] inter-font">Back</span>
    </motion.button>
  );
};

export default GlassBackButton;
