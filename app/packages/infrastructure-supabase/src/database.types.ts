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
          participant_a: string
          participant_b: string
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
          participant_a: string
          participant_b: string
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
          participant_a?: string
          participant_b?: string
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
          name_en: string
          name_he: string
        }
        Insert: {
          city_id: string
          name_en: string
          name_he: string
        }
        Update: {
          city_id?: string
          name_en?: string
          name_he?: string
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
          submitted_by: string
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
          submitted_by: string
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
          submitted_by?: string
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
          status: string
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
          status?: string
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
          status?: string
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
          city: string
          city_name: string
          closure_explainer_dismissed: boolean
          created_at: string
          display_name: string
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
          city: string
          city_name: string
          closure_explainer_dismissed?: boolean
          created_at?: string
          display_name: string
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
          city?: string
          city_name?: string
          closure_explainer_dismissed?: boolean
          created_at?: string
          display_name?: string
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
      community_stats: {
        Row: {
          active_public_posts: number | null
          as_of: string | null
          items_delivered_total: number | null
          registered_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      active_posts_count_for_viewer: {
        Args: { p_owner: string; p_viewer: string }
        Returns: number
      }
      find_or_create_support_chat: { Args: { p_user: string }; Returns: string }
      has_blocked: {
        Args: { blocked: string; blocker: string }
        Returns: boolean
      }
      inject_system_message: {
        Args: { p_body?: string; p_chat_id: string; p_payload: Json }
        Returns: string
      }
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
      rpc_chat_mark_read: { Args: { p_chat_id: string }; Returns: undefined }
      rpc_chat_hide_for_viewer: { Args: { p_chat_id: string }; Returns: undefined }
      rpc_chat_set_anchor: {
        Args: { p_anchor_post_id: string; p_chat_id: string }
        Returns: Database['public']['Tables']['chats']['Row']
      }
      rpc_chat_unread_total: { Args: never; Returns: number }
      rpc_get_or_create_support_thread: {
        Args: never
        Returns: {
          anchor_post_id: string | null
          chat_id: string
          created_at: string
          is_support_thread: boolean
          last_message_at: string
          participant_a: string
          participant_b: string
          removed_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "chats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      stats_safe_dec: { Args: { p_value: number }; Returns: number }
      // P0.6 closure RPCs (0015) — manually added until next typegen run.
      close_post_with_recipient: {
        Args: { p_post_id: string; p_recipient_user_id: string }
        Returns: Database["public"]["Tables"]["posts"]["Row"]
      }
      reopen_post_marked: {
        Args: { p_post_id: string }
        Returns: Database["public"]["Tables"]["posts"]["Row"]
      }
      // P0.6 cleanup cron (0016) — manually added until next typegen run.
      closure_cleanup_expired: { Args: Record<string, never>; Returns: number }
      closure_cleanup_expired_with_metric: { Args: Record<string, never>; Returns: number }
      // FR-ADMIN-009 (0017) — manually added until next typegen run.
      admin_remove_post: { Args: { p_post_id: string }; Returns: undefined }
      // P1.2 (0021, 0022) — manually added until next typegen run.
      haversine_km: {
        Args: { lat1: number; lon1: number; lat2: number; lon2: number }
        Returns: number
      }
      feed_ranked_ids: {
        Args: {
          p_viewer_id: string
          p_filter_type?: string | null
          p_filter_categories?: string[] | null
          p_filter_item_conditions?: string[] | null
          p_filter_status?: string
          p_filter_center_city?: string | null
          p_filter_radius_km?: number | null
          p_sort_order?: string
          p_proximity_sort_city?: string | null
          p_page_limit?: number
          p_cursor_distance?: number | null
          p_cursor_created_at?: string | null
          p_cursor_post_id?: string | null
          p_followers_only?: boolean
        }
        Returns: { post_id: string; distance_km: number | null }[]
      }
      // FR-STATS-003 (0030) — manually added until next typegen run.
      rpc_my_activity_timeline: {
        Args: { p_limit?: number }
        Returns: {
          occurred_at: string
          kind: string
          post_id: string
          post_title: string
          actor_display_name: string | null
        }[]
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
    Enums: {},
  },
} as const
