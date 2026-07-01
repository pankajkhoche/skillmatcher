import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroSplash({ onDone }) {
  const [show, setShow] = useState(() => !sessionStorage.getItem("tiq_intro_seen"));

  useEffect(() => {
    if (!show) { onDone?.(); return; }
    const t = setTimeout(() => {
      sessionStorage.setItem("tiq_intro_seen", "1");
      setShow(false);
      onDone?.();
    }, 2400);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] bg-[#06060B] flex items-center justify-center overflow-hidden"
        >
          {/* Ambient glow */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.5] }}
            transition={{ duration: 2.4, ease: "easeOut" }}
            className="absolute w-[600px] h-[600px] rounded-full blur-[120px] brand-bg opacity-30"
          />
          {/* Morphing 3D cube */}
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: [0, 1.1, 1], rotate: [180, 0], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.4, times: [0, 0.4, 0.8, 1], ease: "easeInOut" }}
            className="absolute"
          >
            <div className="w-32 h-32 relative" style={{ transformStyle: "preserve-3d", animation: "rotate-3d 3s linear infinite" }}>
              <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/60 brand-bg opacity-40" />
              <div className="absolute inset-0 rounded-2xl border-2 border-pink-400/60" style={{ transform: "rotateY(90deg) translateZ(64px)" }} />
              <div className="absolute inset-0 rounded-2xl border-2 border-orange-400/60" style={{ transform: "rotateX(90deg) translateZ(64px)" }} />
            </div>
          </motion.div>
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: [0, 1, 1, 0], y: [30, 0, 0, -10], filter: ["blur(10px)", "blur(0)", "blur(0)", "blur(4px)"] }}
            transition={{ duration: 2.4, times: [0, 0.4, 0.85, 1], ease: [0.16, 1, 0.3, 1] }}
            className="relative text-center z-10"
          >
            <div className="overline mb-3 text-zinc-500">— Welcome to —</div>
            <div className="font-heading font-light text-7xl sm:text-8xl tracking-tighter">
              Talent<span className="brand-text italic font-normal">IQ</span>
            </div>
            <div className="mt-3 font-mono text-xs uppercase tracking-[0.4em] text-zinc-500">Your career, engineered.</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
