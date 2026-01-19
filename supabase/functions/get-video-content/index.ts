import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const materialId = url.searchParams.get("materialId");
    const languageCode = url.searchParams.get("lang") || "en";

    if (!materialId) {
      return new Response(
        JSON.stringify({ error: "materialId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch base material info
    const { data: material, error: materialError } = await supabase
      .from("course_materials")
      .select("*")
      .eq("id", materialId)
      .single();

    if (materialError || !material) {
      return new Response(
        JSON.stringify({ error: "Material not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch localized metadata for the requested language
    const { data: localizedMeta } = await supabase
      .from("video_language_metadata")
      .select("*")
      .eq("material_id", materialId)
      .eq("language_code", languageCode)
      .maybeSingle();

    // Fallback to English if localized metadata not found
    let metadata = localizedMeta;
    if (!metadata && languageCode !== "en") {
      const { data: englishMeta } = await supabase
        .from("video_language_metadata")
        .select("*")
        .eq("material_id", materialId)
        .eq("language_code", "en")
        .maybeSingle();
      metadata = englishMeta;
    }

    // Fetch all available subtitles
    const { data: subtitles } = await supabase
      .from("video_subtitles")
      .select("*")
      .eq("material_id", materialId)
      .order("language_code");

    // Fetch subtitle for requested language (for backward compatibility)
    const requestedSubtitle = subtitles?.find(s => s.language_code === languageCode);
    const defaultSubtitle = subtitles?.find(s => s.is_default);

    // Build response
    const response = {
      id: material.id,
      video_url: material.file_url,
      title: metadata?.title || material.name,
      description: metadata?.description || null,
      language_code: languageCode,
      subtitle_url: requestedSubtitle?.subtitle_url || defaultSubtitle?.subtitle_url || null,
      available_subtitles: subtitles?.map(s => ({
        id: s.id,
        language_code: s.language_code,
        language_name: s.language_name,
        url: s.subtitle_url,
        is_default: s.is_default,
      })) || [],
      course_id: material.course_id,
      module_id: material.module_id,
      topic_id: material.topic_id,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-video-content:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
