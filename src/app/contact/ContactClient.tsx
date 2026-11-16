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
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Award,
  ArrowRight,
  Navigation,
  AlertCircle
} from "lucide-react";

interface BranchInfo {
  city: string;
  state: string;
  type: string;
  address?: string;
  focus: string;
}

const BRANCHES: BranchInfo[] = [
  { city: "Jaipur", state: "Rajasthan", type: "Corporate HQ", address: "520, Sunny Trade Centre, New Aatish Market", focus: "All Services & NRI Desk" },
  { city: "Jodhpur", state: "Rajasthan", type: "Regional Branch", focus: "MSME & Business Loans" },
  { city: "Sikar", state: "Rajasthan", type: "Branch Office", focus: "Retail & Agriculture Loans" },
  { city: "Kishangarh", state: "Rajasthan", type: "Branch Office", focus: "Marble Industry Project Finance" },
  { city: "Barmer", state: "Rajasthan", type: "Industrial Desk", focus: "Oil & Energy Sector MSME" },
  { city: "Balotra", state: "Rajasthan", type: "Branch Office", focus: "Textile & Dyeing Industry Loans" },
  { city: "New Delhi", state: "Delhi NCR", type: "Regional Office", address: "Surya Kiran Bldg, Connaught Place", focus: "Corporate Finance & HNI Advisory" },
  { city: "Sri Ganganagar", state: "Rajasthan", type: "Branch Office", focus: "Commercial Vehicle & Trade Loans" },
  { city: "Ahmedabad", state: "Gujarat", type: "Regional Office", address: "Titanium City Centre, Anand Nagar", focus: "MSME Subsidies & Equity Advisory" },
  { city: "Aurangabad", state: "Maharashtra", type: "Industrial Desk", focus: "Auto Ancillary & Project Funding" },
  { city: "Tonk", state: "Rajasthan", type: "Branch Office", focus: "Retail & Housing Loans" },
  { city: "Bhilwara", state: "Rajasthan", type: "Branch Office", focus: "Textile City Project Finance" }
];

const FAQS = [
  {
    q: "Is the initial financial consultation free of charge?",
    a: "Yes, 100% free. Our initial 30-minute consultation with a senior financial advisor or chartered accountant carries no charges or obligations. We evaluate your profile, assess eligibility, and outline the best financial roadmap for you."
  },
  {
    q: "How quickly will an advisor connect with me after I submit an enquiry?",
    a: "Our priority response desk reviews incoming enquiries in real-time. During business hours (9:30 AM – 7:30 PM IST), you will typically receive a callback from a senior consultant within 15 minutes."
  },
  {
    q: "How can Non-Resident Indians (NRIs) consult with team SKS INFI?",
    a: "We maintain a dedicated 24/7 NRI Support Desk accessible via WhatsApp video calls, Google Meet, and phone (+91 99285 93122). We routinely advise NRIs living across the UK, UAE, USA, Australia, and Canada on Indian real estate investments, FEMA compliances, and repatriable mutual funds."
  },
  {
    q: "What documents should I prepare for home loans or MSME subsidy eligibility?",
    a: "For salaried individuals: 3 months salary slips, 6 months bank statements, KYC (PAN & Aadhaar). For business owners & MSMEs: 3 years ITR with financial statements, 12 months GST returns, Udyam registration, and project report details. Our team assists you in preparing and organizing all files."
  },
  {
    q: "Can I visit your office in person for a one-on-one session?",
    a: "Absolutely. You are warmly welcome to visit our Corporate Headquarters at Sunny Trade Centre, New Aatish Market, Jaipur, or our regional offices in Delhi (Connaught Place) and Ahmedabad. Prior appointment booking is recommended so the relevant practice head is available."
  }
];

const SERVICE_OPTIONS = [
  "Home Loan & LAP",
  "MSME Subsidy & Project Loan",
  "Mutual Fund & SIP Planning",
  "NRI Financial Desk",
  "Business & Industrial Loan",
  "Taxation & Corporate Advisory"
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
    service: "Home Loan & LAP",
    amount: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  // Map Tab State
  const [activeMapTab, setActiveMapTab] = useState<"aatish" | "patrakar">("aatish");

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Branch Filter State
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("All");

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
      // 1. Submit lead to database / localStorage
      await submitContactEnquiry({
        name: formData.name.trim(),
        email: formData.email.trim() || "no-email@sksinfi.com",
        phone: cleanPhone,
        address: `${formData.city} (Req: ${formData.service}${formData.amount ? `, Amt: ${formData.amount}` : ""})`,
        message: formData.message.trim() || `Consultation request for ${formData.service}`
      });

      // 2. Dispatch automated email alert via backend
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
      setFormError("There was a temporary issue submitting your request. Please call us directly at +91 99285 29222.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBranches = BRANCHES.filter((b) => {
    if (selectedBranchFilter === "All") return true;
    if (selectedBranchFilter === "Rajasthan") return b.state === "Rajasthan";
    if (selectedBranchFilter === "Other States") return b.state !== "Rajasthan";
    return true;
  });

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#333333] font-sans">
        <Navbar onOpenEnquiry={openEnquiry} />

        {/* ============================================================== */}
        {/* HERO SECTION                                                  */}
        {/* ============================================================== */}
        <section
          style={{
            background: "linear-gradient(135deg, #05262c 0%, #094b57 60%, #06353e 100%)",
            color: "#ffffff"
          }}
          className="relative pt-12 pb-16 px-4 sm:px-6 overflow-hidden"
        >
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#b69455]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10 text-center">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#f5eedd] text-xs font-semibold tracking-wide uppercase mb-4">
              <Sparkles size={14} className="text-[#b69455]" />
              <span>We Are Here To Accelerate Your Financial Growth</span>
            </div>

            <h1
              style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: "#ffffff"
              }}
              className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight"
            >
              Connect With Our <span style={{ color: "#e2c17c" }}>Financial Advisory Experts</span>
            </h1>

            <div
              style={{
                color: "#ffffff",
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              }}
              className="text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed mb-8"
            >
              Whether you need high-value project funding, MSME subsidies, home loan balance transfers, mutual fund SIP planning, or 24/7 NRI wealth consulting — CA Aarun Jain and our senior panel are at your service.
            </div>

            {/* 4 Trust Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#b69455]/20 text-[#e2c17c] flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">15-Min Callback</div>
                  <div style={{ color: "rgba(255, 255, 255, 0.8)" }} className="text-[11px]">Fast advisor response</div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Award size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">₹85+ Crore</div>
                  <div style={{ color: "rgba(255, 255, 255, 0.8)" }} className="text-[11px]">Loans facilitated</div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">12+ Cities</div>
                  <div style={{ color: "rgba(255, 255, 255, 0.8)" }} className="text-[11px]">Nationwide presence</div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">24/7 NRI Desk</div>
                  <div style={{ color: "rgba(255, 255, 255, 0.8)" }} className="text-[11px]">UK, UAE, US & AUS</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* MAIN TWO-COLUMN CONTACT HUB                                   */}
        {/* ============================================================== */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 -mt-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* -------------------------------------------------------- */}
              {/* LEFT COLUMN: DIRECT CHANNELS & OFFICES (5 COLS)          */}
              {/* -------------------------------------------------------- */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Instant Helpline Cards */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h2
                      style={{
                        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0"
                    >
                      Direct Advisory Channels
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {/* Primary Helpline */}
                    <a
                      href="tel:+919928529222"
                      className="group flex items-start gap-4 p-3.5 rounded-xl border border-slate-100 hover:border-[#b69455] hover:bg-amber-50/30 transition no-underline"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#094b57]/10 text-[#094b57] flex items-center justify-center shrink-0 group-hover:bg-[#094b57] group-hover:text-white transition">
                        <Phone size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-500">General Consultation Helpline</div>
                        <div className="text-base font-bold text-slate-900 group-hover:text-[#094b57] transition">
                          +91 99285 29222
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Mon – Sat (9:30 AM – 7:30 PM IST)</div>
                      </div>
                    </a>

                    {/* NRI 24/7 Desk */}
                    <a
                      href="tel:+919928593122"
                      className="group flex items-start gap-4 p-3.5 rounded-xl border border-slate-100 hover:border-[#b69455] hover:bg-amber-50/30 transition no-underline"
                    >
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#b69455] flex items-center justify-center shrink-0 group-hover:bg-[#b69455] group-hover:text-white transition">
                        <Globe size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-500">24/7 NRI Support Desk</div>
                        <div className="text-base font-bold text-slate-900 group-hover:text-[#094b57] transition">
                          +91 99285 93122
                        </div>
                        <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          WhatsApp Video Calls Available Worldwide
                        </div>
                      </div>
                    </a>

                    {/* Email */}
                    <a
                      href="mailto:infi@sksinfi.com"
                      className="group flex items-start gap-4 p-3.5 rounded-xl border border-slate-100 hover:border-[#b69455] hover:bg-amber-50/30 transition no-underline"
                    >
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                        <Mail size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-500">Official Inquiries & Proposals</div>
                        <div className="text-base font-bold text-slate-900 group-hover:text-[#094b57] transition">
                          infi@sksinfi.com
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Average reply time: under 2 hours</div>
                      </div>
                    </a>
                  </div>

                  {/* WhatsApp Direct Action Button */}
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <a
                      href="https://wa.me/919928529222?text=Hello%20SKS%20INFI%20Team%2C%20I%20would%20like%20to%20consult%20regarding%20financial%20services%20(Loans%2C%20MSME%2C%20Investments)."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition shadow-sm no-underline cursor-pointer"
                    >
                      <MessageSquare size={18} />
                      <span>Start Direct WhatsApp Chat</span>
                    </a>
                  </div>
                </div>

                {/* Key Office Addresses Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3
                    style={{
                      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}
                    className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"
                  >
                    <MapPin size={16} className="text-[#b69455]" />
                    <span>Corporate & Regional Hubs</span>
                  </h3>

                  <div className="space-y-4">
                    {/* Head Office Jaipur */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#094b57] uppercase tracking-wide">
                          Corporate Headquarters (Rajasthan)
                        </span>
                        <span className="bg-[#094b57]/10 text-[#094b57] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Head Office
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed m-0 font-medium">
                        520, 5th Floor, Sunny Trade Centre, New Aatish Market, Mansarovar, Jaipur, Rajasthan – 302020
                      </p>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Navigation size={11} className="text-[#b69455]" />
                        <span>Adjacent to New Aatish Market Metro Station</span>
                      </div>
                    </div>

                    {/* Jaipur City Branch */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                        Jaipur City Branch
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed m-0 font-medium">
                        Patrakar Colony, Mansarovar, Jaipur, Rajasthan – 302020
                      </p>
                    </div>

                    {/* Delhi NCR Office */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                        Delhi NCR Regional Office
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed m-0 font-medium">
                        Surya Kiran Building, KG Marg, Connaught Place, New Delhi – 110001
                      </p>
                    </div>

                    {/* Gujarat Office */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                        Gujarat Regional Office
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed m-0 font-medium">
                        E-1006, Titanium City Centre, Near Sachin Tower, Anand Nagar Road, Ahmedabad, Gujarat – 380015
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* -------------------------------------------------------- */}
              {/* RIGHT COLUMN: CONSULTATION & ENQUIRY FORM (7 COLS)       */}
              {/* -------------------------------------------------------- */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
                  
                  {/* Subtle top brand bar */}
                  <div
                    style={{ background: "linear-gradient(90deg, #094b57 0%, #b69455 100%)" }}
                    className="absolute top-0 left-0 right-0 h-1.5"
                  />

                  {submitted ? (
                    /* Submission Success State */
                    <div className="py-12 px-4 text-center">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
                        <CheckCircle2 size={36} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">
                        Consultation Request Received!
                      </h3>
                      <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                        Thank you, <strong className="text-slate-900">{formData.name}</strong>. Your consultation details regarding <strong className="text-slate-900">{formData.service}</strong> have been allocated to our senior financial advisory panel.
                      </p>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto mb-8 text-xs text-slate-700 text-left space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Contact Number:</span>
                          <span className="font-semibold text-slate-900">{formData.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">City / Location:</span>
                          <span className="font-semibold text-slate-900">{formData.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Estimated Callback:</span>
                          <span className="font-bold text-emerald-700">Within 15 Minutes</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({
                            name: "",
                            phone: "",
                            email: "",
                            city: "Jaipur",
                            service: "Home Loan & LAP",
                            amount: "",
                            message: ""
                          });
                        }}
                        className="bg-[#094b57] hover:bg-[#073942] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer border-none"
                      >
                        Submit Another Inquiry
                      </button>
                    </div>
                  ) : (
                    /* The Interactive Form */
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <div>
                          <h2
                            style={{
                              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                            }}
                            className="text-2xl font-extrabold text-slate-900 m-0"
                          >
                            Schedule a Free Consultation
                          </h2>
                          <p className="text-xs text-slate-500 m-0 mt-1">
                            Get personalized advice from our Chartered Accountants & Senior DSA consultants.
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                          <ShieldCheck size={12} className="text-emerald-600" />
                          <span>100% Confidential</span>
                        </span>
                      </div>

                      {formError && (
                        <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle size={16} className="shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Service Chips Selection */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Select Financial Service Required *
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {SERVICE_OPTIONS.map((srv) => {
                              const isSelected = formData.service === srv;
                              return (
                                <button
                                  key={srv}
                                  type="button"
                                  onClick={() => setFormData((prev) => ({ ...prev, service: srv }))}
                                  style={{
                                    backgroundColor: isSelected ? "#094b57" : "#f1f5f9",
                                    color: isSelected ? "#ffffff" : "#334155",
                                    borderColor: isSelected ? "#094b57" : "#e2e8f0"
                                  }}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer"
                                >
                                  {srv}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Name and Phone Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              name="name"
                              required
                              placeholder="e.g. Ramesh Kumar"
                              value={formData.name}
                              onChange={handleInputChange}
                              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#b69455] focus:bg-white transition"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Contact Mobile Number *
                            </label>
                            <div className="flex">
                              <span className="bg-slate-100 border border-slate-200 border-r-0 rounded-l-xl px-3 py-2.5 text-xs text-slate-500 font-semibold flex items-center">
                                +91
                              </span>
                              <input
                                type="tel"
                                name="phone"
                                required
                                placeholder="98290 12345"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-r-xl focus:outline-none focus:border-[#b69455] focus:bg-white transition"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Email and City Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Email Address
                            </label>
                            <input
                              type="email"
                              name="email"
                              placeholder="ramesh@example.com"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#b69455] focus:bg-white transition"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Your City / Location *
                            </label>
                            <input
                              type="text"
                              name="city"
                              required
                              placeholder="e.g. Jaipur, Jodhpur, Delhi"
                              value={formData.city}
                              onChange={handleInputChange}
                              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#b69455] focus:bg-white transition"
                            />
                          </div>
                        </div>

                        {/* Estimated Loan / Investment Amount */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Estimated Loan / Investment Amount (Optional)
                          </label>
                          <input
                            type="text"
                            name="amount"
                            placeholder="e.g. ₹ 45,00,000 or ₹ 2 Crore"
                            value={formData.amount}
                            onChange={handleInputChange}
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#b69455] focus:bg-white transition"
                          />
                        </div>

                        {/* Message / Query */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Message or Specific Requirement
                          </label>
                          <textarea
                            rows={3}
                            name="message"
                            placeholder="Share any specific query (e.g. Lowest home loan interest rate, MSME subsidy eligibility, or NRI property purchase)..."
                            value={formData.message}
                            onChange={handleInputChange}
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#b69455] focus:bg-white transition resize-none"
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={submitting}
                          style={{
                            background: "linear-gradient(135deg, #094b57 0%, #0c5967 100%)"
                          }}
                          className="w-full hover:opacity-95 text-white py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50"
                        >
                          {submitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Submitting Consultation Request...</span>
                            </>
                          ) : (
                            <>
                              <Send size={15} />
                              <span>Request Free Consultation Now</span>
                            </>
                          )}
                        </button>

                        <div className="text-center text-[11px] text-slate-400">
                          🔒 No spam guaranteed. We respect your privacy and will never share your number.
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* NATIONWIDE BRANCHES NETWORK                                    */}
        {/* ============================================================== */}
        <section className="py-14 px-4 sm:px-6 bg-white border-t border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold text-[#b69455] uppercase tracking-wider">
                  Extensive Footprint
                </span>
                <h2
                  style={{
                    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  }}
                  className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 m-0"
                >
                  Our Nationwide Branch Network
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 m-0 mt-1">
                  Serving clients across Rajasthan, Delhi NCR, Gujarat, and Maharashtra with on-ground financial associates.
                </p>
              </div>

              {/* State Filter Buttons */}
              <div className="flex items-center gap-2">
                {["All", "Rajasthan", "Other States"].map((flt) => (
                  <button
                    key={flt}
                    type="button"
                    onClick={() => setSelectedBranchFilter(flt)}
                    style={{
                      backgroundColor: selectedBranchFilter === flt ? "#094b57" : "#f1f5f9",
                      color: selectedBranchFilter === flt ? "#ffffff" : "#475569"
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border-none transition cursor-pointer"
                  >
                    {flt}
                  </button>
                ))}
              </div>
            </div>

            {/* Branch Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredBranches.map((branch) => {
                const isHQ = branch.city === "Jaipur";
                return (
                  <div
                    key={branch.city}
                    className={`p-4 rounded-xl border transition ${
                      isHQ
                        ? "bg-[#094b57]/5 border-[#094b57]/30 shadow-sm"
                        : "bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-[#b69455]/50 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">
                        {branch.city}
                      </span>
                      <span
                        style={{
                          backgroundColor: isHQ ? "rgba(9, 75, 87, 0.15)" : "rgba(182, 148, 85, 0.15)",
                          color: isHQ ? "#094b57" : "#96773d"
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      >
                        {branch.state}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-600 mb-2">
                      {branch.type}
                    </div>

                    <div className="text-[11px] text-slate-500 font-light border-t border-slate-200/60 pt-2 flex items-center justify-between">
                      <span className="truncate">{branch.focus}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, city: branch.city }));
                          window.scrollTo({ top: 350, behavior: "smooth" });
                        }}
                        title={`Select ${branch.city} in form`}
                        className="text-[10px] text-[#b69455] hover:underline font-bold bg-transparent border-none cursor-pointer p-0 ml-1 shrink-0"
                      >
                        Select ➔
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* INTERACTIVE GOOGLE MAPS SECTION                                */}
        {/* ============================================================== */}
        <section className="py-14 px-4 sm:px-6 bg-[#f8fafc]">
          <div className="max-w-6xl mx-auto">
            
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-bold text-[#b69455] uppercase tracking-wider">
                Visit Our Offices
              </span>
              <h2
                style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 mb-2"
              >
                Jaipur Office Locations
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Easily navigate to our Sunny Trade Centre headquarters or our Patrakar Colony Mansarovar branch.
              </p>

              {/* Map Tabs */}
              <div className="inline-flex p-1 bg-slate-200/80 rounded-xl mt-4">
                <button
                  type="button"
                  onClick={() => setActiveMapTab("aatish")}
                  style={{
                    backgroundColor: activeMapTab === "aatish" ? "#ffffff" : "transparent",
                    color: activeMapTab === "aatish" ? "#094b57" : "#64748b"
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition border-none cursor-pointer shadow-sm"
                >
                  🏢 Sunny Trade Centre (HQ)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapTab("patrakar")}
                  style={{
                    backgroundColor: activeMapTab === "patrakar" ? "#ffffff" : "transparent",
                    color: activeMapTab === "patrakar" ? "#094b57" : "#64748b"
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition border-none cursor-pointer shadow-sm"
                >
                  📍 Patrakar Colony Branch
                </button>
              </div>
            </div>

            {/* Map Frame Card */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
              {activeMapTab === "aatish" ? (
                <div>
                  <div className="bg-[#094b57] text-white px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <strong className="text-sm">Corporate Headquarters – Sunny Trade Centre</strong>
                      <div className="text-slate-300 text-[11px]">520, 5th Floor, New Aatish Market, Mansarovar, Jaipur</div>
                    </div>
                    <a
                      href="https://maps.google.com/?q=Sunny+Trade+Centre+New+Aatish+Market+Jaipur"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#b69455] hover:bg-[#96773d] text-white px-3 py-1.5 rounded-lg font-bold text-xs transition no-underline self-start sm:self-auto"
                    >
                      <Navigation size={12} />
                      <span>Get GPS Directions</span>
                    </a>
                  </div>
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3558.8350981407616!2d75.7583884754382!3d26.87697977666848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjbCsDUyJzM3LjEiTiA3NcKwNDUnMzkuNSJF!5e0!3m2!1sen!2sin!4v1756726557118!5m2!1sen!2sin"
                    width="100%"
                    height="420"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Sunny Trade Centre Location Map"
                  />
                </div>
              ) : (
                <div>
                  <div className="bg-[#094b57] text-white px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <strong className="text-sm">Jaipur Branch – Patrakar Colony</strong>
                      <div className="text-slate-300 text-[11px]">Patrakar Colony, Mansarovar, Jaipur – 302020</div>
                    </div>
                    <a
                      href="https://maps.google.com/?q=Patrakar+Colony+Mansarovar+Jaipur"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#b69455] hover:bg-[#96773d] text-white px-3 py-1.5 rounded-lg font-bold text-xs transition no-underline self-start sm:self-auto"
                    >
                      <Navigation size={12} />
                      <span>Get GPS Directions</span>
                    </a>
                  </div>
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3560.0230841653524!2d75.73748397543692!3d26.839218076691054!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjbCsDUwJzIxLjIiTiA3NcKwNDQnMjQuMiJF!5e0!3m2!1sen!2sin!4v1756709941446!5m2!1sen!2sin"
                    width="100%"
                    height="420"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Patrakar Colony Location Map"
                  />
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* FREQUENTLY ASKED QUESTIONS (FAQ)                               */}
        {/* ============================================================== */}
        <section className="py-14 px-4 sm:px-6 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto">
            
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-[#b69455] uppercase tracking-wider">
                Clear Answers
              </span>
              <h2
                style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 mb-2"
              >
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Everything you need to know about consulting with SKS INFI advisors.
              </p>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left font-bold text-sm text-slate-900 bg-white hover:bg-slate-50 transition flex items-center justify-between gap-4 border-none cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp size={18} className="text-[#b69455] shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white border-t border-slate-100">
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
        {/* BOTTOM CALL-TO-ACTION BANNER                                  */}
        {/* ============================================================== */}
        <section
          style={{
            background: "linear-gradient(135deg, #094b57 0%, #06323a 100%)",
            color: "#ffffff"
          }}
          className="py-12 px-4 sm:px-6 text-center"
        >
          <div className="max-w-4xl mx-auto">
            <h2
              style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              }}
              className="text-2xl sm:text-3xl font-extrabold mb-3 text-white"
            >
              Prefer an Immediate One-on-One Conversation?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto mb-6">
              Our managing director and practice heads are available to address your loan, subsidy, and investment requirements right now.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="tel:+919928529222"
                style={{ backgroundColor: "#b69455", color: "#ffffff", textDecoration: "none" }}
                className="hover:bg-[#96773d] px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-2"
              >
                <Phone size={14} />
                <span>Call +91 99285 29222</span>
              </a>
              <a
                href="https://wa.me/919928529222?text=Hello%20SKS%20INFI%20Team%2C%20I%20would%20like%20to%20consult%20regarding%20financial%20services."
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: "#25D366", color: "#ffffff", textDecoration: "none" }}
                className="hover:bg-[#20ba5a] px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-2"
              >
                <MessageSquare size={14} />
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
