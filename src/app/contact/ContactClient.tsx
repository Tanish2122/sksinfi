"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EnquiryModal from "@/components/EnquiryModal";
import { submitContactEnquiry } from "@/lib/supabase";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Award,
  Sparkles,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  Zap
} from "lucide-react";

const SANS_FONT = "var(--font-poppins), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const REGIONAL_BRANCHES = [
  { city: "Jaipur (HQ)", state: "Rajasthan", desc: "520, Sunny Trade Centre, New Aatish Market" },
  { city: "Jaipur (Branch)", state: "Rajasthan", desc: "Patrakar Colony, Mansarovar" },
  { city: "New Delhi", state: "Delhi NCR", desc: "Surya Kiran Building, Connaught Place" },
  { city: "Ahmedabad", state: "Gujarat", desc: "Titanium City Centre, Anand Nagar Road" },
  { city: "Jodhpur", state: "Rajasthan", desc: "Commercial & Business Loans Desk" },
  { city: "Kishangarh", state: "Rajasthan", desc: "Marble Industry Project Finance Hub" },
  { city: "Sikar", state: "Rajasthan", desc: "Retail & Housing Loan Branch" },
  { city: "Barmer", state: "Rajasthan", desc: "Energy & Infrastructure MSME Advisory" },
  { city: "Balotra", state: "Rajasthan", desc: "Textile & Dyeing Industry Loans" },
  { city: "Sri Ganganagar", state: "Rajasthan", desc: "Agri-Business & Trade Finance" },
  { city: "Bhilwara", state: "Rajasthan", desc: "Textile City Project Funding" },
  { city: "Aurangabad", state: "Maharashtra", desc: "Industrial Manufacturing Desk" }
];

const FAQS = [
  {
    q: "Is the initial financial consultation completely free?",
    a: "Yes, our initial consultation is 100% free of charge with zero obligation. Our chartered accountants and senior loan advisors evaluate your requirements, review your eligibility, and recommend the best banks, subsidy schemes, and loan structures tailored to your profile."
  },
  {
    q: "How fast will an advisor contact me after I submit this form?",
    a: "During our standard business hours (Monday to Saturday, 9:30 AM – 7:30 PM IST), an advisor typically calls you within 15 minutes. For inquiries submitted after hours, our team will connect with you first thing the next morning."
  },
  {
    q: "How can Non-Resident Indians (NRIs) consult from abroad?",
    a: "We operate a dedicated 24/7 NRI Support Desk accessible via WhatsApp (+91 99285 93122), Google Meet, or international phone calls. We regularly advise NRIs residing in the UK, UAE, USA, Australia, and Canada on home loans, FEMA compliances, and mutual fund portfolios."
  },
  {
    q: "Can I visit your office in person for a confidential discussion?",
    a: "Yes! You are most welcome to visit our Corporate Headquarters at 520, 5th Floor, Sunny Trade Centre, New Aatish Market, Mansarovar, Jaipur, or our regional offices in New Delhi (Connaught Place) and Ahmedabad (Titanium City Centre)."
  },
  {
    q: "What documents should I keep ready for a loan or subsidy enquiry?",
    a: "For initial advisory, basic details like last 6 months' bank statements, recent ITRs/Form 16, and KYC documents are helpful. However, you do not need all documents upfront — our team will provide a tailored document checklist after our initial call."
  }
];

const SERVICES_LIST = [
  "Home Loan & Balance Transfer",
  "Loan Against Property (LAP)",
  "MSME Subsidy & Project Finance",
  "Mutual Fund & SIP Planning",
  "NRI Financial & Property Advisory",
  "Business & Working Capital Loan",
  "Taxation, GST & Audit Compliances"
];

export default function ContactClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState("Loans");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Jaipur",
    service: "Home Loan & Balance Transfer",
    amount: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const openEnquiry = (cat = "Loans") => {
    setModalCategory(cat);
    setModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Please enter your full name.");
      return;
    }
    const cleanPhone = formData.phone.trim().replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSubmitting(true);

    try {
      await submitContactEnquiry({
        name: formData.name.trim(),
        email: formData.email.trim() || "no-email@sksinfi.com",
        phone: cleanPhone,
        address: `${formData.city} (Service: ${formData.service}${formData.amount ? `, Amt: ${formData.amount}` : ""})`,
        message: formData.message.trim() || `Consultation request for ${formData.service}`
      });

      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: cleanPhone,
          email: formData.email.trim(),
          service: formData.service,
          city: formData.city,
          country: "India",
          message: `Amount: ${formData.amount || "N/A"}\nQuery: ${formData.message || "Consultation requested."}`
        })
      }).catch((e) => console.warn("Email alert notice:", e));

      setSubmitted(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      setFormError("There was an issue submitting your request. Please call us directly at +91 99285 29222.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans antialiased">
        <Navbar onOpenEnquiry={openEnquiry} />

        {/* ============================================================== */}
        {/* COMPACT & ELEGANT HERO BANNER                                  */}
        {/* ============================================================== */}
        <header
          className="compact-section relative px-4 sm:px-6 text-white text-center border-b border-[#0f5f6e]"
          style={{
            background: "linear-gradient(135deg, #062b32 0%, #094b57 65%, #0b5866 100%)",
            paddingTop: "28px",
            paddingBottom: "46px"
          }}
        >
          <div className="max-w-4xl mx-auto relative z-10">
            {/* Breadcrumb - Clean Centered Inline */}
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2.5">
              <Link
                href="/"
                style={{ color: "#e2c17c", display: "inline-flex", width: "auto" }}
                className="hover:text-white transition no-underline items-center"
              >
                Home
              </Link>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>/</span>
              <span style={{ color: "rgba(255,255,255,0.95)" }}>Contact Us</span>
            </div>

            <h1
              style={{ fontFamily: SANS_FONT }}
              className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white m-0"
            >
              Get in Touch with SKS INFI
            </h1>

            <div
              style={{ color: "#e2ecf0", fontFamily: SANS_FONT }}
              className="text-xs sm:text-sm max-w-2xl mx-auto mt-2 font-normal leading-relaxed"
            >
              Whether you need high-value project funding, MSME subsidies, home loan balance transfers, mutual fund SIP planning, or 24/7 NRI wealth consulting — CA Aarun Jain and our senior panel are at your service.
            </div>

            {/* Value Highlights Pill Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15 text-white">
                <Zap size={13} className="text-[#e2c17c]" />
                <span>15-Min Fast Callback</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15 text-white">
                <Award size={13} className="text-[#e2c17c]" />
                <span>₹85+ Cr Loans Facilitated</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15 text-white">
                <Building2 size={13} className="text-[#e2c17c]" />
                <span>12+ City Branches</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15 text-white">
                <Globe size={13} className="text-[#e2c17c]" />
                <span>24/7 NRI Desk (UK, UAE, US, AUS)</span>
              </div>
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 3 QUICK ACCESS CONTACT CARDS                                  */}
        {/* ============================================================== */}
        <div className="px-4 sm:px-6 -mt-7 relative z-20 mb-2">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Helpline Card */}
            <a
              href="tel:+919928529222"
              className="bg-white rounded-xl p-4 sm:p-4.5 shadow-md border border-slate-200/90 hover:border-[#b69455] hover:shadow-lg transition-all duration-200 flex items-center gap-3.5 no-underline group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#094b57]/10 text-[#094b57] flex items-center justify-center shrink-0 group-hover:bg-[#094b57] group-hover:text-white transition duration-200 shadow-2xs">
                <Phone size={20} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Advisory Helpline</div>
                <div className="text-base font-extrabold text-slate-900 group-hover:text-[#094b57] transition truncate">
                  +91 99285 29222
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Mon–Sat, 9:30 AM–7:30 PM IST</div>
              </div>
            </a>

            {/* WhatsApp Card */}
            <a
              href="https://wa.me/919928529222?text=Hello%20SKS%20INFI%20Team%2C%20I%20would%20like%20to%20consult%20regarding%20financial%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl p-4 sm:p-4.5 shadow-md border border-slate-200/90 hover:border-[#25D366] hover:shadow-lg transition-all duration-200 flex items-center gap-3.5 no-underline group"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#25D366] flex items-center justify-center shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition duration-200 shadow-2xs">
                <MessageSquare size={20} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp Fast Desk</div>
                <div className="text-base font-extrabold text-slate-900 group-hover:text-[#25D366] transition truncate">
                  Chat with Senior Advisor
                </div>
                <div className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Instant Response Available
                </div>
              </div>
            </a>

            {/* Official Email Card */}
            <a
              href="mailto:infi@sksinfi.com"
              className="bg-white rounded-xl p-4 sm:p-4.5 shadow-md border border-slate-200/90 hover:border-[#b69455] hover:shadow-lg transition-all duration-200 flex items-center gap-3.5 no-underline group"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#b69455] flex items-center justify-center shrink-0 group-hover:bg-[#b69455] group-hover:text-white transition duration-200 shadow-2xs">
                <Mail size={20} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Official Inquiries</div>
                <div className="text-base font-extrabold text-slate-900 group-hover:text-[#094b57] transition truncate">
                  infi@sksinfi.com
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Corporate & HNI proposals</div>
              </div>
            </a>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN SPLIT SECTION: CORPORATE HUBS (LEFT) + FORM (RIGHT)       */}
        {/* ============================================================== */}
        <section className="compact-section py-6 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ---------------- LEFT PANEL: DIRECT HUBS & OFFICES (5 COLS) ---------------- */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
              
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b69455] uppercase tracking-wider mb-1">
                  <Building2 size={14} />
                  <span>Corporate & Regional Hubs</span>
                </div>
                <h2
                  style={{ fontFamily: SANS_FONT }}
                  className="text-xl sm:text-2xl font-extrabold text-slate-900 m-0"
                >
                  Direct Advisory Channels
                </h2>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Connect with CA Aarun Jain and our specialized practice heads at our corporate offices or via direct channels.
                </div>
              </div>

              {/* Office 1: Corporate HQ */}
              <div className="p-4 rounded-xl bg-slate-50/75 border border-slate-200/80 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin size={15} className="text-[#094b57]" />
                    Corporate Headquarters (Rajasthan)
                  </span>
                  <span className="text-[10px] font-bold text-[#b69455] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 uppercase">
                    Head Office
                  </span>
                </div>
                <div className="text-xs text-slate-600 leading-relaxed pl-5">
                  520, 5th Floor, Sunny Trade Centre, New Aatish Market, Mansarovar, Jaipur – 302020
                </div>
                <div className="mt-2.5 pl-5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    Mon–Sat: 9:30 AM – 7:30 PM
                  </span>
                  <a
                    href="https://maps.google.com/?q=Sunny+Trade+Centre+New+Aatish+Market+Mansarovar+Jaipur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#094b57] font-bold hover:underline flex items-center gap-0.5 no-underline"
                  >
                    View Map <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              {/* Office 2: Jaipur Branch */}
              <div className="p-4 rounded-xl bg-slate-50/75 border border-slate-200/80 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin size={15} className="text-[#094b57]" />
                    Jaipur Branch (Mansarovar)
                  </span>
                  <span className="text-[10px] font-bold text-[#094b57] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 uppercase">
                    Branch Office
                  </span>
                </div>
                <div className="text-xs text-slate-600 leading-relaxed pl-5">
                  Patrakar Colony, Mansarovar, Jaipur, Rajasthan – 302020
                </div>
                <div className="mt-2 pl-5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Retail Loans & Documentation Desk</span>
                  <a
                    href="https://maps.google.com/?q=Patrakar+Colony+Mansarovar+Jaipur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#094b57] font-bold hover:underline flex items-center gap-0.5 no-underline"
                  >
                    View Map <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              {/* Office 3 & 4: Delhi & Gujarat Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/70">
                  <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1">
                    <Building2 size={13} className="text-[#b69455]" />
                    Delhi NCR Office
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug">
                    Surya Kiran Building, KG Marg, Connaught Place, New Delhi – 110001
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/70">
                  <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1">
                    <Building2 size={13} className="text-[#b69455]" />
                    Gujarat Office
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug">
                    E-1006, Titanium City Centre, Anand Nagar Road, Ahmedabad – 380015
                  </div>
                </div>
              </div>

              {/* NRI Worldwide Advisory Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#094b57]/5 to-[#b69455]/10 border border-[#094b57]/20 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#094b57] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Globe size={18} />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900 text-xs mb-0.5">
                    24/7 Global NRI Financial Desk
                  </div>
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    Dedicated support for NRIs in the UK, UAE, USA & Australia. Connect directly for home loans, FEMA compliances, and repatriable mutual funds.
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <a
                      href="https://wa.me/919928593122?text=Hello%2C%20I%20am%20an%20NRI%20and%20would%20like%20to%20consult%20team%20SKS%20INFI."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#094b57] font-bold text-[11px] hover:underline flex items-center gap-1 no-underline"
                    >
                      <MessageSquare size={13} className="text-[#25D366]" />
                      +91 99285 93122 (NRI WhatsApp)
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* ---------------- RIGHT PANEL: CONSULTATION FORM (7 COLS) ---------------- */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
              {submitted ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 style={{ fontFamily: SANS_FONT }} className="text-2xl font-extrabold text-slate-900 mb-2">
                    Consultation Request Received!
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                    Thank you, <strong className="text-slate-900">{formData.name}</strong>. Our senior consultant has received your requirement for <strong className="text-slate-900">{formData.service}</strong> and will call you at <strong className="text-slate-900">{formData.phone}</strong> within 15 minutes.
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <a
                      href="https://wa.me/919928529222?text=Hello%20SKS%20INFI%2C%20I%20just%20submitted%20a%20consultation%20request%20on%20your%20website."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-2 no-underline"
                    >
                      <MessageSquare size={16} />
                      <span>Chat on WhatsApp Now</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: "",
                          phone: "",
                          email: "",
                          city: "Jaipur",
                          service: "Home Loan & Balance Transfer",
                          amount: "",
                          message: ""
                        });
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer border-none"
                    >
                      Submit Another Query
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h2
                        style={{ fontFamily: SANS_FONT }}
                        className="text-xl sm:text-2xl font-extrabold text-slate-900 m-0"
                      >
                        Schedule a Free Consultation
                      </h2>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Get personalized advice from our Chartered Accountants & Senior DSA consultants.
                      </div>
                    </div>
                    <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-bold shrink-0">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>100% Confidential</span>
                    </div>
                  </div>

                  {formError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-fadeIn">
                      <AlertCircle size={16} className="shrink-0 text-red-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Service Dropdown */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Financial Service Required <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#094b57]/20 focus:border-[#094b57] transition"
                    >
                      {SERVICES_LIST.map((svc) => (
                        <option key={svc} value={svc}>
                          {svc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Ramesh Kumar"
                        required
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#094b57]/20 focus:border-[#094b57] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Contact Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-bold">
                          +91
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="98290 12345"
                          required
                          maxLength={10}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-r-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#094b57]/20 focus:border-[#094b57] transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email & City Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="ramesh@example.com"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#094b57]/20 focus:border-[#094b57] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Your City / Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="e.g. Jaipur, Delhi, Mumbai"
                        required
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#094b57]/20 focus:border-[#094b57] transition"
                      />
                    </div>
                  </div>

                  {/* Amount / Budget (Optional) */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Estimated Loan / Investment Amount (Optional)
                    </label>
                    <input
                      type="text"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="e.g. ₹ 45,00,000 or ₹ 2 Crore"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#094b57]/20 focus:border-[#094b57] transition"
                    />
                  </div>

                  {/* Message */}
                  <div className="mb-5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Message or Specific Requirement
                    </label>
                    <textarea
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Share any specific query (e.g. Lowest home loan interest rate, MSME subsidy eligibility, or NRI property purchase)..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#094b57]/20 focus:border-[#094b57] transition resize-none"
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: "linear-gradient(135deg, #b69455 0%, #9e7d3b 100%)",
                      fontFamily: SANS_FONT
                    }}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider text-white shadow-md hover:brightness-105 active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting with Advisor...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Request Free Consultation Callback</span>
                      </>
                    )}
                  </button>

                  <div className="mt-3 text-center text-[11px] text-slate-500">
                    By submitting, you agree to receive a callback or WhatsApp consultation from SKS INFI advisors.
                  </div>
                </form>
              )}
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* INTERACTIVE DUAL MAPS SECTION (JAIPUR HQ & BRANCH)             */}
        {/* ============================================================== */}
        <section className="compact-section py-8 px-4 sm:px-6 bg-slate-100/70 border-t border-slate-200">
          <div className="max-w-6xl mx-auto">
            
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-[#b69455] uppercase tracking-wider">
                Visit Our Locations
              </span>
              <h2
                style={{ fontFamily: SANS_FONT }}
                className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-1 m-0"
              >
                Locate Our Jaipur Offices on Google Maps
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mt-1 leading-relaxed">
                Both locations are easily accessible in Mansarovar with dedicated parking for clients.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Map 1: Sunny Trade Centre (HQ) */}
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
                  <div className="min-w-0 pr-2">
                    <h3 style={{ fontFamily: SANS_FONT }} className="text-sm sm:text-base font-bold text-slate-900 m-0 flex items-center gap-1.5">
                      <Building2 size={16} className="text-[#094b57] shrink-0" />
                      <span>Corporate HQ: Sunny Trade Centre</span>
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      520, 5th Floor, New Aatish Market, Mansarovar, Jaipur
                    </div>
                  </div>
                  <a
                    href="https://maps.google.com/?q=Sunny+Trade+Centre+New+Aatish+Market+Mansarovar+Jaipur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#094b57] hover:underline flex items-center gap-1 no-underline shrink-0 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-100 hover:bg-teal-100 transition"
                  >
                    <span>Directions</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="relative w-full h-[320px] bg-slate-100">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3558.8350981407616!2d75.7583884754382!3d26.87697977666848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjbCsDUyJzM3LjEiTiA3NcKwNDUnMzkuNSJF!5e0!3m2!1sen!2sin!4v1756726557118!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Sunny Trade Centre Location Map"
                  />
                </div>
              </div>

              {/* Map 2: Patrakar Colony */}
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
                  <div className="min-w-0 pr-2">
                    <h3 style={{ fontFamily: SANS_FONT }} className="text-sm sm:text-base font-bold text-slate-900 m-0 flex items-center gap-1.5">
                      <MapPin size={16} className="text-[#094b57] shrink-0" />
                      <span>Branch Office: Patrakar Colony</span>
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Patrakar Colony, Mansarovar, Jaipur, Rajasthan – 302020
                    </div>
                  </div>
                  <a
                    href="https://maps.google.com/?q=Patrakar+Colony+Mansarovar+Jaipur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#094b57] hover:underline flex items-center gap-1 no-underline shrink-0 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-100 hover:bg-teal-100 transition"
                  >
                    <span>Directions</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="relative w-full h-[320px] bg-slate-100">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3560.0230841653524!2d75.73748397543692!3d26.839218076691054!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjbCsDUwJzIxLjIiTiA3NcKwNDQnMjQuMiJF!5e0!3m2!1sen!2sin!4v1756709941446!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Patrakar Colony Location Map"
                  />
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* PAN-INDIA BRANCH NETWORK (12 CITIES)                           */}
        {/* ============================================================== */}
        <section className="compact-section py-10 px-4 sm:px-6 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto">
            
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-[#b69455] uppercase tracking-wider">
                Pan-India Network
              </span>
              <h2
                style={{ fontFamily: SANS_FONT }}
                className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 m-0"
              >
                12 Nationwide Locations & Desks
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                Supporting clients across North, West, and Central India with localized financial expertise.
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {REGIONAL_BRANCHES.map((b) => (
                <div
                  key={b.city}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-[#b69455] hover:shadow-sm transition-all duration-200 text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{b.city}</span>
                    <span className="text-[10px] font-semibold text-[#094b57] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      {b.state}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate" title={b.desc}>
                    {b.desc}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* FAQ ACCORDION                                                  */}
        {/* ============================================================== */}
        <section className="compact-section py-10 px-4 sm:px-6 bg-[#f8fafc] border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-[#b69455] uppercase tracking-wider flex items-center justify-center gap-1">
                <HelpCircle size={14} />
                <span>Frequently Asked Questions</span>
              </span>
              <h2
                style={{ fontFamily: SANS_FONT }}
                className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 m-0"
              >
                Questions About Consulting SKS INFI?
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                Quick answers on consultation fees, response times, and advisory procedures.
              </div>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 transition flex items-center justify-between gap-3 border-none cursor-pointer"
                    >
                      <span style={{ fontFamily: SANS_FONT }}>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp size={16} className="text-[#b69455] shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* BOTTOM URGENT CALL TO ACTION BANNER                            */}
        {/* ============================================================== */}
        <section
          style={{
            background: "linear-gradient(135deg, #094b57 0%, #062b32 100%)"
          }}
          className="compact-section py-10 px-4 sm:px-6 text-center text-white border-t border-[#0e5663]"
        >
          <div className="max-w-4xl mx-auto">
            <h2
              style={{ fontFamily: SANS_FONT }}
              className="text-xl sm:text-3xl font-extrabold text-white m-0 mb-2"
            >
              Need Urgent Financial Assistance?
            </h2>
            <div
              style={{ color: "#e2ecf0", fontFamily: SANS_FONT }}
              className="text-xs sm:text-sm max-w-xl mx-auto mb-6 leading-relaxed font-normal"
            >
              Speak directly with our managing director or senior practice heads. We are available right now to review your loan, subsidy, or investment files.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="tel:+919928529222"
                style={{
                  background: "linear-gradient(135deg, #b69455 0%, #9e7d3b 100%)",
                  color: "#ffffff"
                }}
                className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md hover:brightness-105 flex items-center gap-2 no-underline"
              >
                <Phone size={15} />
                <span>Call +91 99285 29222</span>
              </a>
              <a
                href="https://wa.me/919928529222?text=Hello%20SKS%20INFI%20Team%2C%20I%20would%20like%20to%20consult%20regarding%20financial%20services."
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 no-underline"
              >
                <MessageSquare size={15} />
                <span>WhatsApp Senior Advisor</span>
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {modalOpen && (
        <EnquiryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialCategory={modalCategory}
        />
      )}
    </>
  );
}
