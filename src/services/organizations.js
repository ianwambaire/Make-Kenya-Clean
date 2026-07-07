import { supabase } from "../lib/supabase";

export const organizationTypes = [
  "County",
  "NGO",
  "School",
  "Estate",
  "Institution",
  "Utility",
  "Community Organization",
  "Other",
];

export async function createOrganization(form) {
  const { data, error } = await supabase.rpc(
    "create_organization",
    {
      p_name: form.name,
      p_organization_type:
        form.organizationType || "Other",
      p_area: form.area || "",
      p_contact_email: form.contactEmail || "",
      p_contact_phone: form.contactPhone || "",
    }
  );

  if (error) throw error;
  return data;
}

export async function updateOrganization(id, form) {
  const { data, error } = await supabase.rpc(
    "update_organization",
    {
      p_organization_id: id,
      p_name: form.name,
      p_organization_type:
        form.organizationType || "Other",
      p_area: form.area || "",
      p_contact_email: form.contactEmail || "",
      p_contact_phone: form.contactPhone || "",
    }
  );

  if (error) throw error;
  return data;
}

export async function setOrganizationStatus(id, status) {
  const { data, error } = await supabase.rpc(
    "set_organization_status",
    {
      p_organization_id: id,
      p_status: status,
    }
  );

  if (error) throw error;
  return data;
}

export async function assignProfileToOrganization(
  profileId,
  organizationId
) {
  const { data, error } = await supabase.rpc(
    "assign_profile_to_organization",
    {
      p_profile_id: profileId,
      p_organization_id: organizationId,
    }
  );

  if (error) throw error;
  return data;
}

export async function removeProfileFromOrganization(profileId) {
  const { data, error } = await supabase.rpc(
    "remove_profile_from_organization",
    {
      p_profile_id: profileId,
    }
  );

  if (error) throw error;
  return data;
}
