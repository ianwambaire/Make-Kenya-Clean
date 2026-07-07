-- Tighten RPC execute grants after the operations deployment.
--
-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. The
-- functions already enforce auth and role checks internally; these grants
-- reduce the exposed RPC surface so only intended roles can invoke them.

revoke execute on function public.reject_access_request(text) from public, anon;
grant execute on function public.reject_access_request(text) to authenticated;

revoke execute on function public.assign_report_to_organization(bigint, uuid, text) from public, anon;
grant execute on function public.assign_report_to_organization(bigint, uuid, text) to authenticated;

revoke execute on function public.accept_report_assignment(bigint) from public, anon;
grant execute on function public.accept_report_assignment(bigint) to authenticated;

revoke execute on function public.add_report_action(bigint, text, text, text) from public, anon;
grant execute on function public.add_report_action(bigint, text, text, text) to authenticated;

revoke execute on function public.submit_resolution_evidence(bigint, text, text, date) from public, anon;
grant execute on function public.submit_resolution_evidence(bigint, text, text, date) to authenticated;

revoke execute on function public.review_resolution_evidence(bigint, boolean, text) from public, anon;
grant execute on function public.review_resolution_evidence(bigint, boolean, text) to authenticated;

revoke execute on function public.review_community_confirmation(bigint, text, text) from public, anon;
grant execute on function public.review_community_confirmation(bigint, text, text) to authenticated;

revoke execute on function public.can_write_resolution_evidence_object(text) from public, anon;
grant execute on function public.can_write_resolution_evidence_object(text) to authenticated;

revoke execute on function public.can_read_resolution_evidence_object(text) from public, anon;
grant execute on function public.can_read_resolution_evidence_object(text) to authenticated;

revoke execute on function public.submit_community_confirmation(text, text, text) from public;
grant execute on function public.submit_community_confirmation(text, text, text) to anon, authenticated;
