-- Cleanup Make Kenya Clean / UrbanPulse Nairobi presentation demo data.
--
-- REVIEW BEFORE RUNNING. This removes only records marked with the demo
-- tracking-code range MKC-2026-D### or [DEMO] descriptions/organization names.
-- It does not touch real community reports, user profiles, access requests,
-- storage objects, or private evidence files.

begin;

delete from public.community_confirmations
where tracking_code like 'MKC-2026-D%';

delete from public.report_actions
where report_id in (
  select id from public.reports
  where tracking_code like 'MKC-2026-D%'
     or description like '%[DEMO]%'
);

delete from public.report_assignments
where report_id in (
  select id from public.reports
  where tracking_code like 'MKC-2026-D%'
     or description like '%[DEMO]%'
);

delete from public.report_updates
where report_id in (
  select id from public.reports
  where tracking_code like 'MKC-2026-D%'
     or description like '%[DEMO]%'
);

delete from public.reports
where tracking_code like 'MKC-2026-D%'
   or description like '%[DEMO]%';

delete from public.organizations
where name like '[DEMO] UrbanPulse%';

commit;

select
  count(*) as remaining_demo_reports
from public.reports
where tracking_code like 'MKC-2026-D%'
   or description like '%[DEMO]%';
