-- Public-safe report timeline hardening.
--
-- Existing report_updates rows are preserved. This migration prevents public
-- clients and unrelated authenticated users from reading raw timeline notes
-- that may contain staff names, organization names, or operational details.

create or replace view public.public_report_updates
with (security_barrier = true)
as
select
  id,
  report_id,
  status,
  case
    when status = 'Reported' then 'Report received successfully.'
    when status = 'Verified' then 'Report verified by an approved Maji Champion.'
    when status = 'Assigned' then 'Response work has been assigned to an approved partner.'
    when status = 'In Progress'
      and note ilike '%accepted the assignment%'
      then 'Response work is in progress.'
    when status = 'In Progress'
      and note ilike '%reopening%'
      then 'Additional response work is in progress.'
    when status = 'Resolution Submitted' then 'Resolution evidence has been submitted for review.'
    when status = 'Resolved' then 'Resolution has been approved by Make Kenya Clean.'
    when status = 'Community Feedback Submitted' then 'Community feedback has been submitted for review.'
    else coalesce(note, '')
  end as note,
  case
    when updated_by_name in ('Public Reporter', 'Community Feedback')
      then updated_by_name
    else 'Make Kenya Clean'
  end as updated_by_name,
  created_at
from public.report_updates;

revoke all on public.public_report_updates from anon, authenticated;
grant select on public.public_report_updates to anon, authenticated;

revoke all on public.report_updates from anon, authenticated;
grant insert on public.report_updates to anon, authenticated;
grant select, insert on public.report_updates to authenticated;

drop policy if exists "report_updates_public_select" on public.report_updates;
drop policy if exists "report_updates_authorized_select" on public.report_updates;
create policy "report_updates_authorized_select"
on public.report_updates
for select
to authenticated
using (
  public.current_profile_role() in ('admin', 'champion')
  or exists (
    select 1
    from public.report_assignments assignment
    where assignment.report_id = report_updates.report_id
      and assignment.status in ('Assigned', 'Accepted', 'Completed')
      and public.is_organization_member(assignment.organization_id)
  )
);
