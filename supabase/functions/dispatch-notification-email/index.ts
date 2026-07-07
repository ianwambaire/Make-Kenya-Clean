import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { success: false, error: "Method not allowed" },
      405,
    );
  }

  try {
    const authorization =
      request.headers.get("Authorization") || "";
    const jwt = authorization.replace("Bearer ", "").trim();

    if (!jwt) {
      return jsonResponse(
        { success: false, error: "Authentication required" },
        401,
      );
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail =
      Deno.env.get("NOTIFICATION_FROM_EMAIL") ||
      "Make Kenya Clean <notifications@makekenyaclean.org>";

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseAdmin.auth.getUser(jwt);

    if (callerError || !caller) {
      return jsonResponse(
        { success: false, error: "Invalid session" },
        401,
      );
    }

    const { data: callerProfile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("id", caller.id)
        .maybeSingle();

    if (profileError) throw profileError;

    if (callerProfile?.role !== "admin") {
      return jsonResponse(
        { success: false, error: "Admin role required" },
        403,
      );
    }

    if (!resendApiKey) {
      return jsonResponse(
        {
          success: false,
          configured: false,
          error:
            "RESEND_API_KEY is not configured. Notification rows remain in-app only or queued until an email provider is configured.",
        },
        424,
      );
    }

    const { data: notifications, error: loadError } =
      await supabaseAdmin
        .from("notifications")
        .select(
          "id, recipient_email, email_subject, email_body, delivery_status",
        )
        .eq("delivery_status", "Queued")
        .not("recipient_email", "eq", "")
        .limit(20);

    if (loadError) throw loadError;

    const results = [];

    for (const notification of notifications || []) {
      const response = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: notification.recipient_email,
            subject:
              notification.email_subject ||
              "Make Kenya Clean notification",
            text: notification.email_body,
          }),
        },
      );

      if (response.ok) {
        await supabaseAdmin
          .from("notifications")
          .update({
            delivery_status: "Sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", notification.id);
      } else {
        await supabaseAdmin
          .from("notifications")
          .update({ delivery_status: "Failed" })
          .eq("id", notification.id);
      }

      results.push({
        id: notification.id,
        sent: response.ok,
      });
    }

    return jsonResponse({
      success: true,
      configured: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("dispatch-notification-email error", error);

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected email dispatch error",
      },
      500,
    );
  }
});
