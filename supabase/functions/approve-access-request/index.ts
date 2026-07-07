import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AccessRequest = {
  id: string;
  full_name: string | null;
  email: string | null;
  requested_role: string | null;
  area: string | null;
  organization_name: string | null;
  status: string | null;
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

function logFunctionError(
  operation: string,
  error: unknown,
  context: Record<string, unknown> = {},
) {
  console.error(operation, {
    ...context,
    error:
      error instanceof Error
        ? error.name
        : "UnknownError",
  });
}

async function findAuthUserByEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;

  while (page <= 20) {
    const { data, error } =
      await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 100,
      });

    if (error) throw error;

    const user = data.users.find(
      (candidate) =>
        candidate.email?.toLowerCase() === normalizedEmail,
    );

    if (user) return user;
    if (data.users.length < 100) return null;

    page += 1;
  }

  throw new Error(
    "Could not safely search all Auth users. Narrow the lookup strategy before approving this request.",
  );
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
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const siteUrl =
      Deno.env.get("SITE_URL") ||
      Deno.env.get("PUBLIC_SITE_URL") ||
      "";

    const authorization =
      request.headers.get("Authorization") || "";
    const jwt = authorization.replace("Bearer ", "").trim();

    if (!jwt) {
      return jsonResponse(
        { success: false, error: "Authentication required" },
        401,
      );
    }

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

    const body = await request.json().catch(() => ({}));
    const requestId = String(
      body.request_id || body.requestId || "",
    ).trim();

    if (!requestId) {
      return jsonResponse(
        { success: false, error: "request_id is required" },
        400,
      );
    }

    const {
      data: accessRequest,
      error: requestError,
    } = await supabaseAdmin
      .from("access_requests")
      .select(
        "id, full_name, email, requested_role, area, organization_name, status",
      )
      .eq("id", requestId)
      .maybeSingle<AccessRequest>();

    if (requestError) throw requestError;

    if (!accessRequest) {
      return jsonResponse(
        { success: false, error: "Access request not found" },
        404,
      );
    }

    if (accessRequest.status !== "Pending") {
      return jsonResponse(
        {
          success: false,
          error: "Only pending access requests can be approved",
        },
        409,
      );
    }

    const approvedRole = accessRequest.requested_role;

    if (
      approvedRole !== "champion" &&
      approvedRole !== "organization"
    ) {
      return jsonResponse(
        { success: false, error: "Invalid requested role" },
        400,
      );
    }

    const email = accessRequest.email?.trim().toLowerCase();

    if (!email) {
      return jsonResponse(
        { success: false, error: "Access request email is missing" },
        400,
      );
    }

    let approvedUser = await findAuthUserByEmail(
      supabaseAdmin,
      email,
    );
    let invitationSent = false;

    if (!approvedUser) {
      const redirectTo = siteUrl
        ? `${siteUrl.replace(/\/$/, "")}/update-password`
        : undefined;

      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(
          email,
          {
            data: {
              full_name: accessRequest.full_name || "",
              requested_role: approvedRole,
              access_request_id: accessRequest.id,
            },
            redirectTo,
          },
        );

      if (inviteError) {
        approvedUser = await findAuthUserByEmail(
          supabaseAdmin,
          email,
        );

        if (!approvedUser) throw inviteError;
      } else {
        approvedUser = inviteData.user;
        invitationSent = true;
      }
    }

    if (!approvedUser) {
      throw new Error("Could not create or load Auth user");
    }

    const { error: upsertProfileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: approvedUser.id,
          full_name: accessRequest.full_name || "",
          role: approvedRole,
          area: accessRequest.area || "",
          organization_name:
            accessRequest.organization_name || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (upsertProfileError) throw upsertProfileError;

    const { data: approvedRequest, error: approveError } =
      await supabaseAdmin
        .from("access_requests")
        .update({
          status: "Approved",
          reviewed_by: caller.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("status", "Pending")
        .select("id, status, reviewed_at")
        .maybeSingle();

    if (approveError) throw approveError;

    if (!approvedRequest) {
      return jsonResponse(
        {
          success: false,
          error:
            "Access request was already reviewed after approval started",
          partial_failure:
            "Auth user/profile may already exist. Re-check the request status before retrying.",
        },
        409,
      );
    }

    return jsonResponse({
      success: true,
      request_id: approvedRequest.id,
      status: approvedRequest.status,
      auth_user_id: approvedUser.id,
      invitation_sent: invitationSent,
      partial_failure_note:
        "Auth invitation/user creation and database updates are not one transaction. If a retry is needed after a failure, the function reuses an existing Auth user by email and upserts the profile.",
    });
  } catch (error) {
    logFunctionError(
      "approve-access-request failed",
      error,
    );

    return jsonResponse(
      {
        success: false,
        error:
          "Could not approve this access request. Please retry or check the function logs.",
      },
      500,
    );
  }
});
