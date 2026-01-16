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

    const { 
      courseId, 
      mcqAnswers, 
      codingAnswers, 
      violations, 
      violationCount, 
      isWebcamEnabled,
      autoSubmit,
      startedAt
    } = await req.json();

    // Validate input
    if (!courseId) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Required: courseId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch exam with correct answers from database (server-side only)
    const { data: exam, error: examError } = await supabaseAdmin
      .from('final_exams')
      .select('id, mcq_questions, coding_questions, passing_score, total_marks')
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

    const mcqQuestions = (exam.mcq_questions || []) as ExamQuestion[];
    const codingQuestions = (exam.coding_questions || []) as ExamQuestion[];
    const passingScore = exam.passing_score || 60;
    const totalMarks = exam.total_marks || 100;

    // Grade MCQs on the server
    let correctMCQ = 0;
    mcqQuestions.forEach(q => {
      if (mcqAnswers && mcqAnswers[q.id] === q.correctAnswer) {
        correctMCQ++;
      }
    });

    // Calculate score - MCQ is 70% of total, coding is 30%
    const mcqWeight = 70;
    const codingWeight = 30;
    
    const mcqScore = mcqQuestions.length > 0 
      ? Math.round((correctMCQ / mcqQuestions.length) * mcqWeight) 
      : 0;
    
    // For coding, give full marks if all questions answered (simplified grading)
    const codingAnswerCount = codingAnswers ? Object.keys(codingAnswers).filter(k => codingAnswers[k]?.trim()).length : 0;
    const codingScore = codingQuestions.length > 0 && codingAnswerCount === codingQuestions.length 
      ? codingWeight 
      : 0;

    const totalScore = mcqScore + codingScore;
    const passed = totalScore >= passingScore;

    // Save exam attempt
    const { error: insertError } = await supabaseAdmin
      .from('exam_attempts')
      .insert([{
        user_id: userId,
        exam_id: exam.id,
        course_id: courseId,
        mcq_answers: mcqAnswers || {},
        coding_answers: codingAnswers || {},
        score: totalScore,
        total_marks: totalMarks,
        passed: passed,
        proctoring_violations: violations || [],
        violation_count: violationCount || 0,
        webcam_enabled: isWebcamEnabled || false,
        status: 'completed',
        started_at: startedAt || new Date().toISOString(),
        completed_at: new Date().toISOString(),
        auto_submitted: autoSubmit || false,
      }]);

    if (insertError) {
      console.error('Error saving exam attempt:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save exam attempt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update course progress if passed
    if (passed) {
      await supabaseAdmin
        .from('student_course_progress')
        .upsert([{
          user_id: userId,
          course_id: courseId,
          exam_passed: true,
          exam_score: totalScore,
          completed_at: new Date().toISOString(),
        }], {
          onConflict: 'user_id,course_id'
        });
    }

    return new Response(
      JSON.stringify({ 
        score: totalScore, 
        passed, 
        mcqCorrect: correctMCQ,
        mcqTotal: mcqQuestions.length,
        codingAnswered: codingAnswerCount,
        codingTotal: codingQuestions.length,
        passingScore 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in grade-exam function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
