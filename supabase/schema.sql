-- Voer dit uit in de SQL editor van Supabase (Database > SQL Editor > New query).
-- Draaide je een eerdere versie? Dit script is veilig om opnieuw uit te voeren.

-- 1. Gedeelde gegevens van het huishouden
create table if not exists huis_data (
  sleutel text primary key,
  waarde jsonb not null,
  bijgewerkt timestamptz default now()
);

-- 2. Prive gegevens, per account
create table if not exists prive_data (
  gebruiker uuid not null references auth.users(id) on delete cascade,
  sleutel text not null,
  waarde jsonb not null,
  bijgewerkt timestamptz default now(),
  primary key (gebruiker, sleutel)
);

-- 3. Toestellen die meldingen ontvangen
create table if not exists abonnementen (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  persoon text,
  gebruiker uuid references auth.users(id) on delete cascade,
  aangemaakt timestamptz default now()
);
alter table abonnementen add column if not exists gebruiker uuid references auth.users(id) on delete cascade;

-- 4. Logboek zodat dezelfde melding niet twee keer komt
create table if not exists verzonden (
  id bigserial primary key,
  kenmerk text unique not null,
  moment timestamptz default now()
);

-- 5. Toegang: alleen ingelogde bewoners.
alter table huis_data enable row level security;
alter table prive_data enable row level security;
alter table abonnementen enable row level security;

-- oude, open regels uit de vorige versie opruimen
drop policy if exists "huis lezen" on huis_data;
drop policy if exists "huis schrijven" on huis_data;
drop policy if exists "huis bijwerken" on huis_data;
drop policy if exists "abo schrijven" on abonnementen;
drop policy if exists "abo bijwerken" on abonnementen;

create policy "bewoners lezen" on huis_data
  for select to authenticated using (true);
create policy "bewoners toevoegen" on huis_data
  for insert to authenticated with check (true);
create policy "bewoners bijwerken" on huis_data
  for update to authenticated using (true);

-- prive gegevens zijn alleen voor het eigen account
create policy "eigen prive lezen" on prive_data
  for select to authenticated using (auth.uid() = gebruiker);
create policy "eigen prive schrijven" on prive_data
  for insert to authenticated with check (auth.uid() = gebruiker);
create policy "eigen prive bijwerken" on prive_data
  for update to authenticated using (auth.uid() = gebruiker);

create policy "eigen toestel aanmelden" on abonnementen
  for insert to authenticated with check (auth.uid() = gebruiker);
create policy "eigen toestel bijwerken" on abonnementen
  for update to authenticated using (auth.uid() = gebruiker);
create policy "eigen toestel lezen" on abonnementen
  for select to authenticated using (auth.uid() = gebruiker);

-- Live synchronisatie tussen jullie telefoons
alter publication supabase_realtime add table huis_data;

-- 6. Elke 5 minuten controleren of er een melding moet uitgaan.
--    Vervang alleen nog JOUW_SERVICE_ROLE_KEY hieronder (Project Settings > API Keys > service_role).
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('huis-herinneringen') where exists (
  select 1 from cron.job where jobname = 'huis-herinneringen'
);

select cron.schedule(
  'huis-herinneringen',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://pprrkmbvzklxhydejrby.supabase.co/functions/v1/herinneringen',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer JOUW_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
