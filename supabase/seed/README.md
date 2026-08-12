# Nairobi UrbanPulse Demo Seed

This folder contains reviewable SQL for loading and removing safe presentation data.

The seed is not a migration and is not applied automatically.

## Files

- `demo_nairobi_urbanpulse.sql` creates 32 anonymous demo reports and related safe workflow records.
- `cleanup_demo_nairobi_urbanpulse.sql` removes only the demo records.

## Safety Markers

Demo reports use:

- tracking codes in the `MKC-2026-D###` range
- descriptions containing `[DEMO]`
- blank reporter name, phone, and email fields
- anonymous reporter settings

Demo organizations use names beginning with:

- `[DEMO] UrbanPulse`

The seed intentionally does not create `resolution_evidence` rows. That avoids fake storage paths and missing private evidence files.

## How To Run The Seed

Run only after reviewing the SQL:

```bash
npx supabase db query --linked --file supabase/seed/demo_nairobi_urbanpulse.sql
```

You can also paste the SQL into the Supabase SQL editor for the linked project.

## How To Verify

After seeding, check:

```sql
select status, count(*)
from public.reports
where tracking_code like 'MKC-2026-D%'
group by status
order by status;

select area, count(*)
from public.reports
where tracking_code like 'MKC-2026-D%'
group by area
order by count(*) desc;
```

In the app, verify:

- `/map` shows Nairobi demo markers and hotspot summaries
- `/admin/intelligence` shows populated metrics and charts
- `/dashboard` shows varied workflow states

## How To Cleanup

Run only after reviewing the SQL:

```bash
npx supabase db query --linked --file supabase/seed/cleanup_demo_nairobi_urbanpulse.sql
```

Or paste `cleanup_demo_nairobi_urbanpulse.sql` into the Supabase SQL editor.

The cleanup script deletes records only when they match the demo tracking-code range or `[DEMO]` markers.
