-- GPT STORE support handle: @subrfmanager → @subs_support

update public.sites
set
  support_telegram = '@subs_support',
  updated_at = now()
where slug = 'gpt-store'
  and support_telegram is distinct from '@subs_support';

update public.site_settings
set value = '"https://t.me/subs_support"'::jsonb
where key = 'operator_telegram_url'
  and value::text like '%subrfmanager%';
