import { supabase } from "../lib/supabase";

export const publicReportColumns = [
  "id",
  "tracking_code",
  "issue_type",
  "location_name",
  "area",
  "description",
  "latitude",
  "longitude",
  "urgency",
  "reporter_type",
  "is_anonymous",
  "near_sensitive_area",
  "risk_score",
  "risk_label",
  "status",
  "created_at",
  "photo_url",
].join(", ");

export const publicTimelineColumns = [
  "id",
  "report_id",
  "status",
  "note",
  "updated_by_name",
  "created_at",
].join(", ");

export const staffReportColumns = [
  publicReportColumns,
  "reporter_name",
  "reporter_phone",
  "reporter_email",
].join(", ");

export function fromSupabaseReport(report) {
  if (!report) return null;

  return {
    id: report.id,
    trackingCode: report.tracking_code,
    issueType: report.issue_type,
    locationName: report.location_name,
    area: report.area,
    description: report.description || "",
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    urgency: report.urgency || "",
    reporterType: report.reporter_type || "Public Reporter",
    reporterName: report.reporter_name || "",
    reporterPhone: report.reporter_phone || "",
    reporterEmail: report.reporter_email || "",
    isAnonymous: report.is_anonymous ?? true,
    nearSensitiveArea: report.near_sensitive_area || "No",
    riskScore: Number(report.risk_score) || 0,
    riskLabel: report.risk_label || "Low",
    status: report.status || "Reported",
    createdAt: report.created_at,
    photoUrl: report.photo_url || "",
  };
}

export function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export async function loadPublicReportDetail(trackingCode) {
  const cleanCode = trackingCode.trim().toUpperCase();

  const { data, error } = await supabase
    .from("public_reports")
    .select(publicReportColumns)
    .eq("tracking_code", cleanCode)
    .maybeSingle();

  if (error) throw error;

  return fromSupabaseReport(data);
}

export async function loadStaffReportDetail(trackingCode) {
  const cleanCode = trackingCode.trim().toUpperCase();

  const { data, error } = await supabase
    .from("reports")
    .select(staffReportColumns)
    .eq("tracking_code", cleanCode)
    .maybeSingle();

  if (error) throw error;

  return fromSupabaseReport(data);
}

export async function loadReportTimeline(
  reportId,
  { staff = false } = {}
) {
  const { data, error } = await supabase
    .from(staff ? "report_updates" : "public_report_updates")
    .select(publicTimelineColumns)
    .eq("report_id", reportId)
    .order("created_at", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}

export async function submitCommunityConfirmation({
  trackingCode,
  confirmation,
  note,
}) {
  const { data, error } = await supabase.rpc(
    "submit_community_confirmation",
    {
      p_tracking_code: trackingCode,
      p_confirmation: confirmation,
      p_note: note || "",
    }
  );

  if (error) throw error;
  if (data?.success === false) {
    throw new Error(
      data.error ||
        "Community confirmation could not be submitted."
    );
  }

  return data;
}
