"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EnquiryModal from "@/components/EnquiryModal";
import { ArrowLeft, Home, BookOpen, Building2, PhoneCall } from "lucide-react";

export default function NotFound() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#333333]">
      <Navbar onOpenEnquiry={() => setModalOpen(true)} />

      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-xl mx-auto text-center bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-50 text-[#b69455] font-black text-3xl mb-6 shadow-inner border border-amber-100">
            404
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Page Could Not Be Loaded
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            The link you followed may be broken, renamed, or the page may have been temporarily moved.
          </p>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
            <Link
              href="/"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-[#b69455] hover:bg-amber-50/40 transition group no-underline"
            >
              <div className="w-9 h-9 rounded-lg bg-[#094b57]/10 text-[#094b57] flex items-center justify-center group-hover:bg-[#094b57] group-hover:text-white transition">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Return Home</div>
                <div className="text-[11px] text-slate-500">Back to main overview</div>
              </div>
            </Link>

            <Link
              href="/blogs"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-[#b69455] hover:bg-amber-50/40 transition group no-underline"
            >
              <div className="w-9 h-9 rounded-lg bg-[#b69455]/10 text-[#b69455] flex items-center justify-center group-hover:bg-[#b69455] group-hover:text-white transition">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Financial Blogs</div>
                <div className="text-[11px] text-slate-500">Read guides & insights</div>
              </div>
            </Link>

            <Link
              href="/msme"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-[#b69455] hover:bg-amber-50/40 transition group no-underline"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">MSME & Subsidy</div>
                <div className="text-[11px] text-slate-500">Business setup & loans</div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-[#b69455] hover:bg-amber-50/40 transition group text-left bg-white cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Free Consultation</div>
                <div className="text-[11px] text-slate-500">Talk to financial expert</div>
              </div>
            </button>
          </div>

          <Link
            href="/blogs"
            className="inline-flex items-center justify-center gap-2 bg-[#094b57] hover:bg-[#073942] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm no-underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Explore All Financial Blogs</span>
          </Link>
        </div>
      </main>

      <Footer />

      {modalOpen && (
        <EnquiryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialCategory="Loans"
        />
      )}
    </div>
  );
}
