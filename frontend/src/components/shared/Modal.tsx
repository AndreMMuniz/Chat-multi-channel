"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** One of: max-w-sm | max-w-md | max-w-lg | max-w-xl | max-w-2xl | max-w-3xl */
  maxWidth?: "max-w-sm" | "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl" | "max-w-3xl";
}

const MAX_WIDTH_MAP: Record<NonNullable<ModalProps["maxWidth"]>, number> = {
  "max-w-sm":  384,
  "max-w-md":  448,
  "max-w-lg":  512,
  "max-w-xl":  576,
  "max-w-2xl": 672,
  "max-w-3xl": 768,
};

export default function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-md",
}: ModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const maxPx = MAX_WIDTH_MAP[maxWidth];

  // createPortal renders directly to <body>, escaping any overflow/stacking-context
  // constraints in the component tree. Inline styles on the modal box guarantee
  // correct dimensions regardless of which Tailwind classes the JIT includes.
  const content = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "absolute", inset: 0 }}
        className="bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: maxPx,
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
        className="bg-white rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E9ECEF] shrink-0">
          <h3 className="font-semibold text-slate-900 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1">
          {children}
        </div>
      </motion.div>
    </div>
  );

  // On the server (SSR) document is not available — render inline so hydration matches
  if (typeof document === "undefined") return content;
  return createPortal(content, document.body);
}
