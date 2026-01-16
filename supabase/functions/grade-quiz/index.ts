import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
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

    // Create Supabase client with service role for grading
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

    const { courseId, moduleId, answers } = await req.json();

    // Validate input
    if (!courseId || !moduleId || !answers || typeof answers !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Required: courseId, moduleId, answers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch quiz with correct answers from database (server-side only)
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('module_quizzes')
      .select('id, questions, passing_score')
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .maybeSingle();

    if (quizError) {
      console.error('Error fetching quiz:', quizError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch quiz' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!quiz || !quiz.questions) {
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const questions = quiz.questions as QuizQuestion[];
    const passingScore = quiz.passing_score || 70;

    // Grade the quiz on the server
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= passingScore;

    // Save quiz attempt
    const { error: insertError } = await supabaseAdmin
      .from('quiz_attempts')
      .insert([{
        user_id: userId,
        quiz_id: quiz.id,
        course_id: courseId,
        module_id: moduleId,
        answers: answers,
        score: score,
        total_questions: questions.length,
        passed: passed,
        completed_at: new Date().toISOString(),
      }]);

    if (insertError) {
      console.error('Error saving quiz attempt:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save quiz attempt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update module progress if passed
    if (passed) {
      await supabaseAdmin
        .from('student_module_progress')
        .upsert([{
          user_id: userId,
          course_id: courseId,
          module_id: moduleId,
          quiz_passed: true,
          quiz_score: score,
          quiz_completed_at: new Date().toISOString(),
        }], {
          onConflict: 'user_id,course_id,module_id'
        });
    }

    return new Response(
      JSON.stringify({ 
        score, 
        passed, 
        correct, 
        total: questions.length,
        passingScore 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in grade-quiz function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
