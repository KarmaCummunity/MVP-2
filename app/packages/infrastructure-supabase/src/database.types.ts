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
      about_team_members: {
        Row: {
          created_at: string
          is_active: boolean
          role_key: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          role_key: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          role_key?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "about_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_role_grants: {
        Row: {
          grant_id: string
          granted_at: string
          granted_by: string | null
          revoked_at: string | null
          revoked_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          grant_id?: string
          granted_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role: string
          user_id: string
        }
        Update: {
          grant_id?: string
          granted_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_role_grants_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_role_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          event_id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          event_id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          event_id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      auth_identities: {
        Row: {
          auth_identity_id: string
          created_at: string
          provider: string
          provider_subject: string
          user_id: string
        }
        Insert: {
          auth_identity_id?: string
          created_at?: string
          provider: string
          provider_subject: string
          user_id: string
        }
        Update: {
          auth_identity_id?: string
          created_at?: string
          provider?: string
          provider_subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chats: {
        Row: {
          anchor_post_id: string | null
          chat_id: string
          created_at: string
          inbox_hidden_at_a: string | null
          inbox_hidden_at_b: string | null
          is_support_thread: boolean
          last_message_at: string
          participant_a: string | null
          participant_b: string | null
          removed_at: string | null
        }
        Insert: {
          anchor_post_id?: string | null
          chat_id?: string
          created_at?: string
          inbox_hidden_at_a?: string | null
          inbox_hidden_at_b?: string | null
          is_support_thread?: boolean
          last_message_at?: string
          participant_a?: string | null
          participant_b?: string | null
          removed_at?: string | null
        }
        Update: {
          anchor_post_id?: string | null
          chat_id?: string
          created_at?: string
          inbox_hidden_at_a?: string | null
          inbox_hidden_at_b?: string | null
          is_support_thread?: boolean
          last_message_at?: string
          participant_a?: string | null
          participant_b?: string | null
          removed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_anchor_post_id_fkey"
            columns: ["anchor_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "chats_participant_a_fkey"
            columns: ["participant_a"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chats_participant_b_fkey"
            columns: ["participant_b"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cities: {
        Row: {
          city_id: string
          lat: number | null
          lon: number | null
          name_en: string
          name_he: string
        }
        Insert: {
          city_id: string
          lat?: number | null
          lon?: number | null
          name_en: string
          name_he: string
        }
        Update: {
          city_id?: string
          lat?: number | null
          lon?: number | null
          name_en?: string
          name_he?: string
        }
        Relationships: []
      }
      closure_cleanup_metrics: {
        Row: {
          deleted_count: number
          run_at: string
        }
        Insert: {
          deleted_count: number
          run_at?: string
        }
        Update: {
          deleted_count?: number
          run_at?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          active: boolean
          device_id: string
          last_seen_at: string
          platform: string
          push_token: string
          user_id: string
        }
        Insert: {
          active?: boolean
          device_id?: string
          last_seen_at?: string
          platform: string
          push_token: string
          user_id: string
        }
        Update: {
          active?: boolean
          device_id?: string
          last_seen_at?: string
          platform?: string
          push_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      donation_categories: {
        Row: {
          icon_name: string
          is_active: boolean
          label_he: string
          slug: string
          sort_order: number
        }
        Insert: {
          icon_name: string
          is_active?: boolean
          label_he: string
          slug: string
          sort_order: number
        }
        Update: {
          icon_name?: string
          is_active?: boolean
          label_he?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      donation_links: {
        Row: {
          category_slug: string
          created_at: string
          description: string | null
          display_name: string
          hidden_at: string | null
          hidden_by: string | null
          id: string
          search_vector: unknown
          submitted_by: string
          tags: string | null
          url: string
          validated_at: string
        }
        Insert: {
          category_slug: string
          created_at?: string
          description?: string | null
          display_name: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          search_vector?: unknown
          submitted_by: string
          tags?: string | null
          url: string
          validated_at: string
        }
        Update: {
          category_slug?: string
          created_at?: string
          description?: string | null
          display_name?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          search_vector?: unknown
          submitted_by?: string
          tags?: string | null
          url?: string
          validated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_links_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "donation_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      follow_edges: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_edges_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follow_edges_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      follow_requests: {
        Row: {
          cooldown_until: string | null
          created_at: string
          requester_id: string
          resolved_at: string | null
          status: string
          target_id: string
        }
        Insert: {
          cooldown_until?: string | null
          created_at?: string
          requester_id: string
          resolved_at?: string | null
          status?: string
          target_id: string
        }
        Update: {
          cooldown_until?: string | null
          created_at?: string
          requester_id?: string
          resolved_at?: string | null
          status?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follow_requests_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      legal_document_versions: {
        Row: {
          body_md: string
          change_summary: string | null
          content_hash: string
          created_at: string
          doc_type: Database["public"]["Enums"]["legal_doc_type"]
          effective_date: string
          id: string
          language: string
          published_at: string
          published_by: string
          severity: string
          version: number
        }
        Insert: {
          body_md: string
          change_summary?: string | null
          content_hash?: string
          created_at?: string
          doc_type: Database["public"]["Enums"]["legal_doc_type"]
          effective_date: string
          id?: string
          language?: string
          published_at?: string
          published_by: string
          severity: string
          version: number
        }
        Update: {
          body_md?: string
          change_summary?: string | null
          content_hash?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["legal_doc_type"]
          effective_date?: string
          id?: string
          language?: string
          published_at?: string
          published_by?: string
          severity?: string
          version?: number
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          current_effective_date: string
          current_version: number
          doc_type: Database["public"]["Enums"]["legal_doc_type"]
          id: string
          last_material_severity: string | null
          last_material_version: number
          updated_at: string
        }
        Insert: {
          current_effective_date: string
          current_version?: number
          doc_type: Database["public"]["Enums"]["legal_doc_type"]
          id?: string
          last_material_severity?: string | null
          last_material_version?: number
          updated_at?: string
        }
        Update: {
          current_effective_date?: string
          current_version?: number
          doc_type?: Database["public"]["Enums"]["legal_doc_type"]
          id?: string
          last_material_severity?: string | null
          last_material_version?: number
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          created_at: string
          media_asset_id: string
          mime_type: string
          ordinal: number
          path: string
          post_id: string
          size_bytes: number
        }
        Insert: {
          created_at?: string
          media_asset_id?: string
          mime_type: string
          ordinal: number
          path: string
          post_id: string
          size_bytes: number
        }
        Update: {
          created_at?: string
          media_asset_id?: string
          mime_type?: string
          ordinal?: number
          path?: string
          post_id?: string
          size_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          chat_id: string
          created_at: string
          delivered_at: string | null
          kind: string
          message_id: string
          read_at: string | null
          sender_id: string | null
          status: string
          system_payload: Json | null
        }
        Insert: {
          body?: string | null
          chat_id: string
          created_at?: string
          delivered_at?: string | null
          kind?: string
          message_id?: string
          read_at?: string | null
          sender_id?: string | null
          status?: string
          system_payload?: Json | null
        }
        Update: {
          body?: string | null
          chat_id?: string
          created_at?: string
          delivered_at?: string | null
          kind?: string
          message_id?: string
          read_at?: string | null
          sender_id?: string | null
          status?: string
          system_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      moderation_queue_entries: {
        Row: {
          created_at: string
          entry_id: string
          metadata: Json | null
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          entry_id?: string
          metadata?: Json | null
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          metadata?: Json | null
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_entries_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications_outbox: {
        Row: {
          attempts: number
          body_args: Json
          body_key: string
          bypass_preferences: boolean
          category: string
          created_at: string
          data: Json
          dedupe_key: string | null
          dispatched_at: string | null
          expires_at: string
          kind: string
          last_error: string | null
          notification_id: string
          title_key: string
          user_id: string
        }
        Insert: {
          attempts?: number
          body_args?: Json
          body_key: string
          bypass_preferences?: boolean
          category: string
          created_at?: string
          data?: Json
          dedupe_key?: string | null
          dispatched_at?: string | null
          expires_at?: string
          kind: string
          last_error?: string | null
          notification_id?: string
          title_key: string
          user_id: string
        }
        Update: {
          attempts?: number
          body_args?: Json
          body_key?: string
          bypass_preferences?: boolean
          category?: string
          created_at?: string
          data?: Json
          dedupe_key?: string | null
          dispatched_at?: string | null
          expires_at?: string
          kind?: string
          last_error?: string | null
          notification_id?: string
          title_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_outbox_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_actor_identity: {
        Row: {
          hide_from_counterparty: boolean
          identity_visibility: string
          post_id: string
          surface_visibility: string
          updated_at: string
          user_id: string
        }
        Insert: {
          hide_from_counterparty?: boolean
          identity_visibility: string
          post_id: string
          surface_visibility?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          hide_from_counterparty?: boolean
          identity_visibility?: string
          post_id?: string
          surface_visibility?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_actor_identity_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_actor_identity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          category: string
          city: string
          created_at: string
          delete_after: string | null
          description: string | null
          item_condition: string | null
          location_display_level: string
          owner_id: string
          post_id: string
          reopen_count: number
          search_vector: unknown
          status: string
          status_before_admin_removal: string | null
          street: string
          street_number: string
          title: string
          type: string
          updated_at: string
          urgency: string | null
          visibility: string
        }
        Insert: {
          category?: string
          city: string
          created_at?: string
          delete_after?: string | null
          description?: string | null
          item_condition?: string | null
          location_display_level?: string
          owner_id: string
          post_id?: string
          reopen_count?: number
          search_vector?: unknown
          status?: string
          status_before_admin_removal?: string | null
          street: string
          street_number: string
          title: string
          type: string
          updated_at?: string
          urgency?: string | null
          visibility?: string
        }
        Update: {
          category?: string
          city?: string
          created_at?: string
          delete_after?: string | null
          description?: string | null
          item_condition?: string | null
          location_display_level?: string
          owner_id?: string
          post_id?: string
          reopen_count?: number
          search_vector?: unknown
          status?: string
          status_before_admin_removal?: string | null
          street?: string
          street_number?: string
          title?: string
          type?: string
          updated_at?: string
          urgency?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_city_fkey"
            columns: ["city"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "posts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      recipients: {
        Row: {
          marked_at: string
          post_id: string
          recipient_user_id: string
        }
        Insert: {
          marked_at?: string
          post_id: string
          recipient_user_id: string
        }
        Update: {
          marked_at?: string
          post_id?: string
          recipient_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipients_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "recipients_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reporter_hides: {
        Row: {
          created_at: string
          reporter_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          reporter_id: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          reporter_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reporter_hides_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          note: string | null
          reason: string
          report_id: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          sanction_consumed_at: string | null
          status: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          reason: string
          report_id?: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          sanction_consumed_at?: string | null
          status?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          created_at?: string
          note?: string | null
          reason?: string
          report_id?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          sanction_consumed_at?: string | null
          status?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          post_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          post_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          post_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stats_drift_events: {
        Row: {
          column_name: string
          detected_at: string
          drift_id: number
          new_value: number
          old_value: number
          run_id: number
          user_id: string
        }
        Insert: {
          column_name: string
          detected_at?: string
          drift_id?: number
          new_value: number
          old_value: number
          run_id: number
          user_id: string
        }
        Update: {
          column_name?: string
          detected_at?: string
          drift_id?: number
          new_value?: number
          old_value?: number
          run_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stats_drift_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "stats_recompute_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "stats_drift_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stats_recompute_runs: {
        Row: {
          drift_events: number
          run_at: string
          run_id: number
          users_processed: number
        }
        Insert: {
          drift_events: number
          run_at?: string
          run_id?: number
          users_processed: number
        }
        Update: {
          drift_events?: number
          run_at?: string
          run_id?: number
          users_processed?: number
        }
        Relationships: []
      }
      streets: {
        Row: {
          city_id: string
          name_he: string
          street_id: number
        }
        Insert: {
          city_id: string
          name_he: string
          street_id: number
        }
        Update: {
          city_id?: string
          name_he?: string
          street_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "streets_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["city_id"]
          },
        ]
      }
      survey_answers: {
        Row: {
          answer_text: string | null
          created_at: string
          id: string
          question_id: string
          rating: number
          survey_id: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id: string
          rating: number
          survey_id: string
          updated_at?: string
          user_id: string
          version: number
        }
        Update: {
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id?: string
          rating?: number
          survey_id?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          context_he: string
          id: string
          prompt_he: string
          question_type: Database["public"]["Enums"]["survey_question_type"]
          rating_anchor_high_he: string
          rating_anchor_low_he: string
          short_label_he: string
          sort_order: number
          survey_version_id: string
          text_placeholder_he: string
        }
        Insert: {
          context_he?: string
          id?: string
          prompt_he: string
          question_type?: Database["public"]["Enums"]["survey_question_type"]
          rating_anchor_high_he?: string
          rating_anchor_low_he?: string
          short_label_he: string
          sort_order: number
          survey_version_id: string
          text_placeholder_he?: string
        }
        Update: {
          context_he?: string
          id?: string
          prompt_he?: string
          question_type?: Database["public"]["Enums"]["survey_question_type"]
          rating_anchor_high_he?: string
          rating_anchor_low_he?: string
          short_label_he?: string
          sort_order?: number
          survey_version_id?: string
          text_placeholder_he?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_version_id_fkey"
            columns: ["survey_version_id"]
            isOneToOne: false
            referencedRelation: "survey_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_versions: {
        Row: {
          id: string
          published_at: string
          published_by: string
          survey_id: string
          version: number
        }
        Insert: {
          id?: string
          published_at?: string
          published_by: string
          survey_id: string
          version: number
        }
        Update: {
          id?: string
          published_at?: string
          published_by?: string
          survey_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "survey_versions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          current_version: number
          description_he: string | null
          id: string
          is_active: boolean
          prompt_rules: Json
          slug: string
          title_he: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_version?: number
          description_he?: string | null
          id?: string
          is_active?: boolean
          prompt_rules?: Json
          slug: string
          title_he: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_version?: number
          description_he?: string | null
          id?: string
          is_active?: boolean
          prompt_rules?: Json
          slug?: string
          title_he?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          body: string
          created_at: string
          id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          rating?: number | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_legal_acceptances: {
        Row: {
          accepted_at: string
          doc_type: Database["public"]["Enums"]["legal_doc_type"]
          id: string
          ip_inet: unknown
          locale: string | null
          user_agent: string | null
          user_id: string
          version: number
        }
        Insert: {
          accepted_at?: string
          doc_type: Database["public"]["Enums"]["legal_doc_type"]
          id?: string
          ip_inet?: unknown
          locale?: string | null
          user_agent?: string | null
          user_id: string
          version: number
        }
        Update: {
          accepted_at?: string
          doc_type?: Database["public"]["Enums"]["legal_doc_type"]
          id?: string
          ip_inet?: unknown
          locale?: string | null
          user_agent?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_legal_acceptances_version_fk"
            columns: ["doc_type", "version"]
            isOneToOne: false
            referencedRelation: "legal_document_versions"
            referencedColumns: ["doc_type", "version"]
          },
        ]
      }
      user_personal_activity_log: {
        Row: {
          actor_display_name: string | null
          kind: string
          log_id: number
          occurred_at: string
          post_id: string
          post_title: string
          subject_user_id: string
        }
        Insert: {
          actor_display_name?: string | null
          kind: string
          log_id?: number
          occurred_at: string
          post_id: string
          post_title: string
          subject_user_id: string
        }
        Update: {
          actor_display_name?: string | null
          kind?: string
          log_id?: number
          occurred_at?: string
          post_id?: string
          post_title?: string
          subject_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_personal_activity_log_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: string
          account_status_until: string | null
          active_posts_count_followers_only_open: number
          active_posts_count_internal: number
          active_posts_count_public_open: number
          auth_provider: string
          avatar_url: string | null
          basic_info_skipped: boolean
          biography: string | null
          city: string | null
          city_name: string | null
          closure_explainer_dismissed: boolean
          contact_phone: string | null
          created_at: string
          display_name: string | null
          false_report_sanction_count: number
          false_reports_count: number
          first_post_nudge_dismissed: boolean
          followers_count: number
          following_count: number
          is_super_admin: boolean
          items_given_count: number
          items_received_count: number
          notification_preferences: Json
          onboarding_state: string
          posts_created_total: number
          privacy_changed_at: string | null
          privacy_mode: string
          profile_street: string | null
          profile_street_number: string | null
          search_vector: unknown
          share_handle: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string
          account_status_until?: string | null
          active_posts_count_followers_only_open?: number
          active_posts_count_internal?: number
          active_posts_count_public_open?: number
          auth_provider: string
          avatar_url?: string | null
          basic_info_skipped?: boolean
          biography?: string | null
          city?: string | null
          city_name?: string | null
          closure_explainer_dismissed?: boolean
          contact_phone?: string | null
          created_at?: string
          display_name?: string | null
          false_report_sanction_count?: number
          false_reports_count?: number
          first_post_nudge_dismissed?: boolean
          followers_count?: number
          following_count?: number
          is_super_admin?: boolean
          items_given_count?: number
          items_received_count?: number
          notification_preferences?: Json
          onboarding_state?: string
          posts_created_total?: number
          privacy_changed_at?: string | null
          privacy_mode?: string
          profile_street?: string | null
          profile_street_number?: string | null
          search_vector?: unknown
          share_handle: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string
          account_status_until?: string | null
          active_posts_count_followers_only_open?: number
          active_posts_count_internal?: number
          active_posts_count_public_open?: number
          auth_provider?: string
          avatar_url?: string | null
          basic_info_skipped?: boolean
          biography?: string | null
          city?: string | null
          city_name?: string | null
          closure_explainer_dismissed?: boolean
          contact_phone?: string | null
          created_at?: string
          display_name?: string | null
          false_report_sanction_count?: number
          false_reports_count?: number
          first_post_nudge_dismissed?: boolean
          followers_count?: number
          following_count?: number
          is_super_admin?: boolean
          items_given_count?: number
          items_received_count?: number
          notification_preferences?: Json
          onboarding_state?: string
          posts_created_total?: number
          privacy_changed_at?: string | null
          privacy_mode?: string
          profile_street?: string | null
          profile_street_number?: string | null
          search_vector?: unknown
          share_handle?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_city_fkey"
            columns: ["city"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["city_id"]
          },
        ]
      }
    }
    Views: {
      about_team_profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          role_key: string | null
          share_handle: string | null
          sort_order: number | null
        }
        Relationships: []
      }
      community_stats: {
        Row: {
          active_public_posts: number | null
          as_of: string | null
          items_delivered_total: number | null
          registered_users: number | null
        }
        Relationships: []
      }
      user_legal_acceptances_latest: {
        Row: {
          accepted_at: string | null
          doc_type: Database["public"]["Enums"]["legal_doc_type"] | null
          user_id: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_legal_acceptances_version_fk"
            columns: ["doc_type", "version"]
            isOneToOne: false
            referencedRelation: "legal_document_versions"
            referencedColumns: ["doc_type", "version"]
          },
        ]
      }
    }
    Functions: {
      accept_legal_document: {
        Args: {
          p_doc_type: Database["public"]["Enums"]["legal_doc_type"]
          p_locale: string
          p_user_agent: string
          p_version: number
        }
        Returns: Json
      }
      active_posts_count_for_viewer: {
        Args: { p_owner: string; p_viewer: string }
        Returns: number
      }
      admin_assert_role: {
        Args: { allowed: string[]; uid: string }
        Returns: undefined
      }
      admin_audit_lookup: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          action: string
          actor_id: string | null
          created_at: string
          event_id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "audit_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_audit_lookup_guarded: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          action: string
          actor_id: string | null
          created_at: string
          event_id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "audit_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_ban_user: {
        Args: { p_note: string; p_reason: string; p_target_user_id: string }
        Returns: undefined
      }
      admin_confirm_report: {
        Args: { p_report_id: string }
        Returns: undefined
      }
      admin_delete_message: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      admin_dismiss_report: {
        Args: { p_report_id: string }
        Returns: undefined
      }
      admin_remove_post: { Args: { p_post_id: string }; Returns: undefined }
      admin_restore_target: {
        Args: { p_target_id: string; p_target_type: string }
        Returns: undefined
      }
      auth_check_account_gate: {
        Args: { p_user_id: string }
        Returns: {
          allowed: boolean
          reason: string
          until_at: string
        }[]
      }
      check_survey_prompt_eligibility: {
        Args: { p_session_count: number; p_slug: string }
        Returns: Json
      }
      close_post_with_recipient: {
        Args: { p_post_id: string; p_recipient_user_id: string }
        Returns: {
          category: string
          city: string
          created_at: string
          delete_after: string | null
          description: string | null
          item_condition: string | null
          location_display_level: string
          owner_id: string
          post_id: string
          reopen_count: number
          search_vector: unknown
          status: string
          status_before_admin_removal: string | null
          street: string
          street_number: string
          title: string
          type: string
          updated_at: string
          urgency: string | null
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      closure_cleanup_expired: { Args: never; Returns: number }
      closure_cleanup_expired_with_metric: { Args: never; Returns: number }
      delete_account_data: { Args: never; Returns: Json }
      enqueue_notification: {
        Args: {
          p_body_args?: Json
          p_body_key: string
          p_bypass_preferences?: boolean
          p_category: string
          p_data?: Json
          p_dedupe_key?: string
          p_kind: string
          p_title_key: string
          p_user_id: string
        }
        Returns: string
      }
      feed_ranked_ids:
        | {
            Args: {
              p_cursor_created_at?: string
              p_cursor_distance?: number
              p_cursor_post_id?: string
              p_filter_categories?: string[]
              p_filter_center_city?: string
              p_filter_item_conditions?: string[]
              p_filter_radius_km?: number
              p_filter_status?: string
              p_filter_type?: string
              p_page_limit?: number
              p_proximity_sort_city?: string
              p_sort_order?: string
              p_viewer_id: string
            }
            Returns: {
              distance_km: number
              post_id: string
            }[]
          }
        | {
            Args: {
              p_cursor_created_at?: string
              p_cursor_distance?: number
              p_cursor_post_id?: string
              p_filter_categories?: string[]
              p_filter_center_city?: string
              p_filter_item_conditions?: string[]
              p_filter_radius_km?: number
              p_filter_status?: string
              p_filter_type?: string
              p_followers_only?: boolean
              p_page_limit?: number
              p_proximity_sort_city?: string
              p_sort_order?: string
              p_viewer_id: string
            }
            Returns: {
              distance_km: number
              post_id: string
            }[]
          }
      find_or_create_support_chat: { Args: { p_user: string }; Returns: string }
      get_my_admin_roles: { Args: never; Returns: string[] }
      get_survey_bundle: { Args: { p_slug: string }; Returns: Json }
      has_admin_role: {
        Args: { role_name: string; uid: string }
        Returns: boolean
      }
      has_blocked: {
        Args: { blocked: string; blocker: string }
        Returns: boolean
      }
      haversine_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      inject_system_message: {
        Args: { p_body?: string; p_chat_id: string; p_payload: Json }
        Returns: string
      }
      is_active_member: { Args: { uid: string }; Returns: boolean }
      is_admin: { Args: { uid: string }; Returns: boolean }
      is_blocked: { Args: { a: string; b: string }; Returns: boolean }
      is_chat_visible_to: {
        Args: {
          p_chat: Database["public"]["Tables"]["chats"]["Row"]
          p_viewer: string
        }
        Returns: boolean
      }
      is_following: {
        Args: { followed: string; follower: string }
        Returns: boolean
      }
      is_post_visible_to: {
        Args: {
          p_post: Database["public"]["Tables"]["posts"]["Row"]
          p_viewer: string
        }
        Returns: boolean
      }
      list_active_surveys: { Args: never; Returns: Json }
      needs_legal_reacknowledgement: {
        Args: never
        Returns: {
          block_mode: string
          current_effective_date: string
          current_version: number
          doc_type: Database["public"]["Enums"]["legal_doc_type"]
          last_accepted_version: number
          last_material_severity: string
          last_material_version: number
        }[]
      }
      notifications_backlog_check: { Args: never; Returns: undefined }
      notifications_bump_attempt: {
        Args: { p_error: string; p_id: string }
        Returns: undefined
      }
      notifications_post_expiry_check: { Args: never; Returns: undefined }
      participant_closed_surface_visible: {
        Args: {
          p_actor: string
          p_post: Database["public"]["Tables"]["posts"]["Row"]
          p_viewer: string
        }
        Returns: boolean
      }
      profile_closed_posts: {
        Args: {
          p_cursor?: string
          p_limit?: number
          p_list_mode?: string
          p_profile_user_id: string
          p_viewer_user_id: string
        }
        Returns: {
          closed_at: string
          identity_role: string
          post_id: string
        }[]
      }
      profile_closed_posts_count: {
        Args: {
          p_list_mode?: string
          p_profile_user_id: string
          p_viewer_user_id: string
        }
        Returns: number
      }
      publish_legal_document: {
        Args: {
          p_body_md: string
          p_change_summary: string
          p_doc_type: Database["public"]["Enums"]["legal_doc_type"]
          p_effective_date: string
          p_severity: string
        }
        Returns: Json
      }
      publish_survey_version: {
        Args: {
          p_description_he: string
          p_is_active: boolean
          p_prompt_rules: Json
          p_questions: Json
          p_slug: string
          p_title_he: string
        }
        Returns: Json
      }
      reopen_post_deleted_no_recipient: {
        Args: { p_post_id: string }
        Returns: {
          category: string
          city: string
          created_at: string
          delete_after: string | null
          description: string | null
          item_condition: string | null
          location_display_level: string
          owner_id: string
          post_id: string
          reopen_count: number
          search_vector: unknown
          status: string
          status_before_admin_removal: string | null
          street: string
          street_number: string
          title: string
          type: string
          updated_at: string
          urgency: string | null
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reopen_post_marked: {
        Args: { p_post_id: string }
        Returns: {
          category: string
          city: string
          created_at: string
          delete_after: string | null
          description: string | null
          item_condition: string | null
          location_display_level: string
          owner_id: string
          post_id: string
          reopen_count: number
          search_vector: unknown
          status: string
          status_before_admin_removal: string | null
          street: string
          street_number: string
          title: string
          type: string
          updated_at: string
          urgency: string | null
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reports_case_detail: {
        Args: { p_target_id: string; p_target_type: string }
        Returns: Json
      }
      reports_open_inbox: {
        Args: {
          p_cursor?: Json
          p_limit?: number
          p_max_age_days?: number
          p_reporter_filter?: string
          p_target_type_filter?: string
        }
        Returns: Json
      }
      report_donation_link: { Args: { p_link_id: string }; Returns: undefined }
      rpc_chat_hide_for_viewer: {
        Args: { p_chat_id: string }
        Returns: undefined
      }
      rpc_chat_mark_read: { Args: { p_chat_id: string }; Returns: undefined }
      rpc_chat_set_anchor: {
        Args: { p_anchor_post_id: string; p_chat_id: string }
        Returns: {
          anchor_post_id: string | null
          chat_id: string
          created_at: string
          inbox_hidden_at_a: string | null
          inbox_hidden_at_b: string | null
          is_support_thread: boolean
          last_message_at: string
          participant_a: string | null
          participant_b: string | null
          removed_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "chats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_chat_unread_total: { Args: never; Returns: number }
      rpc_get_or_create_support_thread: {
        Args: never
        Returns: {
          anchor_post_id: string | null
          chat_id: string
          created_at: string
          inbox_hidden_at_a: string | null
          inbox_hidden_at_b: string | null
          is_support_thread: boolean
          last_message_at: string
          participant_a: string | null
          participant_b: string | null
          removed_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "chats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_my_activity_timeline: {
        Args: { p_limit?: number }
        Returns: {
          actor_display_name: string
          kind: string
          occurred_at: string
          post_id: string
          post_title: string
        }[]
      }
      rpc_recipient_unmark_self: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      rpc_submit_support_issue: {
        Args: { p_category: string; p_description: string }
        Returns: {
          anchor_post_id: string | null
          chat_id: string
          created_at: string
          inbox_hidden_at_a: string | null
          inbox_hidden_at_b: string | null
          is_support_thread: boolean
          last_message_at: string
          participant_a: string | null
          participant_b: string | null
          removed_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "chats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      stats_recompute_personal_counters_nightly: {
        Args: never
        Returns: {
          drift_events: number
          users_processed: number
        }[]
      }
      stats_safe_dec: { Args: { p_value: number }; Returns: number }
      suspension_expiry_lift: { Args: never; Returns: number }
      upsert_survey_answers: {
        Args: { p_answers: Json; p_slug: string }
        Returns: undefined
      }
      users_merge_notification_preferences: {
        Args: { p_merge: Json; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      legal_doc_type: "terms" | "privacy"
      survey_question_type: "rating_1_7_with_optional_text"
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
      legal_doc_type: ["terms", "privacy"],
      survey_question_type: ["rating_1_7_with_optional_text"],
    },
  },
} as const
