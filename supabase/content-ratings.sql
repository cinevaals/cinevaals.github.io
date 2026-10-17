-- CineVaals: avaliações por conteúdo do catálogo
-- Execute este arquivo no SQL Editor do projeto Supabase para ativar as avaliações.
create table if not exists public.content_ratings (
  catalog_id bigint primary key references public.catalog(id) on delete cascade,
  rating numeric(3,1) not null check (rating >= 0.5 and rating <= 10 and rating * 2 = floor(rating * 2)),
  updated_at timestamptz not null default now()
);
alter table public.content_ratings enable row level security;
drop policy if exists "Public can read content ratings" on public.content_ratings;
create policy "Public can read content ratings" on public.content_ratings for select to anon, authenticated using (true);
drop policy if exists "Admins can insert content ratings" on public.content_ratings;
create policy "Admins can insert content ratings" on public.content_ratings for insert to authenticated with check (public.is_cinevaals_admin());
drop policy if exists "Admins can update content ratings" on public.content_ratings;
create policy "Admins can update content ratings" on public.content_ratings for update to authenticated using (public.is_cinevaals_admin()) with check (public.is_cinevaals_admin());
drop policy if exists "Admins can delete content ratings" on public.content_ratings;
create policy "Admins can delete content ratings" on public.content_ratings for delete to authenticated using (public.is_cinevaals_admin());
grant select on public.content_ratings to anon, authenticated;
grant insert, update, delete on public.content_ratings to authenticated;
