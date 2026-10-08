export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TimestampColumns = {
  created_at: string;
  updated_at: string;
};

type TimestampInsert = {
  created_at?: string;
  updated_at?: string;
};

export interface Database {
  public: {
    Tables: {
      site_progress: {
        Row: TimestampColumns & {
          user_id: string;
          memories_discovered: number;
          last_visited_at: string | null;
        };
        Insert: TimestampInsert & {
          user_id: string;
          memories_discovered?: number;
          last_visited_at?: string | null;
        };
        Update: Partial<
          TimestampInsert & {
            memories_discovered: number;
            last_visited_at: string | null;
          }
        >;
        Relationships: [];
      };
      coupon_state: {
        Row: TimestampColumns & {
          user_id: string;
          coupon_id: string;
          unlocked_at: string | null;
          redeemed_at: string | null;
        };
        Insert: TimestampInsert & {
          user_id: string;
          coupon_id: string;
          unlocked_at?: string | null;
          redeemed_at?: string | null;
        };
        Update: Partial<
          TimestampInsert & {
            unlocked_at: string | null;
            redeemed_at: string | null;
          }
        >;
        Relationships: [];
      };
      challenge_scores: {
        Row: TimestampColumns & {
          user_id: string;
          challenge_id: string;
          best_score: number;
          latest_score: number;
          attempts: number;
          started_at: string | null;
          completed_at: string | null;
          duration_ms: number;
          difficulty: string;
          progress: number;
          ending: string | null;
          wins: number;
          losses: number;
          unlocked_rewards: string[];
          discovered_secrets: string[];
          active_run_id: string | null;
          last_finished_run_id: string | null;
        };
        Insert: TimestampInsert & {
          user_id: string;
          challenge_id: string;
          best_score?: number;
          latest_score?: number;
          attempts?: number;
          started_at?: string | null;
          completed_at?: string | null;
          duration_ms?: number;
          difficulty?: string;
          progress?: number;
          ending?: string | null;
          wins?: number;
          losses?: number;
          unlocked_rewards?: string[];
          discovered_secrets?: string[];
          active_run_id?: string | null;
          last_finished_run_id?: string | null;
        };
        Update: Partial<
          TimestampInsert & {
            best_score: number;
            latest_score: number;
            attempts: number;
            started_at: string | null;
            completed_at: string | null;
            duration_ms: number;
            difficulty: string;
            progress: number;
            ending: string | null;
            wins: number;
            losses: number;
            unlocked_rewards: string[];
            discovered_secrets: string[];
            active_run_id: string | null;
            last_finished_run_id: string | null;
          }
        >;
        Relationships: [];
      };
      quiz_attempts: {
        Row: TimestampColumns & {
          user_id: string;
          id: string;
          status: "active" | "completed" | "abandoned";
          started_at: string;
          completed_at: string | null;
          score: number | null;
          answers: Json;
        };
        Insert: TimestampInsert & {
          user_id: string;
          id: string;
          status?: "active" | "completed" | "abandoned";
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
          answers?: Json;
        };
        Update: Partial<
          TimestampInsert & {
            status: "active" | "completed" | "abandoned";
            started_at: string;
            completed_at: string | null;
            score: number | null;
            answers: Json;
          }
        >;
        Relationships: [];
      };
      letter_state: {
        Row: TimestampColumns & {
          user_id: string;
          letter_slug: string;
          opened_at: string;
        };
        Insert: TimestampInsert & {
          user_id: string;
          letter_slug: string;
          opened_at?: string;
        };
        Update: Partial<TimestampInsert & { opened_at: string }>;
        Relationships: [];
      };
      achievements: {
        Row: TimestampColumns & {
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          metadata: Json;
        };
        Insert: TimestampInsert & {
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
          metadata?: Json;
        };
        Update: Partial<
          TimestampInsert & { unlocked_at: string; metadata: Json }
        >;
        Relationships: [];
      };
      discoveries: {
        Row: TimestampColumns & {
          user_id: string;
          discovery_id: string;
          discovery_type: string;
          source: string;
          discovered_at: string;
          metadata: Json;
        };
        Insert: TimestampInsert & {
          user_id: string;
          discovery_id: string;
          discovery_type: string;
          source: string;
          discovered_at?: string;
          metadata?: Json;
        };
        Update: Partial<
          TimestampInsert & {
            discovery_type: string;
            source: string;
            discovered_at: string;
            metadata: Json;
          }
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      redeem_coupon_state: {
        Args: {
          p_user_id: string;
          p_coupon_id: string;
          p_redeemed_at: string;
        };
        Returns: { redeemed_at: string }[];
      };
      record_challenge_result: {
        Args: {
          p_user_id: string;
          p_challenge_id: string;
          p_score: number;
          p_completed: boolean;
          p_reward_coupon_id: string;
          p_recorded_at: string;
        };
        Returns: {
          challenge_id: string;
          best_score: number;
          attempts: number;
          completed_at: string | null;
          coupon_unlocked: boolean;
        }[];
      };
      begin_game_run: {
        Args: {
          p_run_id: string;
          p_user_id: string;
          p_game_id: string;
          p_difficulty: string;
          p_started_at: string;
        };
        Returns: {
          game_id: string;
          best_score: number;
          latest_score: number;
          attempts: number;
          started_at: string | null;
          completed_at: string | null;
          duration_ms: number;
          difficulty: string;
          progress: number;
          ending: string | null;
          wins: number;
          losses: number;
          unlocked_rewards: string[];
          discovered_secrets: string[];
        }[];
      };
      finish_game_run: {
        Args: {
          p_run_id: string;
          p_user_id: string;
          p_game_id: string;
          p_score: number;
          p_duration_ms: number;
          p_difficulty: string;
          p_progress: number;
          p_ending: string;
          p_won: boolean;
          p_reward_grants: Json;
          p_discovered_secrets: string[];
          p_finished_at: string;
        };
        Returns: {
          game_id: string;
          best_score: number;
          latest_score: number;
          attempts: number;
          started_at: string | null;
          completed_at: string | null;
          duration_ms: number;
          difficulty: string;
          progress: number;
          ending: string | null;
          wins: number;
          losses: number;
          unlocked_rewards: string[];
          discovered_secrets: string[];
          newly_granted_reward_ids: string[];
        }[];
      };
      open_letter_state: {
        Args: {
          p_user_id: string;
          p_letter_slug: string;
          p_opened_at: string;
          p_reward_id: string | null;
          p_reward_coupon_id: string | null;
        };
        Returns: {
          opened_at: string;
          letter_was_new: boolean;
          reward_was_new: boolean;
          coupon_was_new: boolean;
        }[];
      };
      complete_quiz_attempt: {
        Args: {
          p_user_id: string;
          p_attempt_id: string;
          p_answers: Json;
          p_score: number;
          p_completed_at: string;
          p_achievement_id: string | null;
          p_reward_id: string | null;
          p_reward_coupon_id: string | null;
        };
        Returns: {
          achievement_was_new: boolean;
          reward_was_new: boolean;
          coupon_was_new: boolean;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
