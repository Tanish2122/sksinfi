import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json();

    if (!type || !data) {
      return NextResponse.json({ error: "Missing type or data" }, { status: 400 });
    }

    const tableMap: Record<string, string> = {
      contact: "contact_enquiries",
      loan: "loan_enquiries",
      partner: "partner_enquiries",
      career: "career_applications"
    };

    const tableName = tableMap[type];
    if (!tableName) {
      return NextResponse.json({ error: "Invalid enquiry type" }, { status: 400 });
    }

    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data: inserted, error } = await supabaseAdmin
        .from(tableName)
        .insert([data])
        .select();

      if (error) {
        console.error(`Supabase ${tableName} insert error:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: inserted });
    }

    return NextResponse.json({ success: true, isLocalMock: true });
  } catch (err: any) {
    console.error("Enquiry API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
