"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, ArrowRight, ShieldCheck, Sparkles, PieChart, Coins } from "lucide-react";

interface SIPCalculatorProps {
  onStartSIP?: () => void;
}

export default function SIPCalculator({ onStartSIP }: SIPCalculatorProps) {
  const [activeTab, setActiveTab] = useState<"sip" | "lumpsum">("sip");

  // SIP inputs
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(25000);

  // Lumpsum inputs
  const [totalInvestment, setTotalInvestment] = useState<number>(25000);

  // Common inputs
  const [expectedReturn, setExpectedReturn] = useState<number>(12);
  const [timePeriodYears, setTimePeriodYears] = useState<number>(10);

  // Calculations matching Groww's exact formula
  const { investedAmount, estReturns, totalValue } = useMemo(() => {
    if (activeTab === "sip") {
      const P = Math.max(0, Number(monthlyInvestment) || 0);
      const r = Math.max(0, Number(expectedReturn) || 0);
      const t = Math.max(0, Number(timePeriodYears) || 0);

      const n = t * 12;
      const invested = P * n;

      if (r <= 0 || n <= 0 || P <= 0) {
        return {
          investedAmount: Math.round(invested),
          estReturns: 0,
          totalValue: Math.round(invested)
        };
      }

      // Groww's compounding formula: periodic effective monthly rate i = (1 + r/100)^(1/12) - 1
      const i = Math.pow(1 + r / 100, 1 / 12) - 1;
      const fv = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
      const returns = Math.max(0, fv - invested);

      return {
        investedAmount: Math.round(invested),
        estReturns: Math.round(returns),
        totalValue: Math.round(fv)
      };
    } else {
      // Lumpsum Mode: A = P * (1 + r/100)^t
      const P = Math.max(0, Number(totalInvestment) || 0);
      const r = Math.max(0, Number(expectedReturn) || 0);
      const t = Math.max(0, Number(timePeriodYears) || 0);

      const fv = P * Math.pow(1 + r / 100, t);
      const returns = Math.max(0, fv - P);

      return {
        investedAmount: Math.round(P),
        estReturns: Math.round(returns),
        totalValue: Math.round(fv)
      };
    }
  }, [activeTab, monthlyInvestment, totalInvestment, expectedReturn, timePeriodYears]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Donut chart calculations
  const totalValForChart = totalValue > 0 ? totalValue : 1;
  const investedRatio = investedAmount / totalValForChart;
  const returnsRatio = estReturns / totalValForChart;

  // SVG Donut params
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const investedStroke = investedRatio * circumference;
  const returnsStroke = returnsRatio * circumference;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100 max-w-5xl mx-auto">
      {/* Header & Mode Switch Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#094b57] tracking-tight">
            SIP Calculator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Calculate your mutual fund returns with Groww-standard compounding accuracy.
          </p>
        </div>

        {/* SIP vs Lumpsum Tabs */}
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("sip")}
            className={`px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "sip"
                ? "bg-[#094b57] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 bg-transparent"
            }`}
          >
            SIP
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lumpsum")}
            className={`px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "lumpsum"
                ? "bg-[#094b57] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 bg-transparent"
            }`}
          >
            Lumpsum
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Sliders & Inputs Column */}
        <div className="lg:col-span-7 space-y-7">
          {/* Input 1: Investment Amount */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-700">
                {activeTab === "sip" ? "Monthly investment" : "Total investment"}
              </label>
              <div className="relative inline-flex items-center">
                <span className="absolute left-3 text-sm font-bold text-[#094b57]">₹</span>
                <input
                  type="number"
                  min={500}
                  max={activeTab === "sip" ? 1000000 : 10000000}
                  step={500}
                  value={activeTab === "sip" ? monthlyInvestment : totalInvestment}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (activeTab === "sip") setMonthlyInvestment(val);
                    else setTotalInvestment(val);
                  }}
                  className="pl-7 pr-3 py-1.5 w-36 text-right font-extrabold text-sm rounded-lg bg-emerald-50/60 border border-emerald-200 text-[#094b57] focus:outline-none focus:ring-2 focus:ring-[#094b57]/20"
                />
              </div>
            </div>
            <input
              type="range"
              min={500}
              max={activeTab === "sip" ? 200000 : 1000000}
              step={500}
              value={activeTab === "sip" ? monthlyInvestment : totalInvestment}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (activeTab === "sip") setMonthlyInvestment(val);
                else setTotalInvestment(val);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-[#00d09c]"
            />
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span>₹500</span>
              <span>{activeTab === "sip" ? "₹1,00,000" : "₹5,00,000"}</span>
              <span>{activeTab === "sip" ? "₹2,00,000+" : "₹10,00,000+"}</span>
            </div>
          </div>

          {/* Input 2: Expected return rate */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-700">
                Expected return rate (p.a)
              </label>
              <div className="relative inline-flex items-center">
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={0.5}
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="pl-3 pr-7 py-1.5 w-28 text-right font-extrabold text-sm rounded-lg bg-emerald-50/60 border border-emerald-200 text-[#094b57] focus:outline-none focus:ring-2 focus:ring-[#094b57]/20"
                />
                <span className="absolute right-3 text-sm font-bold text-[#094b57]">%</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={0.5}
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-[#00d09c]"
            />
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span>1%</span>
              <span>15%</span>
              <span>30%</span>
            </div>
          </div>

          {/* Input 3: Time period */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-700">
                Time period
              </label>
              <div className="relative inline-flex items-center">
                <input
                  type="number"
                  min={1}
                  max={40}
                  step={1}
                  value={timePeriodYears}
                  onChange={(e) => setTimePeriodYears(Number(e.target.value))}
                  className="pl-3 pr-8 py-1.5 w-28 text-right font-extrabold text-sm rounded-lg bg-emerald-50/60 border border-emerald-200 text-[#094b57] focus:outline-none focus:ring-2 focus:ring-[#094b57]/20"
                />
                <span className="absolute right-3 text-xs font-bold text-[#094b57]">Yr</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              step={1}
              value={timePeriodYears}
              onChange={(e) => setTimePeriodYears(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-[#00d09c]"
            />
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span>1 Yr</span>
              <span>20 Yr</span>
              <span>40 Yr</span>
            </div>
          </div>

          {/* SKS INFI Advantage Box */}
          <div className="p-4 rounded-2xl bg-[#eef7f8] border border-[#d2ebeb] text-xs text-[#094b57] leading-relaxed flex items-start gap-2.5">
            <Sparkles size={16} className="text-[#b69455] flex-shrink-0 mt-0.5" />
            <div>
              <strong>SKS INFI Guidance:</strong> Mutual fund investments compound exponentially over longer horizons. SKS INFI advisors help you pick top-quartile funds across large, mid, and multi-cap categories to match your risk profile.
            </div>
          </div>
        </div>

        {/* Results & Donut Chart Column (Groww Style) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            {/* 3 Metric Rows */}
            <div className="space-y-4 pb-6 border-b border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Invested amount</span>
                <span className="font-bold text-slate-800 text-base">{formatCurrency(investedAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Est. returns</span>
                <span className="font-bold text-slate-800 text-base">{formatCurrency(estReturns)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-slate-700 font-bold">Total value</span>
                <span className="font-extrabold text-[#094b57] text-xl sm:text-2xl">{formatCurrency(totalValue)}</span>
              </div>
            </div>

            {/* Visual SVG Donut Chart */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  {/* Background Circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="#e2e8f0"
                    strokeWidth="20"
                  />
                  {/* Invested Amount Stroke (Slate/Indigo) */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="#5367ff"
                    strokeWidth="20"
                    strokeDasharray={`${investedStroke} ${circumference}`}
                    strokeDashoffset="0"
                    className="transition-all duration-300 ease-out"
                  />
                  {/* Est Returns Stroke (Teal/Emerald) */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="#00d09c"
                    strokeWidth="20"
                    strokeDasharray={`${returnsStroke} ${circumference}`}
                    strokeDashoffset={`-${investedStroke}`}
                    className="transition-all duration-300 ease-out"
                  />
                </svg>

                {/* Inner Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-semibold text-slate-400">Total</span>
                  <span className="text-xs font-black text-slate-800">
                    {activeTab === "sip" ? `${timePeriodYears}Y SIP` : `${timePeriodYears}Y`}
                  </span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-6 mt-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#5367ff] inline-block" />
                  <span className="text-slate-600">Invested amount</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#00d09c] inline-block" />
                  <span className="text-slate-600">Est. returns</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4">
            <button
              type="button"
              onClick={onStartSIP}
              style={{ backgroundColor: "#00d09c" }}
              className="w-full text-white font-extrabold py-3.5 px-6 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>INVEST NOW</span>
              <ArrowRight size={16} />
            </button>
            <div className="text-center text-[11px] text-slate-400 mt-2 font-medium">
              Zero Advisory Fees • Free Portfolio Review
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}