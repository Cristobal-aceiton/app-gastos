-- Ejecutar en el SQL Editor de Supabase.
-- Fuente: claude.md, sección 5 (Estructura de Base de Datos).

-- Usuarios (extiende auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  name text,
  purpose text,
  income_type text check (income_type in ('fixed', 'variable')),
  fixed_salary numeric default 0,
  is_premium boolean default false,
  premium_since date,
  created_at timestamp with time zone default now()
);

-- Transacciones
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text check (type in ('income', 'expense')),
  category text not null,
  amount numeric not null,
  description text,
  date date not null,
  created_at timestamp with time zone default now()
);

-- Categorías personalizadas (opcional)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

-- Suscripciones (Premium)
-- Nota: 'category' guarda el id/slug de src/lib/categories.ts (ej. 'servicios'), igual que transactions.category.
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  billing_day int not null,
  category text default 'servicios',
  active boolean default true
);

-- Metas de ahorro (Premium)
create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  saved_amount numeric default 0,
  deadline date not null,
  created_at timestamp with time zone default now()
);

-- Límites por categoría (Premium)
create table if not exists category_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category text not null,
  limit_amount numeric not null,
  month_year date not null
);

-- Trigger: crear fila en profiles automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: cada usuario solo ve y modifica sus propios datos
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table categories enable row level security;
alter table subscriptions enable row level security;
alter table savings_goals enable row level security;
alter table category_limits enable row level security;

drop policy if exists "profiles: solo el dueño" on profiles;
create policy "profiles: solo el dueño" on profiles for all using (auth.uid() = id);

drop policy if exists "transactions: solo el dueño" on transactions;
create policy "transactions: solo el dueño" on transactions for all using (auth.uid() = user_id);

drop policy if exists "categories: solo el dueño" on categories;
create policy "categories: solo el dueño" on categories for all using (auth.uid() = user_id);

drop policy if exists "subscriptions: solo el dueño" on subscriptions;
create policy "subscriptions: solo el dueño" on subscriptions for all using (auth.uid() = user_id);

drop policy if exists "savings_goals: solo el dueño" on savings_goals;
create policy "savings_goals: solo el dueño" on savings_goals for all using (auth.uid() = user_id);

drop policy if exists "category_limits: solo el dueño" on category_limits;
create policy "category_limits: solo el dueño" on category_limits for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- Fase 6: funcionalidades Premium (metas, límites, suscripciones)
-- ─────────────────────────────────────────────────────────────────
-- Un límite por categoría y mes: permite hacer upsert (crear o actualizar) desde la app
-- en lugar de tener que buscar primero si ya existe una fila para ese mes.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'category_limits_user_category_month_key'
  ) then
    alter table category_limits
      add constraint category_limits_user_category_month_key unique (user_id, category, month_year);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────
-- Fase 8: perfil, configuración y categorías personalizadas
-- ─────────────────────────────────────────────────────────────────
-- Nota de diseño: las 8 categorías "default" (Comida, Transporte, etc.) viven
-- hardcodeadas en src/lib/categories.ts, no en esta tabla — así se garantiza
-- que su ícono/color coincida siempre con el resto de la UI y no dependen de
-- que cada usuario tenga filas sembradas en Supabase. La tabla `categories`
-- se usa solo para las categorías personalizadas de cada usuario
-- (is_default queda en FALSE para todas las filas reales que se insertan).
-- La política RLS existente ("categories: solo el dueño") ya es correcta
-- para este uso: cada usuario solo ve/crea/borra sus propias categorías.

-- Asegura created_at en instalaciones que ya tenían la tabla de la Fase 0.
alter table categories add column if not exists created_at timestamp with time zone default now();

-- ─────────────────────────────────────────────────────────────────
-- Fase 9: integración de pagos (Stripe) para Premium
-- ─────────────────────────────────────────────────────────────────
-- Estas columnas quedan NULL mientras is_premium se activa por el flujo mock
-- (MockPaymentModal, ver src/lib/payments.ts). Cuando la Edge Function
-- `create-checkout-session` cree una suscripción real y el webhook
-- `stripe-webhook` la confirme, ahí se llenan — así se puede distinguir una
-- activación mock de una activación real, y el webhook sabe qué perfil
-- actualizar cuando llegue un evento de renovación o cancelación.
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;
alter table profiles add column if not exists stripe_last_payment_id text;

-- ─────────────────────────────────────────────────────────────────
-- Fase 11: seguridad de Premium — bloquea que el cliente autenticado
-- escriba directamente el estado de la suscripción.
-- ─────────────────────────────────────────────────────────────────
-- Hasta la Fase 9, cualquier usuario logueado podía abrir la consola del
-- navegador y ejecutar:
--   supabase.from('profiles').update({ is_premium: true }).eq('id', miId)
-- ...y activarse Premium gratis, porque la política RLS de "profiles" solo
-- exige que la fila sea la suya (auth.uid() = id), no que ciertos campos
-- queden fuera de su alcance. RLS de Postgres es a nivel de FILA, no de
-- columna, así que la forma de bloquear columnas puntuales es con un
-- trigger BEFORE UPDATE que compare NEW vs OLD y rechace el cambio si
-- quien ejecuta la consulta no es el service_role (el rol que usan las
-- Edge Functions con la Service Role Key, que sí puede tocar estos campos).
create or replace function public.protect_premium_columns()
returns trigger as $$
begin
  if auth.role() <> 'service_role' then
    if new.is_premium is distinct from old.is_premium
      or new.premium_since is distinct from old.premium_since
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
      or new.stripe_last_payment_id is distinct from old.stripe_last_payment_id
    then
      raise exception 'No autorizado: is_premium y los campos de Stripe solo puede modificarlos el backend (Edge Functions).';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_premium_columns_trigger on profiles;
create trigger protect_premium_columns_trigger
  before update on profiles
  for each row execute procedure public.protect_premium_columns();

-- Nota: esto NO afecta el trigger de creación de perfil (handle_new_user,
-- más arriba) porque ese es un INSERT, no un UPDATE — este trigger solo
-- corre en updates. Tampoco afecta el resto de columnas de "profiles"
-- (name, purpose, income_type, fixed_salary), que el cliente sigue
-- pudiendo actualizar libremente desde Settings.tsx y Onboarding.tsx.

-- ─────────────────────────────────────────────────────────────────
-- Fase 13.1-13.3: notificaciones push (Web Push API)
-- ─────────────────────────────────────────────────────────────────

-- Una fila por dispositivo/navegador suscrito. Un mismo usuario puede tener
-- varias (celular + notebook, por ejemplo) — por eso no es 1:1 con profiles.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamp with time zone default now()
);

alter table push_subscriptions enable row level security;

drop policy if exists "push_subscriptions: solo el dueño" on push_subscriptions;
create policy "push_subscriptions: solo el dueño" on push_subscriptions for all using (auth.uid() = user_id);

-- Preferencias de notificación (13.3): una fila por usuario, se crea con
-- valores por defecto (todo activado) la primera vez que el cliente guarda
-- algo, vía upsert desde src/hooks/useNotificationPrefs.ts.
create table if not exists notification_prefs (
  user_id uuid references auth.users(id) on delete cascade primary key,
  subscriptions_reminder boolean not null default true,
  category_limit_alert boolean not null default true,
  savings_goal_reminder boolean not null default true,
  updated_at timestamp with time zone default now()
);

alter table notification_prefs enable row level security;

drop policy if exists "notification_prefs: solo el dueño" on notification_prefs;
create policy "notification_prefs: solo el dueño" on notification_prefs for all using (auth.uid() = user_id);

-- Registro de notificaciones ya enviadas, para que el cron diario
-- (supabase/functions/check-notifications) no avise dos veces del mismo
-- evento (ej. la misma suscripción "se cobra en 3 días" no debe repetirse
-- los 3 días seguidos que caen dentro de la ventana de aviso).
-- `period_key` identifica el período que ya se notificó para ese `ref_id`:
-- el mes (YYYY-MM) para suscripciones/límites, o simplemente el id de la
-- meta para el aviso de "meta por vencer" (se avisa una sola vez, no todos
-- los meses). Sin políticas RLS a propósito: solo el service_role (que
-- usa la Edge Function) puede leer/escribir esta tabla; el cliente no
-- necesita ni debe tocarla directamente.
create table if not exists notifications_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  kind text not null check (kind in ('subscription_charge', 'category_limit', 'savings_goal')),
  ref_id text not null,
  period_key text not null,
  sent_at timestamp with time zone default now()
);

alter table notifications_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notifications_log_user_kind_ref_period_key'
  ) then
    alter table notifications_log
      add constraint notifications_log_user_kind_ref_period_key unique (user_id, kind, ref_id, period_key);
  end if;
end $$;

-- Plan de remodelación, Fase 1: logging de errores del cliente.
-- Solo escritura desde el cliente (anon/authenticated pueden insertar,
-- nadie puede leer salvo el service_role) — es telemetría, no algo que la
-- propia app necesite volver a leer. Para ver los errores reportados: Table
-- Editor de Supabase, o una vista de admin más adelante.
create table if not exists client_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source text not null,
  message text not null,
  stack text,
  context jsonb,
  url text,
  user_agent text,
  created_at timestamp with time zone default now()
);

alter table client_errors enable row level security;

create policy "client_errors: cualquiera puede insertar" on client_errors
  for insert
  with check (true);

-- Nota: a propósito NO hay policy de select/update/delete para anon ni
-- authenticated — leer y limpiar esta tabla es tarea de admin (service_role).

-- Plan de remodelación, Fase 1: feature flags / kill switch sin deploy.
-- Cualquiera puede LEER los flags (así el cliente sabe si una función está
-- prendida o apagada); solo el service_role puede escribir — cambiar un
-- flag se hace desde el Table Editor de Supabase, nunca desde el cliente.
create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default true,
  description text,
  updated_at timestamp with time zone default now()
);

alter table feature_flags enable row level security;

create policy "feature_flags: cualquiera puede leer" on feature_flags
  for select
  using (true);

-- Seed de los flags conocidos (ver DEFAULT_FLAGS en src/lib/featureFlags.ts).
-- Si no corrés este seed, la app sigue funcionando igual: el cliente cae a
-- los defaults locales cuando la tabla está vacía.
insert into feature_flags (key, enabled, description) values
  ('subscription_runner', true, 'Cobro automático de suscripciones Premium al abrir la app (Fase 6). Apagar acá si hay un bug de cobros duplicados/incorrectos, sin esperar un deploy.'),
  ('push_notifications', true, 'Notificaciones push (Fase 13.1-13.3).')
on conflict (key) do nothing;
