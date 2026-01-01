export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      course_materials: {
        Row: {
          course_id: string
          created_at: string
          file_path: string | null
          file_url: string
          id: string
          material_type: string
          module_id: string
          name: string
          topic_id: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          file_path?: string | null
          file_url: string
          id?: string
          material_type: string
          module_id: string
          name: string
          topic_id: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          file_path?: string | null
          file_url?: string
          id?: string
          material_type?: string
          module_id?: string
          name?: string
          topic_id?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          auto_submitted: boolean
          coding_answers: Json
          completed_at: string | null
          course_id: string
          created_at: string
          exam_id: string | null
          id: string
          mcq_answers: Json
          passed: boolean | null
          proctoring_violations: Json
          score: number | null
          started_at: string | null
          status: string
          total_marks: number
          user_id: string
          violation_count: number
          webcam_enabled: boolean
        }
        Insert: {
          auto_submitted?: boolean
          coding_answers?: Json
          completed_at?: string | null
          course_id: string
          created_at?: string
          exam_id?: string | null
          id?: string
          mcq_answers?: Json
          passed?: boolean | null
          proctoring_violations?: Json
          score?: number | null
          started_at?: string | null
          status?: string
          total_marks?: number
          user_id: string
          violation_count?: number
          webcam_enabled?: boolean
        }
        Update: {
          auto_submitted?: boolean
          coding_answers?: Json
          completed_at?: string | null
          course_id?: string
          created_at?: string
          exam_id?: string | null
          id?: string
          mcq_answers?: Json
          passed?: boolean | null
          proctoring_violations?: Json
          score?: number | null
          started_at?: string | null
          status?: string
          total_marks?: number
          user_id?: string
          violation_count?: number
          webcam_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "final_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      final_exams: {
        Row: {
          coding_questions: Json
          course_id: string
          created_at: string
          id: string
          mcq_questions: Json
          passing_score: number
          time_limit_minutes: number
          total_marks: number
          updated_at: string
        }
        Insert: {
          coding_questions?: Json
          course_id: string
          created_at?: string
          id?: string
          mcq_questions?: Json
          passing_score?: number
          time_limit_minutes?: number
          total_marks?: number
          updated_at?: string
        }
        Update: {
          coding_questions?: Json
          course_id?: string
          created_at?: string
          id?: string
          mcq_questions?: Json
          passing_score?: number
          time_limit_minutes?: number
          total_marks?: number
          updated_at?: string
        }
        Relationships: []
      }
      module_quizzes: {
        Row: {
          course_id: string
          created_at: string
          id: string
          module_id: string
          passing_score: number
          questions: Json
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          module_id: string
          passing_score?: number
          questions?: Json
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          module_id?: string
          passing_score?: number
          questions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          module_id: string
          passed: boolean
          quiz_id: string | null
          score: number
          started_at: string
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          module_id: string
          passed?: boolean
          quiz_id?: string | null
          score?: number
          started_at?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          module_id?: string
          passed?: boolean
          quiz_id?: string | null
          score?: number
          started_at?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "module_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          current_module_id: string | null
          current_topic_id: string | null
          exam_passed: boolean | null
          exam_score: number | null
          exam_unlocked: boolean
          id: string
          modules_completed: number
          total_modules: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          current_module_id?: string | null
          current_topic_id?: string | null
          exam_passed?: boolean | null
          exam_score?: number | null
          exam_unlocked?: boolean
          id?: string
          modules_completed?: number
          total_modules?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          current_module_id?: string | null
          current_topic_id?: string | null
          exam_passed?: boolean | null
          exam_score?: number | null
          exam_unlocked?: boolean
          id?: string
          modules_completed?: number
          total_modules?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_module_progress: {
        Row: {
          course_id: string
          created_at: string
          id: string
          module_id: string
          quiz_completed_at: string | null
          quiz_passed: boolean
          quiz_score: number | null
          quiz_unlocked: boolean
          total_videos: number
          updated_at: string
          user_id: string
          videos_completed: number
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          module_id: string
          quiz_completed_at?: string | null
          quiz_passed?: boolean
          quiz_score?: number | null
          quiz_unlocked?: boolean
          total_videos?: number
          updated_at?: string
          user_id: string
          videos_completed?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          module_id?: string
          quiz_completed_at?: string | null
          quiz_passed?: boolean
          quiz_score?: number | null
          quiz_unlocked?: boolean
          total_videos?: number
          updated_at?: string
          user_id?: string
          videos_completed?: number
        }
        Relationships: []
      }
      student_video_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          material_id: string | null
          module_id: string
          topic_id: string
          total_duration_seconds: number
          updated_at: string
          user_id: string
          watch_time_seconds: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          material_id?: string | null
          module_id: string
          topic_id: string
          total_duration_seconds?: number
          updated_at?: string
          user_id: string
          watch_time_seconds?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          material_id?: string | null
          module_id?: string
          topic_id?: string
          total_duration_seconds?: number
          updated_at?: string
          user_id?: string
          watch_time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_video_progress_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "course_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
    },
  },
} as const
