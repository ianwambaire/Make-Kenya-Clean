-- Make Kenya Clean / UrbanPulse Nairobi presentation demo seed.
--
-- REVIEW BEFORE RUNNING. This file is intentionally not a migration and is not
-- applied automatically. Run it manually only when you want demo data visible.
--
-- Safety markers:
-- - tracking_code values use the reserved MKC-2026-D### range.
-- - descriptions and demo organization names include [DEMO].
-- - reporter contact fields are blank and all reports are anonymous.
-- - no resolution_evidence rows are created, so there are no fake storage paths.
--
-- Why the validation trigger is temporarily disabled:
-- The production insert trigger requires new public reports to start as
-- "Reported". This seed needs presentation data across multiple lifecycle
-- stages. The trigger is disabled only inside this transaction, then restored.

begin;

alter table public.reports
  disable trigger validate_public_report_submission;

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

with demo_orgs as (
  insert into public.organizations (
    name,
    organization_type,
    area,
    contact_email,
    contact_phone,
    status,
    created_at,
    updated_at
  )
  values
    ('[DEMO] UrbanPulse Nairobi Water Response', 'Utility', 'Nairobi Eastlands', '', '', 'Active', '2026-08-01 08:00:00+03', '2026-08-01 08:00:00+03'),
    ('[DEMO] UrbanPulse Drainage & Flood Team', 'County', 'Nairobi Informal Settlements', '', '', 'Active', '2026-08-01 08:00:00+03', '2026-08-01 08:00:00+03'),
    ('[DEMO] UrbanPulse Waste & Sanitation Team', 'Community Organization', 'Nairobi County', '', '', 'Active', '2026-08-01 08:00:00+03', '2026-08-01 08:00:00+03')
  returning id, name
),
demo_reports as (
  insert into public.reports (
    id,
    tracking_code,
    issue_type,
    location_name,
    area,
    description,
    latitude,
    longitude,
    urgency,
    reporter_type,
    reporter_name,
    reporter_phone,
    reporter_email,
    is_anonymous,
    near_sensitive_area,
    risk_score,
    risk_label,
    status,
    created_at,
    photo_url
  )
  values
    (1900000000001, 'MKC-2026-D001', 'Sewage Overflow', 'Kibera Soweto East', 'Kibera', '[DEMO] Sewage overflow reported near footpath after blocked sewer line. Presentation data only.', -1.3131, 36.7896, 'Critical', 'Resident', '', '', '', true, 'Yes', 96, 'Critical', 'Reported', '2026-08-01 08:15:00+03', ''),
    (1900000000002, 'MKC-2026-D002', 'Blocked Drainage', 'Kibera Olympic Road', 'Kibera', '[DEMO] Drainage channel blocked by silt and waste, causing water to back up. Presentation data only.', -1.3098, 36.7818, 'High', 'Market Trader', '', '', '', true, 'Yes', 88, 'High', 'Verified', '2026-08-01 10:35:00+03', ''),
    (1900000000003, 'MKC-2026-D003', 'Flooding / Stagnant Water', 'Kibera Laini Saba', 'Kibera', '[DEMO] Stagnant water collecting beside homes after rainfall. Presentation data only.', -1.3165, 36.7799, 'High', 'Resident', '', '', '', true, 'No', 82, 'High', 'In Progress', '2026-08-02 07:45:00+03', ''),
    (1900000000004, 'MKC-2026-D004', 'Unsafe Water Point', 'Mathare Area 4A Water Kiosk', 'Mathare', '[DEMO] Brown water and smell reported at shared water point. Presentation data only.', -1.2606, 36.8569, 'Critical', 'Resident', '', '', '', true, 'Yes', 94, 'Critical', 'Assigned', '2026-08-02 09:10:00+03', ''),
    (1900000000005, 'MKC-2026-D005', 'Sewage Overflow', 'Mathare Valley Footbridge', 'Mathare', '[DEMO] Sewer overflow crossing pedestrian route near homes. Presentation data only.', -1.2624, 36.8587, 'Critical', 'Community Health Volunteer', '', '', '', true, 'Yes', 97, 'Critical', 'Resolution Submitted', '2026-08-02 13:20:00+03', ''),
    (1900000000006, 'MKC-2026-D006', 'Illegal Dumping', 'Mathare 3C Open Ground', 'Mathare', '[DEMO] Illegal dumping beside drainage channel. Presentation data only.', -1.2585, 36.8614, 'Medium', 'Resident', '', '', '', true, 'No', 66, 'Medium', 'Resolved', '2026-08-03 08:40:00+03', ''),
    (1900000000007, 'MKC-2026-D007', 'Unsafe Water Point', 'Mukuru kwa Njenga Borehole', 'Mukuru', '[DEMO] Unsafe water suspected after turbidity and smell at borehole. Presentation data only.', -1.3257, 36.8724, 'Critical', 'Resident', '', '', '', true, 'Yes', 95, 'Critical', 'Verified', '2026-08-03 12:05:00+03', ''),
    (1900000000008, 'MKC-2026-D008', 'Water Leak / Burst Pipe', 'Mukuru Pipeline Road', 'Mukuru', '[DEMO] Burst pipe leaking continuously into roadside drainage. Presentation data only.', -1.3204, 36.8662, 'High', 'Business Owner', '', '', '', true, 'No', 83, 'High', 'Assigned', '2026-08-03 15:15:00+03', ''),
    (1900000000009, 'MKC-2026-D009', 'Damaged Public Sanitation Facility', 'Mukuru Community Toilet Block', 'Mukuru', '[DEMO] Public toilet facility broken and unusable near settlement entrance. Presentation data only.', -1.3279, 36.8692, 'High', 'Resident', '', '', '', true, 'Yes', 75, 'High', 'Community Confirmed', '2026-08-04 09:35:00+03', ''),
    (1900000000010, 'MKC-2026-D010', 'Water Leak / Burst Pipe', 'Eastleigh Section III', 'Eastleigh', '[DEMO] Pipe pressure drop and visible water leak on access road. Presentation data only.', -1.2768, 36.8514, 'High', 'Business Owner', '', '', '', true, 'No', 81, 'High', 'In Progress', '2026-08-04 11:00:00+03', ''),
    (1900000000011, 'MKC-2026-D011', 'Uncollected Waste', 'Eastleigh 1st Avenue', 'Eastleigh', '[DEMO] Uncollected waste blocking pedestrian area and drainage inlet. Presentation data only.', -1.2796, 36.8488, 'High', 'Market Trader', '', '', '', true, 'No', 73, 'High', 'Reported', '2026-08-04 14:10:00+03', ''),
    (1900000000012, 'MKC-2026-D012', 'Unsafe Water Point', 'Eastleigh Water Vendor Lane', 'Eastleigh', '[DEMO] Residents report unsafe water taste and brown color. Presentation data only.', -1.2747, 36.8468, 'High', 'Resident', '', '', '', true, 'Yes', 89, 'High', 'Resolved', '2026-08-05 08:30:00+03', ''),
    (1900000000013, 'MKC-2026-D013', 'Uncollected Waste', 'Dandora Phase 4', 'Dandora', '[DEMO] Waste overflow near estate collection point. Presentation data only.', -1.2483, 36.9048, 'High', 'Resident', '', '', '', true, 'No', 72, 'High', 'Assigned', '2026-08-05 10:00:00+03', ''),
    (1900000000014, 'MKC-2026-D014', 'Illegal Dumping', 'Dandora Dumping Corridor', 'Dandora', '[DEMO] Illegal dumping spreading onto access road and drainage. Presentation data only.', -1.2449, 36.8997, 'Medium', 'Resident', '', '', '', true, 'No', 67, 'Medium', 'In Progress', '2026-08-05 12:25:00+03', ''),
    (1900000000015, 'MKC-2026-D015', 'Blocked Drainage', 'Dandora Phase 2 Drain', 'Dandora', '[DEMO] Blocked drainage causing foul stagnant water. Presentation data only.', -1.2506, 36.8972, 'High', 'Resident', '', '', '', true, 'Yes', 86, 'High', 'Resolution Submitted', '2026-08-05 16:20:00+03', ''),
    (1900000000016, 'MKC-2026-D016', 'Flooding / Stagnant Water', 'Pipeline Estate Block 8', 'Pipeline', '[DEMO] Flooding reported between apartment blocks after drainage overflow. Presentation data only.', -1.3199, 36.8949, 'High', 'Estate Manager', '', '', '', true, 'No', 83, 'High', 'Verified', '2026-08-06 07:50:00+03', ''),
    (1900000000017, 'MKC-2026-D017', 'Sewage Overflow', 'Pipeline Sewage Manhole', 'Pipeline', '[DEMO] Sewage manhole overflowing into walkway near shops. Presentation data only.', -1.3222, 36.8907, 'Critical', 'Business Owner', '', '', '', true, 'Yes', 98, 'Critical', 'Assigned', '2026-08-06 09:45:00+03', ''),
    (1900000000018, 'MKC-2026-D018', 'Water Leak / Burst Pipe', 'Pipeline Outer Ring Junction', 'Pipeline', '[DEMO] Water flowing from suspected burst pipe near road edge. Presentation data only.', -1.3182, 36.8868, 'High', 'Visitor', '', '', '', true, 'No', 80, 'High', 'Resolved', '2026-08-06 13:30:00+03', ''),
    (1900000000019, 'MKC-2026-D019', 'Unsafe Water Point', 'Githurai 45 Water Point', 'Githurai', '[DEMO] Unsafe water point flagged by residents after color change. Presentation data only.', -1.2037, 36.9173, 'High', 'Resident', '', '', '', true, 'Yes', 90, 'High', 'Reported', '2026-08-07 08:10:00+03', ''),
    (1900000000020, 'MKC-2026-D020', 'Blocked Drainage', 'Githurai Market Drain', 'Githurai', '[DEMO] Blocked drain at market entrance causing wastewater pooling. Presentation data only.', -1.2011, 36.9145, 'High', 'Market Trader', '', '', '', true, 'Yes', 87, 'High', 'In Progress', '2026-08-07 11:40:00+03', ''),
    (1900000000021, 'MKC-2026-D021', 'Damaged Public Sanitation Facility', 'Kawangware Public Toilet', 'Kawangware', '[DEMO] Damaged public sanitation facility near bus stage. Presentation data only.', -1.2841, 36.7451, 'High', 'Resident', '', '', '', true, 'Yes', 76, 'High', 'Verified', '2026-08-07 15:25:00+03', ''),
    (1900000000022, 'MKC-2026-D022', 'Illegal Dumping', 'Kawangware 56 Drainage Edge', 'Kawangware', '[DEMO] Dumped trash blocking open drainage line. Presentation data only.', -1.2862, 36.7504, 'Medium', 'Resident', '', '', '', true, 'No', 65, 'Medium', 'Community Confirmed', '2026-08-08 08:35:00+03', ''),
    (1900000000023, 'MKC-2026-D023', 'Other Utility Risk', 'Nairobi CBD Moi Avenue', 'CBD', '[DEMO] Utility access cover damaged and creating pedestrian hazard. Presentation data only.', -1.2846, 36.8247, 'Medium', 'Visitor', '', '', '', true, 'No', 55, 'Medium', 'Reported', '2026-08-08 10:20:00+03', ''),
    (1900000000024, 'MKC-2026-D024', 'Water Leak / Burst Pipe', 'CBD Kenyatta Avenue', 'CBD', '[DEMO] Water leak reported at road crossing near business frontage. Presentation data only.', -1.2864, 36.8172, 'High', 'Business Owner', '', '', '', true, 'No', 78, 'High', 'Resolved', '2026-08-08 13:10:00+03', ''),
    (1900000000025, 'MKC-2026-D025', 'Blocked Drainage', 'South B Mombasa Road Service Lane', 'South B', '[DEMO] Blocked drainage inlet causing runoff to collect on service lane. Presentation data only.', -1.3145, 36.8421, 'High', 'Resident', '', '', '', true, 'No', 82, 'High', 'Assigned', '2026-08-09 07:40:00+03', ''),
    (1900000000026, 'MKC-2026-D026', 'Uncollected Waste', 'South B Shopping Centre', 'South B', '[DEMO] Uncollected waste at shopping centre collection point. Presentation data only.', -1.3123, 36.8337, 'Medium', 'Business Owner', '', '', '', true, 'No', 62, 'Medium', 'Verified', '2026-08-09 09:55:00+03', ''),
    (1900000000027, 'MKC-2026-D027', 'Flooding / Stagnant Water', 'Embakasi Tassia Road', 'Embakasi', '[DEMO] Stagnant flood water blocking access after rain. Presentation data only.', -1.3077, 36.8993, 'High', 'Resident', '', '', '', true, 'No', 84, 'High', 'In Progress', '2026-08-09 12:35:00+03', ''),
    (1900000000028, 'MKC-2026-D028', 'Unsafe Water Point', 'Embakasi Pipeline Water Kiosk', 'Embakasi', '[DEMO] Water kiosk reported for contaminated smell. Presentation data only.', -1.3108, 36.9072, 'High', 'Resident', '', '', '', true, 'Yes', 91, 'High', 'Resolution Submitted', '2026-08-09 16:05:00+03', ''),
    (1900000000029, 'MKC-2026-D029', 'Damaged Public Sanitation Facility', 'Kariobangi North Market Toilet', 'Kariobangi', '[DEMO] Market public toilet broken and overflowing. Presentation data only.', -1.2523, 36.8846, 'High', 'Market Trader', '', '', '', true, 'Yes', 78, 'High', 'Resolved', '2026-08-10 08:15:00+03', ''),
    (1900000000030, 'MKC-2026-D030', 'Sewage Overflow', 'Kariobangi Light Industries', 'Kariobangi', '[DEMO] Sewage overflow behind light industrial units. Presentation data only.', -1.2462, 36.8833, 'Critical', 'Business Owner', '', '', '', true, 'No', 93, 'Critical', 'Community Confirmed', '2026-08-10 11:50:00+03', ''),
    (1900000000031, 'MKC-2026-D031', 'Flooding / Stagnant Water', 'Mathare Kosovo Footpath', 'Mathare', '[DEMO] Report reopened after community disputed earlier drainage fix; stagnant water returned. Presentation data only.', -1.2597, 36.8535, 'High', 'Resident', '', '', '', true, 'Yes', 86, 'High', 'In Progress', '2026-08-10 15:30:00+03', ''),
    (1900000000032, 'MKC-2026-D032', 'Illegal Dumping', 'Mukuru Viwandani Lane', 'Mukuru', '[DEMO] New illegal dumping pile beside workshop drainage. Presentation data only.', -1.3039, 36.8611, 'Medium', 'Business Owner', '', '', '', true, 'No', 64, 'Medium', 'Reported', '2026-08-11 07:35:00+03', '')
  returning id, tracking_code, status, issue_type
),
updated_reports as (
  update public.reports report
  set status = seed.status
  from (values
    ('MKC-2026-D001', 'Reported'),
    ('MKC-2026-D002', 'Verified'),
    ('MKC-2026-D003', 'In Progress'),
    ('MKC-2026-D004', 'Assigned'),
    ('MKC-2026-D005', 'Resolution Submitted'),
    ('MKC-2026-D006', 'Resolved'),
    ('MKC-2026-D007', 'Verified'),
    ('MKC-2026-D008', 'Assigned'),
    ('MKC-2026-D009', 'Community Confirmed'),
    ('MKC-2026-D010', 'In Progress'),
    ('MKC-2026-D011', 'Reported'),
    ('MKC-2026-D012', 'Resolved'),
    ('MKC-2026-D013', 'Assigned'),
    ('MKC-2026-D014', 'In Progress'),
    ('MKC-2026-D015', 'Resolution Submitted'),
    ('MKC-2026-D016', 'Verified'),
    ('MKC-2026-D017', 'Assigned'),
    ('MKC-2026-D018', 'Resolved'),
    ('MKC-2026-D019', 'Reported'),
    ('MKC-2026-D020', 'In Progress'),
    ('MKC-2026-D021', 'Verified'),
    ('MKC-2026-D022', 'Community Confirmed'),
    ('MKC-2026-D023', 'Reported'),
    ('MKC-2026-D024', 'Resolved'),
    ('MKC-2026-D025', 'Assigned'),
    ('MKC-2026-D026', 'Verified'),
    ('MKC-2026-D027', 'In Progress'),
    ('MKC-2026-D028', 'Resolution Submitted'),
    ('MKC-2026-D029', 'Resolved'),
    ('MKC-2026-D030', 'Community Confirmed'),
    ('MKC-2026-D031', 'In Progress'),
    ('MKC-2026-D032', 'Reported')
  ) as seed(tracking_code, status)
  where report.tracking_code = seed.tracking_code
  returning report.id, report.tracking_code, report.status, report.issue_type, report.created_at
),
assignments_seed as (
  insert into public.report_assignments (
    report_id,
    organization_id,
    assigned_at,
    accepted_at,
    status,
    note,
    created_at,
    updated_at
  )
  select
    report.id,
    case
      when report.issue_type in ('Water Leak / Burst Pipe', 'Unsafe Water Point') then (select id from demo_orgs where name = '[DEMO] UrbanPulse Nairobi Water Response')
      when report.issue_type in ('Blocked Drainage', 'Flooding / Stagnant Water') then (select id from demo_orgs where name = '[DEMO] UrbanPulse Drainage & Flood Team')
      else (select id from demo_orgs where name = '[DEMO] UrbanPulse Waste & Sanitation Team')
    end,
    report.created_at::timestamptz + interval '4 hours',
    case when report.status in ('In Progress', 'Resolution Submitted', 'Resolved', 'Community Confirmed') then report.created_at::timestamptz + interval '8 hours' else null end,
    case
      when report.status = 'Assigned' then 'Assigned'
      when report.status in ('In Progress', 'Resolution Submitted') then 'Accepted'
      when report.status in ('Resolved', 'Community Confirmed') then 'Completed'
      else 'Assigned'
    end,
    '[DEMO] Presentation assignment generated for UrbanPulse dashboard.',
    report.created_at::timestamptz + interval '4 hours',
    report.created_at::timestamptz + interval '8 hours'
  from updated_reports report
  where report.status in ('Assigned', 'In Progress', 'Resolution Submitted', 'Resolved', 'Community Confirmed')
  returning id, report_id
),
report_actions_seed as (
  insert into public.report_actions (
    report_id,
    assignment_id,
    organization_id,
    action_type,
    note,
    visibility,
    created_at
  )
  select
    assignment.report_id,
    assignment.id,
    assignment.organization_id,
    case
      when report.status in ('Resolved', 'Community Confirmed') then 'Repair'
      when report.status = 'Resolution Submitted' then 'Follow-up'
      when report.status = 'In Progress' then 'Work Started'
      else 'Inspection'
    end,
    case
      when report.tracking_code = 'MKC-2026-D031' then '[DEMO] Report Reopened: community dispute indicates stagnant water returned after initial drainage work.'
      when report.status = 'Resolution Submitted' then '[DEMO] Response team submitted a text-only resolution update for admin review. No evidence files are seeded.'
      when report.status in ('Resolved', 'Community Confirmed') then '[DEMO] Response update recorded for presentation workflow.'
      else '[DEMO] Field team update for presentation workflow.'
    end,
    'Public',
    report.created_at::timestamptz + interval '12 hours'
  from public.report_assignments assignment
  join public.reports report on report.id = assignment.report_id
  where report.tracking_code like 'MKC-2026-D%'
  returning id
),
community_seed as (
  insert into public.community_confirmations (
    report_id,
    tracking_code,
    confirmation,
    note,
    submitted_at,
    review_status,
    reviewed_at,
    review_note,
    created_at
  )
  select
    report.id,
    report.tracking_code,
    case when report.tracking_code = 'MKC-2026-D031' then 'Disputed' else 'Confirmed' end,
    case when report.tracking_code = 'MKC-2026-D031' then '[DEMO] Community says flooding returned after initial response.' else '[DEMO] Community confirmed the issue appears resolved.' end,
    report.created_at::timestamptz + interval '2 days',
    'Approved',
    report.created_at::timestamptz + interval '2 days 2 hours',
    '[DEMO] Presentation community review.',
    report.created_at::timestamptz + interval '2 days'
  from public.reports report
  where report.tracking_code in ('MKC-2026-D009', 'MKC-2026-D022', 'MKC-2026-D030', 'MKC-2026-D031')
  returning id
)
insert into public.report_updates (
  report_id,
  status,
  note,
  updated_by_name,
  created_at
)
select
  report.id,
  'Reported',
  '[DEMO] Demo report received for Nairobi UrbanPulse presentation.',
  'Demo Seed',
  report.created_at::timestamptz
from public.reports report
where report.tracking_code like 'MKC-2026-D%'
union all
select
  report.id,
  report.status,
  case
    when report.tracking_code = 'MKC-2026-D031' then '[DEMO] Report Reopened after community dispute; represented as In Progress in reports.status.'
    when report.status = 'Resolution Submitted' then '[DEMO] Text-only resolution submitted for review; no storage evidence rows were created.'
    else '[DEMO] Demo lifecycle update for presentation.'
  end,
  'Demo Seed',
  report.created_at::timestamptz + interval '12 hours'
from public.reports report
where report.tracking_code like 'MKC-2026-D%'
  and report.status <> 'Reported';

alter table public.reports
  enable trigger validate_public_report_submission;

commit;

select
  count(*) as demo_report_count
from public.reports
where tracking_code like 'MKC-2026-D%'
  and description like '%[DEMO]%';
