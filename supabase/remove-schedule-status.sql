-- CineVaals: remover o status "Está no Cronograma" do catálogo
-- Títulos que usam esse status serão movidos para "Está na Fila".

update public.catalog
set status = 'Está na Fila'
where status = 'Está no Cronograma';

alter table public.catalog
  drop constraint if exists catalog_status_check;

alter table public.catalog
  add constraint catalog_status_check
  check (status in ('Já Assistido', 'Assistindo', 'Está na Fila'));
