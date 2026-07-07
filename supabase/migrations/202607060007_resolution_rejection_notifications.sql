-- Ensure resolution rejections always notify the assigned organization.
--
-- The previous notification trigger inferred a rejection from free-text review
-- notes. That missed valid custom rejection notes. Rejection notifications now
-- come from the secure admin review RPC, where the decision is explicit.

create or replace function public.review_resolution_evidence(
  p_evidence_id bigint,
  p_approved boolean,
  p_review_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evidence public.resolution_evidence%rowtype;
  v_assignment public.report_assignments%rowtype;
  v_report public.reports%rowtype;
  v_actor_name text;
  v_new_report_status text;
  v_assignment_status text;
  v_review_note text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not public.is_admin() then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  select * into v_evidence
  from public.resolution_evidence
  where id = p_evidence_id
  for update;

  if not found then
    raise exception 'Resolution evidence not found' using errcode = 'P0002';
  end if;

  if v_evidence.review_status <> 'Submitted' then
    raise exception 'Resolution evidence has already been reviewed' using errcode = 'P0001';
  end if;

  select * into v_assignment
  from public.report_assignments
  where id = v_evidence.assignment_id;

  select * into v_report
  from public.reports
  where id = v_evidence.report_id;

  v_new_report_status := case when p_approved then 'Resolved' else 'In Progress' end;
  v_assignment_status := case when p_approved then 'Completed' else 'Accepted' end;
  v_review_note := coalesce(nullif(p_review_note, ''), case when p_approved then 'Resolution evidence approved.' else 'Resolution evidence needs more work.' end);

  update public.resolution_evidence
  set
    review_status = case when p_approved then 'Approved' else 'Rejected' end,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = coalesce(p_review_note, '')
  where id = p_evidence_id;

  update public.report_assignments
  set
    status = v_assignment_status,
    updated_at = now()
  where id = v_evidence.assignment_id;

  update public.reports
  set status = v_new_report_status
  where id = v_evidence.report_id;

  v_actor_name := public.assignment_actor_name(auth.uid());

  insert into public.report_updates (
    report_id,
    status,
    note,
    updated_by,
    updated_by_name
  )
  values (
    v_evidence.report_id,
    v_new_report_status,
    v_review_note,
    auth.uid(),
    v_actor_name
  );

  if not p_approved then
    perform public.notify_organization_members(
      v_assignment.organization_id,
      'Resolution Rejected',
      'Resolution evidence needs more work',
      'Report ' || coalesce(v_report.tracking_code, '') || ' needs more work after admin review. ' || v_review_note,
      v_evidence.report_id,
      v_evidence.assignment_id,
      'Your Make Kenya Clean resolution needs more work',
      true
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'evidence_id', p_evidence_id,
    'report_id', v_evidence.report_id,
    'status', v_new_report_status
  );
end;
$$;

create or replace function public.create_workflow_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports%rowtype;
  v_assignment public.report_assignments%rowtype;
  v_organization public.organizations%rowtype;
begin
  select * into v_report
  from public.reports
  where id = new.report_id;

  if not found then
    return new;
  end if;

  if new.status = 'Verified' then
    perform public.notify_admins(
      'Report Verified',
      'Report verified and ready for assignment',
      'A Maji Champion verified report ' || coalesce(v_report.tracking_code, '') || '. Assign it to a response organization.',
      new.report_id,
      null,
      '',
      false
    );
  elsif new.status = 'Assigned' then
    select * into v_assignment
    from public.report_assignments
    where report_id = new.report_id
      and status in ('Assigned', 'Accepted')
    order by assigned_at desc
    limit 1;

    select * into v_organization
    from public.organizations
    where id = v_assignment.organization_id;

    perform public.notify_organization_members(
      v_assignment.organization_id,
      'Report Assigned',
      'New report assigned to your organization',
      'Report ' || coalesce(v_report.tracking_code, '') || ' has been assigned to ' || coalesce(v_organization.name, 'your organization') || '.',
      new.report_id,
      v_assignment.id,
      'New Make Kenya Clean report assigned to your organization',
      true
    );
  elsif new.status = 'Resolution Submitted' then
    select * into v_assignment
    from public.report_assignments
    where report_id = new.report_id
    order by updated_at desc
    limit 1;

    perform public.notify_admins(
      'Resolution Submitted',
      'Resolution evidence is ready for review',
      'A response organization submitted resolution evidence for report ' || coalesce(v_report.tracking_code, '') || '.',
      new.report_id,
      v_assignment.id,
      'Resolution evidence is ready for review',
      true
    );
  elsif new.status = 'Resolved' then
    select * into v_assignment
    from public.report_assignments
    where report_id = new.report_id
    order by updated_at desc
    limit 1;

    perform public.notify_organization_members(
      v_assignment.organization_id,
      'Resolution Approved',
      'Resolution evidence approved',
      'Report ' || coalesce(v_report.tracking_code, '') || ' has been marked Resolved after admin review.',
      new.report_id,
      v_assignment.id,
      'Your Make Kenya Clean resolution was approved',
      true
    );
  elsif new.status = 'Community Feedback Submitted' then
    perform public.notify_admins(
      'Community Feedback Submitted',
      'Community feedback requires review',
      'Community feedback was submitted for report ' || coalesce(v_report.tracking_code, '') || '. Review it before changing the report status.',
      new.report_id,
      null,
      'Community feedback requires review',
      true
    );
  elsif new.status = 'In Progress' and lower(coalesce(new.note, '')) like '%dispute%' then
    select * into v_assignment
    from public.report_assignments
    where report_id = new.report_id
    order by updated_at desc
    limit 1;

    perform public.notify_organization_members(
      v_assignment.organization_id,
      'Report Reopened',
      'A resolved case has been reopened',
      coalesce(new.note, 'Report ' || coalesce(v_report.tracking_code, '') || ' requires follow-up.'),
      new.report_id,
      v_assignment.id,
      'A resolved case has been reopened',
      true
    );
  end if;

  return new;
end;
$$;

do $$
declare
  v_evidence record;
  v_message text;
begin
  for v_evidence in
    select
      evidence.id,
      evidence.report_id,
      evidence.assignment_id,
      evidence.reviewed_at,
      evidence.review_note,
      assignment.organization_id,
      report.tracking_code
    from public.resolution_evidence evidence
    join public.report_assignments assignment
      on assignment.id = evidence.assignment_id
    join public.reports report
      on report.id = evidence.report_id
    where evidence.review_status = 'Rejected'
      and evidence.reviewed_at is not null
      and not exists (
        select 1
        from public.notifications notification
        where notification.type = 'Resolution Rejected'
          and notification.related_report_id = evidence.report_id
          and notification.related_assignment_id = evidence.assignment_id
          and notification.created_at between evidence.reviewed_at - interval '5 minutes'
            and evidence.reviewed_at + interval '5 minutes'
      )
  loop
    v_message :=
      'Report ' || coalesce(v_evidence.tracking_code, '') ||
      ' needs more work after admin review. ' ||
      coalesce(nullif(v_evidence.review_note, ''), 'Resolution evidence needs more work.');

    perform public.notify_organization_members(
      v_evidence.organization_id,
      'Resolution Rejected',
      'Resolution evidence needs more work',
      v_message,
      v_evidence.report_id,
      v_evidence.assignment_id,
      'Your Make Kenya Clean resolution needs more work',
      true
    );
  end loop;
end $$;

revoke execute on function public.create_workflow_notifications() from public, anon, authenticated;
revoke execute on function public.review_resolution_evidence(bigint, boolean, text) from public, anon;
grant execute on function public.review_resolution_evidence(bigint, boolean, text) to authenticated;
