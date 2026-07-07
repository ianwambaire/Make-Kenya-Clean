-- Sanitize user-entered operational action notes in the public timeline.
--
-- Public action notes may contain organization names or operational details.
-- Authorized staff and assigned organizations still read raw report_updates
-- through the base table policy added in migration 202607060005.

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
    else 'A public response update has been added.'
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
