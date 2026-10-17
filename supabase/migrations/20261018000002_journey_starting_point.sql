-- Let the learner choose a new position in the roadmap at any time.

alter table public.journey_day_completions
  drop constraint journey_day_completions_method_check,
  add constraint journey_day_completions_method_check
    check (method in ('auto', 'manual', 'placement'));

create or replace function public.set_journey_starting_point(
  p_user_id uuid,
  p_completed_through_day int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_next_day int;
begin
  if p_completed_through_day < 1 or p_completed_through_day > 89 then
    raise exception 'Ngày đã hoàn thành phải nằm trong khoảng 1 đến 89';
  end if;

  select * into v_profile
    from public.profiles
   where id = p_user_id
   for update;

  if not found then
    raise exception 'Không tìm thấy hồ sơ %', p_user_id;
  end if;

  -- Later days should no longer appear completed after the learner moves
  -- the roadmap position back to an earlier day.
  delete from public.journey_day_completions
   where user_id = p_user_id and day > p_completed_through_day;

  insert into public.journey_day_completions (user_id, day, method)
  select p_user_id, day, 'placement'
    from generate_series(1, p_completed_through_day) as day
  on conflict (user_id, day) do update
    set method = 'placement', completed_at = now();

  v_next_day := p_completed_through_day + 1;
  update public.profiles
     set current_day = v_next_day,
         journey_completed_at = null
   where id = p_user_id
  returning * into v_profile;

  return jsonb_build_object(
    'advanced', true,
    'current_day', v_profile.current_day,
    'journey_completed', v_profile.journey_completed_at is not null
  );
end;
$$;

revoke all on function public.set_journey_starting_point(uuid, int) from public, anon, authenticated;
grant execute on function public.set_journey_starting_point(uuid, int) to service_role;
