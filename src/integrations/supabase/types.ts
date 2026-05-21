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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_assignments: {
        Row: {
          admin_name: string
          admin_user_id: string
          admin_username: string | null
          admin_password: string | null
          created_at: string
          cug_number: string | null
          id: string
          location: string
        }
        Insert: {
          admin_name: string
          admin_user_id: string
          admin_username?: string | null
          admin_password?: string | null
          created_at?: string
          cug_number?: string | null
          id?: string
          location: string
        }
        Update: {
          admin_name?: string
          admin_user_id?: string
          admin_username?: string | null
          admin_password?: string | null
          created_at?: string
          cug_number?: string | null
          id?: string
          location?: string
        }
        Relationships: []
      }
      course_assignments: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          progress: number
          status: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          progress?: number
          status?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          progress?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          exam_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          exam_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          exam_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_assignments_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          answers: Json
          exam_id: string
          hrms_id: string
          id: string
          obtained_marks: number
          submitted_at: string
          total_marks: number
          user_id: string
        }
        Insert: {
          answers?: Json
          exam_id: string
          hrms_id: string
          id?: string
          obtained_marks: number
          submitted_at?: string
          total_marks: number
          user_id: string
        }
        Update: {
          answers?: Json
          exam_id?: string
          hrms_id?: string
          id?: string
          obtained_marks?: number
          submitted_at?: string
          total_marks?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedules: {
        Row: {
          admin_name: string
          created_at: string
          created_by: string | null
          end_time: string
          exam_title: string
          id: string
          scheduled_date: string
          start_time: string
          status: string
        }
        Insert: {
          admin_name: string
          created_at?: string
          created_by?: string | null
          end_time: string
          exam_title: string
          id?: string
          scheduled_date: string
          start_time: string
          status?: string
        }
        Update: {
          admin_name?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          exam_title?: string
          id?: string
          scheduled_date?: string
          start_time?: string
          status?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          scheduled_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          scheduled_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          scheduled_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          cug_number: string | null
          designation: string | null
          full_name: string
          hrms_id: string | null
          id: string
          is_active: boolean
          location: string | null
          password: string | null
          username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          cug_number?: string | null
          designation?: string | null
          full_name: string
          hrms_id?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          password?: string | null
          username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          cug_number?: string | null
          designation?: string | null
          full_name?: string
          hrms_id?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          password?: string | null
          username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_option: string
          created_at: string
          exam_id: string
          id: string
          marks: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          sort_order: number
        }
        Insert: {
          correct_option: string
          created_at?: string
          exam_id: string
          id?: string
          marks?: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          sort_order?: number
        }
        Update: {
          correct_option?: string
          created_at?: string
          exam_id?: string
          id?: string
          marks?: number
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      change_account_password: {
        Args: {
          p_current_password: string
          p_new_password: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_username: string
        }
        Returns: boolean
      }
      get_user_location: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
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
      app_role: ["super_admin", "admin", "user"],
    },
  },
} as const
