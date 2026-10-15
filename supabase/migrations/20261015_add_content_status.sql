-- CineVaals: adiciona status ao catálogo sem alterar os conteúdos existentes.
-- Execute uma única vez no Supabase SQL Editor.

alter table public.contents
  add column if not exists status text not null default 'PARA ASSISTIR';

alter table public.contents
  drop constraint if exists contents_status_check;

alter table public.contents
  add constraint contents_status_check
  check (status in ('ASSISTIDO', 'PARA ASSISTIR'));

update public.contents
set status = 'PARA ASSISTIR'
where status is null;
