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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      domain_emails: {
        Row: {
          created_at: string
          direction: string
          domain: string
          has_attachment: boolean | null
          id: string
          ip_address: string | null
          message_id: string | null
          protocol: string
          recipient: string
          sender: string
          size_bytes: number | null
          spam_score: number | null
          status: string
          subject: string | null
          threat_detected: boolean | null
          threat_type: string | null
        }
        Insert: {
          created_at?: string
          direction?: string
          domain?: string
          has_attachment?: boolean | null
          id?: string
          ip_address?: string | null
          message_id?: string | null
          protocol?: string
          recipient: string
          sender: string
          size_bytes?: number | null
          spam_score?: number | null
          status?: string
          subject?: string | null
          threat_detected?: boolean | null
          threat_type?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          domain?: string
          has_attachment?: boolean | null
          id?: string
          ip_address?: string | null
          message_id?: string | null
          protocol?: string
          recipient?: string
          sender?: string
          size_bytes?: number | null
          spam_score?: number | null
          status?: string
          subject?: string | null
          threat_detected?: boolean | null
          threat_type?: string | null
        }
        Relationships: []
      }
      endpoints: {
        Row: {
          agent_version: string | null
          created_at: string
          hostname: string
          id: string
          ip_address: string
          last_seen: string
          os: string | null
          status: Database["public"]["Enums"]["endpoint_status"]
        }
        Insert: {
          agent_version?: string | null
          created_at?: string
          hostname: string
          id?: string
          ip_address: string
          last_seen?: string
          os?: string | null
          status?: Database["public"]["Enums"]["endpoint_status"]
        }
        Update: {
          agent_version?: string | null
          created_at?: string
          hostname?: string
          id?: string
          ip_address?: string
          last_seen?: string
          os?: string | null
          status?: Database["public"]["Enums"]["endpoint_status"]
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          id: string
          page: string
          user_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          page: string
          user_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          page?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          data: Json | null
          generated_by: string | null
          id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          generated_by?: string | null
          id?: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          generated_by?: string | null
          id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          description: string | null
          id: string
          severity: Database["public"]["Enums"]["severity_level"]
          source_endpoint: string | null
          status: Database["public"]["Enums"]["event_status"]
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          severity?: Database["public"]["Enums"]["severity_level"]
          source_endpoint?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          severity?: Database["public"]["Enums"]["severity_level"]
          source_endpoint?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          type?: string
        }
        Relationships: []
      }
      threat_alerts: {
        Row: {
          description: string | null
          detected_at: string
          id: string
          resolved: boolean
          resolved_at: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          source: string | null
          title: string
        }
        Insert: {
          description?: string | null
          detected_at?: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          source?: string | null
          title: string
        }
        Update: {
          description?: string | null
          detected_at?: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          source?: string | null
          title?: string
        }
        Relationships: []
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
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "analyst" | "viewer"
      endpoint_status: "secure" | "warning" | "critical" | "offline"
      event_status: "open" | "investigating" | "resolved" | "dismissed"
      severity_level: "critical" | "high" | "medium" | "low"
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
      app_role: ["admin", "analyst", "viewer"],
      endpoint_status: ["secure", "warning", "critical", "offline"],
      event_status: ["open", "investigating", "resolved", "dismissed"],
      severity_level: ["critical", "high", "medium", "low"],
    },
  },
} as const
