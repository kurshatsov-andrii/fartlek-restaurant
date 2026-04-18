import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, pin } = await req.json();
    if (typeof email !== "string" || typeof pin !== "string" || !/^[0-9]{4,8}$/.test(pin)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: verify, error: verr } = await admin.rpc("verify_pin", {
      _email: email,
      _pin: pin,
    });
    if (verr) throw verr;

    const row = Array.isArray(verify) ? verify[0] : verify;
    if (!row?.matched) {
      return new Response(JSON.stringify({ error: "Invalid PIN or email" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a magic link, then exchange the embedded token for a session
    const { data: link, error: lerr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (lerr) throw lerr;

    const actionLink = link?.properties?.action_link;
    if (!actionLink) throw new Error("No action link generated");

    // Extract the OTP hash from the action link
    const url = new URL(actionLink);
    const token_hash = url.searchParams.get("token") ?? url.searchParams.get("token_hash");
    if (!token_hash) throw new Error("No token in link");

    // Exchange the OTP for a session
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false },
    });
    const { data: session, error: serr } = await anonClient.auth.verifyOtp({
      type: "magiclink",
      token_hash,
    });
    if (serr) throw serr;

    return new Response(
      JSON.stringify({
        access_token: session.session?.access_token,
        refresh_token: session.session?.refresh_token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("pin-login error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
