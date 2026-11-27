// Generated from the hosted Supabase project (ref ltukqsljtzqfgpvlkdtd) on 2026-11-27.
// Do not edit by hand: regenerate after every migration
// (`npx supabase gen types typescript --project-id ltukqsljtzqfgpvlkdtd`).

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
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      corners: {
        Row: {
          athlete_name: string
          created_at: string
          finish_date: string
          id: string
          name: string
          owner_id: string
          share_token: string
        }
        Insert: {
          athlete_name?: string
          created_at?: string
          finish_date: string
          id?: string
          name: string
          owner_id?: string
          share_token?: string
        }
        Update: {
          athlete_name?: string
          created_at?: string
          finish_date?: string
          id?: string
          name?: string
          owner_id?: string
          share_token?: string
        }
        Relationships: []
      }
      note_contacts: {
        Row: {
          contact: string
          created_at: string
          note_id: string
        }
        Insert: {
          contact: string
          created_at?: string
          note_id: string
        }
        Update: {
          contact?: string
          created_at?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_contacts_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          audio_path: string
          corner_id: string
          created_at: string
          duration_ms: number
          heard_at: string | null
          id: string
          sender_name: string
          session_id: string | null
        }
        Insert: {
          audio_path: string
          corner_id: string
          created_at?: string
          duration_ms: number
          heard_at?: string | null
          id?: string
          sender_name: string
          session_id?: string | null
        }
        Update: {
          audio_path?: string
          corner_id?: string
          created_at?: string
          duration_ms?: number
          heard_at?: string | null
          id?: string
          sender_name?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_corner_id_fkey"
            columns: ["corner_id"]
            isOneToOne: false
            referencedRelation: "corners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          corner_id: string
          day: string
          id: string
          kind: string
          minutes: number
        }
        Insert: {
          corner_id: string
          day: string
          id?: string
          kind: string
          minutes: number
        }
        Update: {
          corner_id?: string
          day?: string
          id?: string
          kind?: string
          minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessions_corner_id_fkey"
            columns: ["corner_id"]
            isOneToOne: false
            referencedRelation: "corners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_note_contact: {
        Args: { p_contact: string; p_note_id: string }
        Returns: undefined
      }
      assert_corner_owner: { Args: { p_corner_id: string }; Returns: undefined }
      corner_streak: {
        Args: { p_corner_id: string; p_today?: string }
        Returns: {
          streak_weeks: number
          this_week_kept: boolean
        }[]
      }
      get_corner_by_token: {
        Args: { p_token: string }
        Returns: {
          athlete_name: string
          finish_date: string
          name: string
          streak_weeks: number
          this_week_kept: boolean
        }[]
      }
      get_plan_by_token: {
        Args: { p_token: string }
        Returns: {
          day: string
          id: string
          kind: string
          messages: number
          minutes: number
        }[]
      }
      mark_note_heard: {
        Args: { p_heard_at?: string; p_note_id: string }
        Returns: string
      }
      my_corner_streaks: {
        Args: never
        Returns: {
          corner_id: string
          streak_weeks: number
          this_week_kept: boolean
        }[]
      }
      remove_session: { Args: { p_session_id: string }; Returns: undefined }
      set_session: {
        Args: {
          p_corner_id: string
          p_day: string
          p_kind: string
          p_minutes: number
        }
        Returns: string
      }
      set_usual_week: {
        Args: { p_corner_id: string; p_from: string; p_week: Json }
        Returns: number
      }
      submit_note: {
        Args: {
          p_audio_path: string
          p_duration_ms: number
          p_sender_name: string
          p_session_id?: string
          p_token: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"]
