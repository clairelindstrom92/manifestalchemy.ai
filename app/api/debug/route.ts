import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? `✅ Set (${supabaseUrl})` : "❌ Missing",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey
      ? `✅ Set (${supabaseAnonKey.substring(0, 12)}...)`
      : "❌ Missing",
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey
      ? `✅ Set (${supabaseServiceKey.substring(0, 12)}...)`
      : "❌ Missing",
    OPENAI_API_KEY: openaiKey
      ? `✅ Set (${openaiKey.substring(0, 8)}...)`
      : "❌ Missing",
  };

  // Test Supabase connectivity
  let supabaseStatus: Record<string, unknown> = { configured: false };

  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Test 1: Check auth
      const { error: authError } = await supabase.auth.getUser();
      supabaseStatus.auth_check = authError
        ? `⚠️ ${authError.message}`
        : "✅ Auth reachable";

      // Test 2: Check manifestations table
      const { error: manifestationsError } = await supabase
        .from("manifestations")
        .select("id")
        .limit(1);

      supabaseStatus.manifestations_table = manifestationsError
        ? `❌ ${manifestationsError.message} (code: ${manifestationsError.code})`
        : "✅ Table accessible";

      // Test 3: Check posts table
      const { error: postsError } = await supabase
        .from("posts")
        .select("id")
        .limit(1);

      supabaseStatus.posts_table = postsError
        ? `❌ ${postsError.message} (code: ${postsError.code})`
        : "✅ Table accessible";

      supabaseStatus.configured = true;
    } catch (err) {
      supabaseStatus.error = err instanceof Error ? err.message : String(err);
    }
  } else {
    supabaseStatus.reason =
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY";
  }

  // Test anon key connectivity
  let anonStatus: Record<string, unknown> = { configured: false };
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
      const { error } = await supabaseAnon.auth.getUser();
      anonStatus.configured = true;
      anonStatus.auth_check = error
        ? `⚠️ ${error.message}`
        : "✅ Auth reachable with anon key";
    } catch (err) {
      anonStatus.error = err instanceof Error ? err.message : String(err);
    }
  } else {
    anonStatus.reason =
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY";
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    env_vars: envStatus,
    supabase_service_role: supabaseStatus,
    supabase_anon: anonStatus,
    instructions: {
      missing_env_vars:
        "Create a .env.local file in the project root with the required environment variables. See .env.local.example for a template.",
      schema:
        "Ensure your Supabase database has the correct schema. See schema.sql for the required table definitions.",
    },
  });
}
