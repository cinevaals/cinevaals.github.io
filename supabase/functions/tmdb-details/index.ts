// Supabase Edge Function: tmdb-details
// Configure TMDB_API_KEY as a Supabase Function secret before deploying.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TMDB_API_KEY");
    if (!apiKey) throw new Error("TMDB_API_KEY não configurada no Supabase.");

    const body = await req.json();
    const title = String(body?.title ?? "").trim();
    const category = String(body?.category ?? "").trim();
    if (!title) return Response.json({ error: "Informe um título." }, { status: 400, headers: corsHeaders });

    const preferredType = category === "Filme" ? "movie" : "tv";
    const headers = { Authorization: `Bearer ${apiKey}`, accept: "application/json" };
    const search = async (type: string) => {
      const url = new URL(`https://api.themoviedb.org/3/search/${type}`);
      url.searchParams.set("query", title);
      url.searchParams.set("language", "pt-BR");
      url.searchParams.set("include_adult", "false");
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`Falha na busca TMDB (${response.status}).`);
      const json = await response.json();
      return Array.isArray(json.results) ? json.results : [];
    };

    let type = preferredType;
    let results = await search(type);
    if (!results.length) {
      type = type === "movie" ? "tv" : "movie";
      results = await search(type);
    }
    if (!results.length) {
      return Response.json({ error: "Título não encontrado no TMDB." }, { status: 404, headers: corsHeaders });
    }

    const normalized = (value: string) => value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const best = results.find((item: any) => normalized(item.title || item.name || "") === normalized(title)) || results[0];
    const detailsUrl = new URL(`https://api.themoviedb.org/3/${type}/${best.id}`);
    detailsUrl.searchParams.set("language", "pt-BR");
    detailsUrl.searchParams.set("append_to_response", "credits");
    const detailResponse = await fetch(detailsUrl, { headers });
    if (!detailResponse.ok) throw new Error(`Falha ao carregar detalhes TMDB (${detailResponse.status}).`);
    const details = await detailResponse.json();

    return Response.json({ details, media_type: type }, {
      headers: { ...corsHeaders, "Cache-Control": "public, max-age=900" },
    });
  } catch (error) {
    console.error("tmdb-details:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Erro interno." }, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
