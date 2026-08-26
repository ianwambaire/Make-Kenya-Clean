import { supabase } from "../lib/supabase";

const sensorAlertColumns = [
  "id",
  "sensor_id",
  "sensor_name",
  "sensor_type",
  "location_name",
  "latitude",
  "longitude",
  "reading_value",
  "reading_unit",
  "threshold_value",
  "risk_level",
  "issue_type",
  "alert_status",
  "explanation",
  "measured_at",
  "received_at",
  "converted_tracking_code",
  "converted_at",
].join(", ");

export function fromSensorAlert(alert) {
  return {
    id: alert.id,
    sensorId: alert.sensor_id,
    name: alert.sensor_name,
    type: alert.sensor_type,
    locationName: alert.location_name,
    latitude: Number(alert.latitude),
    longitude: Number(alert.longitude),
    coordinates:
      Number.isFinite(Number(alert.latitude)) &&
      Number.isFinite(Number(alert.longitude))
        ? `${Number(alert.latitude).toFixed(4)}, ${Number(
            alert.longitude
          ).toFixed(4)}`
        : "Coordinates pending",
    readingValue: `${alert.reading_value} ${
      alert.reading_unit || ""
    }`.trim(),
    thresholdValue:
      alert.threshold_value !== null &&
      alert.threshold_value !== undefined
        ? `${alert.threshold_value} ${
            alert.reading_unit || ""
          }`.trim()
        : "Not set",
    riskLevel: alert.risk_level || "Normal",
    issueType: alert.issue_type || "Other Utility Risk",
    timestamp:
      alert.measured_at ||
      alert.received_at ||
      "",
    receivedAt: alert.received_at || "",
    status: alert.alert_status || "New",
    explanation: alert.explanation || "",
    convertedTrackingCode:
      alert.converted_tracking_code || "",
    convertedAt: alert.converted_at || "",
    source: "Live",
  };
}

export async function loadSensorAlerts() {
  const { data, error } = await supabase
    .from("sensor_alerts")
    .select(sensorAlertColumns)
    .order("received_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data || []).map(fromSensorAlert);
}

export async function convertSensorAlertToReport(alertId) {
  const { data, error } = await supabase.rpc(
    "convert_sensor_alert_to_report",
    {
      p_alert_id: alertId,
    }
  );

  if (error) throw error;
  if (data?.success === false) {
    throw new Error(
      data.error ||
        "Sensor alert could not be converted to a report."
    );
  }

  return data;
}
