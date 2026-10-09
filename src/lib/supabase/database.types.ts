export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_id: string;
          created_at: string;
          metadata: Json;
          unlocked_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          created_at?: string;
          metadata?: Json;
          unlocked_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          created_at?: string;
          metadata?: Json;
          unlocked_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      challenge_scores: {
        Row: {
          active_run_id: string | null;
          attempts: number;
          best_score: number;
          best_time_ms: number | null;
          challenge_id: string;
          completed_at: string | null;
          created_at: string;
          difficulty: string;
          discovered_secrets: string[];
          duration_ms: number;
          ending: string | null;
          fewest_moves: number | null;
          last_finished_run_id: string | null;
          last_played_at: string | null;
          last_result: string | null;
          latest_score: number;
          losses: number;
          progress: number;
          started_at: string | null;
          unlocked_rewards: string[];
          updated_at: string;
          user_id: string;
          wins: number;
        };
        Insert: {
          active_run_id?: string | null;
          attempts?: number;
          best_score?: number;
          best_time_ms?: number | null;
          challenge_id: string;
          completed_at?: string | null;
          created_at?: string;
          difficulty?: string;
          discovered_secrets?: string[];
          duration_ms?: number;
          ending?: string | null;
          fewest_moves?: number | null;
          last_finished_run_id?: string | null;
          last_played_at?: string | null;
          last_result?: string | null;
          latest_score?: number;
          losses?: number;
          progress?: number;
          started_at?: string | null;
          unlocked_rewards?: string[];
          updated_at?: string;
          user_id: string;
          wins?: number;
        };
        Update: {
          active_run_id?: string | null;
          attempts?: number;
          best_score?: number;
          best_time_ms?: number | null;
          challenge_id?: string;
          completed_at?: string | null;
          created_at?: string;
          difficulty?: string;
          discovered_secrets?: string[];
          duration_ms?: number;
          ending?: string | null;
          fewest_moves?: number | null;
          last_finished_run_id?: string | null;
          last_played_at?: string | null;
          last_result?: string | null;
          latest_score?: number;
          losses?: number;
          progress?: number;
          started_at?: string | null;
          unlocked_rewards?: string[];
          updated_at?: string;
          user_id?: string;
          wins?: number;
        };
        Relationships: [];
      };
      coupon_state: {
        Row: {
          coupon_id: string;
          created_at: string;
          redeemed_at: string | null;
          unlocked_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          coupon_id: string;
          created_at?: string;
          redeemed_at?: string | null;
          unlocked_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          coupon_id?: string;
          created_at?: string;
          redeemed_at?: string | null;
          unlocked_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      discoveries: {
        Row: {
          created_at: string;
          discovered_at: string;
          discovery_id: string;
          discovery_type: string;
          metadata: Json;
          source: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          discovered_at?: string;
          discovery_id: string;
          discovery_type: string;
          metadata?: Json;
          source: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          discovered_at?: string;
          discovery_id?: string;
          discovery_type?: string;
          metadata?: Json;
          source?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      letter_state: {
        Row: {
          created_at: string;
          letter_slug: string;
          opened_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          letter_slug: string;
          opened_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          letter_slug?: string;
          opened_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          answers: Json;
          completed_at: string | null;
          created_at: string;
          id: string;
          score: number | null;
          started_at: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          answers?: Json;
          completed_at?: string | null;
          created_at?: string;
          id: string;
          score?: number | null;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          answers?: Json;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          score?: number | null;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      site_progress: {
        Row: {
          created_at: string;
          last_visited_at: string | null;
          memories_discovered: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          last_visited_at?: string | null;
          memories_discovered?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          last_visited_at?: string | null;
          memories_discovered?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      grant_experience_coupon: {
        Args: {
          p_user_id: string;
          p_reward_id: string;
          p_coupon_id: string;
          p_source: string;
        };
        Returns: { reward_was_new: boolean }[];
      };
      begin_arcade_run: {
        Args: {
          p_difficulty: string;
          p_game_id: string;
          p_run_id: string;
          p_started_at: string;
          p_user_id: string;
        };
        Returns: {
          active_run_id: string | null;
          attempts: number;
          best_score: number;
          best_time_ms: number | null;
          challenge_id: string;
          completed_at: string | null;
          created_at: string;
          difficulty: string;
          discovered_secrets: string[];
          duration_ms: number;
          ending: string | null;
          fewest_moves: number | null;
          last_finished_run_id: string | null;
          last_played_at: string | null;
          last_result: string | null;
          latest_score: number;
          losses: number;
          progress: number;
          started_at: string | null;
          unlocked_rewards: string[];
          updated_at: string;
          user_id: string;
          wins: number;
        }[];
        SetofOptions: {
          from: "*";
          to: "challenge_scores";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      begin_game_run: {
        Args: {
          p_difficulty: string;
          p_game_id: string;
          p_run_id: string;
          p_started_at: string;
          p_user_id: string;
        };
        Returns: {
          attempts: number;
          best_score: number;
          completed_at: string;
          difficulty: string;
          discovered_secrets: string[];
          duration_ms: number;
          ending: string;
          game_id: string;
          latest_score: number;
          losses: number;
          progress: number;
          started_at: string;
          unlocked_rewards: string[];
          wins: number;
        }[];
      };
      complete_quiz_attempt: {
        Args: {
          p_achievement_id?: string;
          p_answers: Json;
          p_attempt_id: string;
          p_completed_at: string;
          p_reward_coupon_id?: string;
          p_reward_id?: string;
          p_score: number;
          p_user_id: string;
        };
        Returns: {
          achievement_was_new: boolean;
          coupon_was_new: boolean;
          reward_was_new: boolean;
        }[];
      };
      finish_arcade_run: {
        Args: {
          p_difficulty: string;
          p_discovered_secrets: string[];
          p_duration_ms: number;
          p_ending: string;
          p_finished_at: string;
          p_game_id: string;
          p_moves?: number;
          p_progress: number;
          p_reward_grants: Json;
          p_run_id: string;
          p_score: number;
          p_user_id: string;
          p_won: boolean;
        };
        Returns: {
          attempts: number;
          best_score: number;
          best_time_ms: number;
          completed_at: string;
          difficulty: string;
          discovered_secrets: string[];
          duration_ms: number;
          ending: string;
          fewest_moves: number;
          game_id: string;
          last_played_at: string;
          last_result: string;
          latest_score: number;
          losses: number;
          newly_granted_reward_ids: string[];
          progress: number;
          started_at: string;
          unlocked_rewards: string[];
          wins: number;
        }[];
      };
      finish_game_run: {
        Args: {
          p_difficulty: string;
          p_discovered_secrets: string[];
          p_duration_ms: number;
          p_ending: string;
          p_finished_at: string;
          p_game_id: string;
          p_progress: number;
          p_reward_grants: Json;
          p_run_id: string;
          p_score: number;
          p_user_id: string;
          p_won: boolean;
        };
        Returns: {
          attempts: number;
          best_score: number;
          completed_at: string;
          difficulty: string;
          discovered_secrets: string[];
          duration_ms: number;
          ending: string;
          game_id: string;
          latest_score: number;
          losses: number;
          newly_granted_reward_ids: string[];
          progress: number;
          started_at: string;
          unlocked_rewards: string[];
          wins: number;
        }[];
      };
      open_letter_state: {
        Args: {
          p_letter_slug: string;
          p_opened_at: string;
          p_reward_coupon_id?: string;
          p_reward_id?: string;
          p_user_id: string;
        };
        Returns: {
          coupon_was_new: boolean;
          letter_was_new: boolean;
          opened_at: string;
          reward_was_new: boolean;
        }[];
      };
      record_challenge_result: {
        Args: {
          p_challenge_id: string;
          p_completed: boolean;
          p_recorded_at: string;
          p_reward_coupon_id: string;
          p_score: number;
          p_user_id: string;
        };
        Returns: {
          attempts: number;
          best_score: number;
          challenge_id: string;
          completed_at: string;
          coupon_unlocked: boolean;
        }[];
      };
      redeem_coupon_state: {
        Args: { p_coupon_id: string; p_redeemed_at: string; p_user_id: string };
        Returns: {
          redeemed_at: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
