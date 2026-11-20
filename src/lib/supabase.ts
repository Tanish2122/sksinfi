import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  supabaseAnonKey;

const isConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("placeholder");

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Admin client for server-side API routes (bypasses RLS when SUPABASE_SERVICE_ROLE_KEY is provided)
export const supabaseAdmin =
  isConfigured && typeof window === "undefined"
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

export const isSupabaseConfigured = () => isConfigured;

// Helper to submit lead with server-side API (bypasses client-side RLS) & fallbacks
export async function submitContactEnquiry(data: {
  name: string;
  email: string;
  phone: string;
  address?: string;
  message: string;
}) {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", data }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data };
      }
    } catch (apiErr) {
      console.warn("API enquiry endpoint error, falling back:", apiErr);
    }
  }

  if (isConfigured && supabase) {
    try {
      const { error, data: inserted } = await supabase
        .from("contact_enquiries")
        .insert([data])
        .select();

      if (!error) return { success: true, data: inserted };
    } catch (_) {}
  }

  // Graceful fallback for local development / demo mode
  console.info("Logged submission locally:", data);
  if (typeof window !== "undefined") {
    const existing = JSON.parse(localStorage.getItem("sks_local_contacts") || "[]");
    existing.unshift({ ...data, id: "local-" + Date.now(), created_at: new Date().toISOString() });
    localStorage.setItem("sks_local_contacts", JSON.stringify(existing));
  }
  return { success: true, isLocalMock: true };
}

export async function submitLoanEnquiry(data: {
  name: string;
  email?: string;
  phone: string;
  service_category: string;
  product_name: string;
  loan_amount?: number;
  city?: string;
  message?: string;
}) {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "loan", data }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data };
      }
    } catch (apiErr) {
      console.warn("API enquiry endpoint error, falling back:", apiErr);
    }
  }

  if (isConfigured && supabase) {
    try {
      const { error, data: inserted } = await supabase
        .from("loan_enquiries")
        .insert([data])
        .select();

      if (!error) return { success: true, data: inserted };
    } catch (_) {}
  }

  console.info("Loan submission logged locally:", data);
  if (typeof window !== "undefined") {
    const existing = JSON.parse(localStorage.getItem("sks_local_loans") || "[]");
    existing.unshift({ ...data, id: "local-" + Date.now(), created_at: new Date().toISOString() });
    localStorage.setItem("sks_local_loans", JSON.stringify(existing));
  }
  return { success: true, isLocalMock: true };
}

export async function submitPartnerEnquiry(data: {
  name: string;
  email: string;
  mobile: string;
  country?: string;
  city: string;
  product_interest: string;
  message?: string;
}) {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "partner", data }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data };
      }
    } catch (apiErr) {
      console.warn("API enquiry endpoint error, falling back:", apiErr);
    }
  }

  if (isConfigured && supabase) {
    try {
      const { error, data: inserted } = await supabase
        .from("partner_enquiries")
        .insert([data])
        .select();

      if (!error) return { success: true, data: inserted };
    } catch (_) {}
  }

  console.info("Partner submission logged locally:", data);
  if (typeof window !== "undefined") {
    const existing = JSON.parse(localStorage.getItem("sks_local_partners") || "[]");
    existing.unshift({ ...data, id: "local-" + Date.now(), created_at: new Date().toISOString() });
    localStorage.setItem("sks_local_partners", JSON.stringify(existing));
  }
  return { success: true, isLocalMock: true };
}
