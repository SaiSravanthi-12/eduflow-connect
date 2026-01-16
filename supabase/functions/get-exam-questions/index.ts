import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExamQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: number;
  type: 'mcq' | 'coding';
  language?: string;
  starterCode?: string;
}

interface SanitizedMCQQuestion {
  id: string;
  question: string;
  options: string[];
  type: 'mcq';
}

interface SanitizedCodingQuestion {
  id: string;
  question: string;
  type: 'coding';
  language?: string;
  starterCode?: string;
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

    // Create Supabase client with service role to access questions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create client with user auth for verification
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

    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: 'Missing courseId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch exam with correct answers from database
    const { data: exam, error: examError } = await supabaseAdmin
      .from('final_exams')
      .select('id, mcq_questions, coding_questions, passing_score, time_limit_minutes, total_marks')
      .eq('course_id', courseId)
      .maybeSingle();

    if (examError) {
      console.error('Error fetching exam:', examError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch exam' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!exam) {
      return new Response(
        JSON.stringify({ error: 'Exam not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strip correct answers from MCQ questions before sending to client
    const mcqQuestions = (exam.mcq_questions || []) as ExamQuestion[];
    const codingQuestions = (exam.coding_questions || []) as ExamQuestion[];

    const sanitizedMCQs: SanitizedMCQQuestion[] = mcqQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options || [],
      type: 'mcq' as const,
      // correctAnswer is NOT included
    }));

    const sanitizedCoding: SanitizedCodingQuestion[] = codingQuestions.map(q => ({
      id: q.id,
      question: q.question,
      type: 'coding' as const,
      language: q.language,
      starterCode: q.starterCode,
      // No correct answers for coding questions either
    }));

    return new Response(
      JSON.stringify({ 
        examId: exam.id,
        mcqQuestions: sanitizedMCQs,
        codingQuestions: sanitizedCoding,
        passingScore: exam.passing_score || 60,
        timeLimit: exam.time_limit_minutes || 120,
        totalMarks: exam.total_marks || 100
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in get-exam-questions function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
