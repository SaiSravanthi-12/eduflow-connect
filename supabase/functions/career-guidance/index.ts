import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TraitScore {
  category: string;
  label: string;
  score: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client and verify user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { results } = await req.json();
    
    // Validate input
    if (!results || !Array.isArray(results) || results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid results data. Expected non-empty array of trait scores.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each result has required fields
    for (const result of results) {
      if (typeof result.label !== 'string' || typeof result.score !== 'number') {
        return new Response(
          JSON.stringify({ error: 'Invalid result format. Each result must have label (string) and score (number).' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const traitsSummary = results
      .map((r: TraitScore) => `${r.label}: ${r.score}%`)
      .join(", ");

    const topTrait = results[0];
    const secondTrait = results[1];

    const systemPrompt = `You are an expert career counselor and psychologist. Based on psychometric test results, provide personalized, actionable career guidance. Be encouraging, specific, and practical. Format your response with clear sections using markdown.`;

    const userPrompt = `A student just completed a psychometric assessment with the following results:

Trait Scores: ${traitsSummary}

Their dominant trait is ${topTrait?.label} (${topTrait?.score}%) and secondary trait is ${secondTrait?.label} (${secondTrait?.score}%).

Please provide personalized career guidance including:
1. **Your Strengths**: A brief analysis of what their trait combination means for their career potential
2. **Recommended Career Paths**: 5-6 specific career suggestions that match their profile, with brief explanations
3. **Skills to Develop**: 3-4 skills they should focus on to enhance their career prospects
4. **Action Steps**: 3-4 concrete next steps they can take right now (courses, certifications, experiences)
5. **Potential Challenges**: 1-2 areas they might want to be mindful of based on their profile

Keep the response focused, practical, and encouraging. Use bullet points where appropriate.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate career guidance");
    }

    const data = await response.json();
    const guidance = data.choices?.[0]?.message?.content || "Unable to generate guidance at this time.";

    return new Response(
      JSON.stringify({ guidance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in career-guidance function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
