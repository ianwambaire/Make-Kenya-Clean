import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-device-token, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedRiskLevels = new Set([
  "Normal",
  "Warning",
  "Critical",
]);

const allowedIssueTypes = new Set([
  "Water Leak / Burst Pipe",
  "Blocked Drainage",
  "Sewage Overflow",
  "Unsafe Water Point",
  "Flooding / Stagnant Water",
  "Illegal Dumping",
  "Uncollected Waste",
  "Damaged Public Sanitation Facility",
  "Other Utility Risk",
]);

type SensorPayload = {
  sensor_id?: unknown;
  sensor_name?: unknown;
  sensor_type?: unknown;
  location_name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  reading_value?: unknown;
  reading_unit?: unknown;
  threshold_value?: unknown;
  risk_level?: unknown;
  issue_type?: unknown;
  explanation?: unknown;
  measured_at?: unknown;
};

type SensorDevice = {
  id: string;
  sensor_id: string;
  sensor_name: string;
  sensor_type: string;
  issue_type: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  risk_direction: "lower_is_risk" | "higher_is_risk";
  status: string;
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

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";

  return value.trim().slice(0, maxLength);
}

function parseNumber(
  value: unknown,
  fieldName: string,
  min: number,
  max: number,
  { required = true } = {},
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    if (!required) return null;
    throw new Error(`${fieldName} is required`);
  }

  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue < min ||
    numericValue > max
  ) {
    throw new Error(`${fieldName} is out of range`);
  }

  return numericValue;
}

function parseMeasuredAt(value: unknown) {
  if (!value) return null;
  if (typeof value !== "string") {
    throw new Error("measured_at must be an ISO timestamp");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("measured_at must be an ISO timestamp");
  }

  const now = Date.now();
  const timestamp = date.getTime();

  if (
    timestamp > now + 24 * 60 * 60 * 1000 ||
    timestamp < now - 30 * 24 * 60 * 60 * 1000
  ) {
    throw new Error("measured_at is outside the allowed range");
  }

  return date.toISOString();
}

function getDeviceToken(request: Request) {
  const headerToken =
    request.headers.get("X-Device-Token") || "";
  if (headerToken.trim()) return headerToken.trim();

  const authorization =
    request.headers.get("Authorization") || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "").trim();
  }

  return "";
}

function validateDeviceToken(token: string) {
  if (token.length < 32 || token.length > 256) {
    throw new Error("Device token is invalid");
  }
}

async function hashDeviceToken(token: string) {
  const encoded = new TextEncoder().encode(
    `mkc-sensor-token-v1:${token}`,
  );
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoded,
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function validatePayload(payload: SensorPayload) {
  const sensorId = cleanText(payload.sensor_id, 80);
  const readingUnit =
    cleanText(payload.reading_unit, 24) || "cm";
  const riskLevel = cleanText(payload.risk_level, 20);
  const explanation = cleanText(
    payload.explanation,
    500,
  );

  if (!sensorId) throw new Error("sensor_id is required");
  if (!allowedRiskLevels.has(riskLevel)) {
    throw new Error("risk_level is invalid");
  }

  return {
    sensorId,
    readingValue: parseNumber(
      payload.reading_value,
      "reading_value",
      0,
      100000,
    ),
    readingUnit,
    thresholdValue: parseNumber(
      payload.threshold_value,
      "threshold_value",
      0,
      100000,
      { required: false },
    ),
    riskLevel,
    explanation,
    measuredAt: parseMeasuredAt(payload.measured_at),
  };
}

function deriveRiskLevel(
  device: SensorDevice,
  readingValue: number,
  thresholdValue: number | null,
  submittedRiskLevel: string,
) {
  if (thresholdValue === null || thresholdValue === 0) {
    return submittedRiskLevel;
  }

  if (device.risk_direction === "higher_is_risk") {
    if (readingValue >= thresholdValue) return "Critical";
    if (readingValue >= thresholdValue * 0.8) {
      return "Warning";
    }
    return "Normal";
  }

  if (readingValue <= thresholdValue) return "Critical";
  if (readingValue <= thresholdValue * 1.3) {
    return "Warning";
  }

  return "Normal";
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
    const deviceToken = getDeviceToken(request);

    if (!deviceToken) {
      return jsonResponse(
        {
          success: false,
          error: "Device authentication required",
        },
        401,
      );
    }

    validateDeviceToken(deviceToken);

    const payload = validatePayload(
      await request.json(),
    );
    const tokenHash = await hashDeviceToken(deviceToken);
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

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

    const { data: device, error: deviceError } =
      await supabaseAdmin
        .from("sensor_devices")
        .select(
          "id, sensor_id, sensor_name, sensor_type, issue_type, location_name, latitude, longitude, risk_direction, status",
        )
        .eq("sensor_id", payload.sensorId)
        .eq("token_hash", tokenHash)
        .maybeSingle<SensorDevice>();

    if (deviceError) throw deviceError;

    if (!device || device.status !== "Active") {
      return jsonResponse(
        {
          success: false,
          error: "Sensor device is not authorized",
        },
        403,
      );
    }

    if (!allowedIssueTypes.has(device.issue_type)) {
      return jsonResponse(
        {
          success: false,
          error: "Sensor device issue type is invalid",
        },
        500,
      );
    }

    const { error: rateLimitError } =
      await supabaseAdmin.rpc("assert_rate_limit", {
        p_action: "sensor_ingest",
        p_identifier: payload.sensorId,
        p_hour_limit: 240,
        p_day_limit: 2000,
      });

    if (rateLimitError) throw rateLimitError;

    const receivedAt = new Date().toISOString();
    const { data: lastAlert, error: lastAlertError } =
      await supabaseAdmin
        .from("sensor_alerts")
        .select("id, received_at")
        .eq("sensor_id", device.sensor_id)
        .order("received_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lastAlertError) throw lastAlertError;

    if (
      lastAlert?.received_at &&
      Date.now() -
        new Date(lastAlert.received_at).getTime() <
        20 * 1000
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Sensor reading interval is too short. Please retry shortly.",
        },
        429,
      );
    }

    const riskLevel = deriveRiskLevel(
      device,
      payload.readingValue,
      payload.thresholdValue,
      payload.riskLevel,
    );

    const { data: alert, error: insertError } =
      await supabaseAdmin
        .from("sensor_alerts")
        .insert({
          sensor_device_id: device.id,
          sensor_id: device.sensor_id,
          sensor_name: device.sensor_name,
          sensor_type: device.sensor_type,
          location_name: device.location_name,
          latitude: device.latitude,
          longitude: device.longitude,
          reading_value: payload.readingValue,
          reading_unit: payload.readingUnit,
          threshold_value: payload.thresholdValue,
          risk_level: riskLevel,
          issue_type: device.issue_type,
          alert_status: "New",
          explanation: payload.explanation,
          measured_at: payload.measuredAt || receivedAt,
          received_at: receivedAt,
        })
        .select("id, received_at")
        .single();

    if (insertError) throw insertError;

    await supabaseAdmin
      .from("sensor_devices")
      .update({
        last_seen_at: receivedAt,
        updated_at: receivedAt,
      })
      .eq("id", device.id);

    return jsonResponse({
      success: true,
      alert_id: alert.id,
      received_at: alert.received_at,
    });
  } catch (error) {
    const validationError =
      error instanceof Error &&
      ![
        "SUPABASE_URL is not configured",
        "SUPABASE_SERVICE_ROLE_KEY is not configured",
      ].includes(error.message);

    if (validationError) {
      return jsonResponse(
        { success: false, error: error.message },
        400,
      );
    }

    logFunctionError(
      "ingest-sensor-reading failed",
      error,
    );

    return jsonResponse(
      {
        success: false,
        error:
          "Sensor reading could not be ingested. Please retry or check device configuration.",
      },
      500,
    );
  }
});
