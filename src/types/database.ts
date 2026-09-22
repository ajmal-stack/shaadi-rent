// =============================================================================
// ShaadiRent — Supabase Database Types
// Generated manually from migration schema (0001–0007).
// Re-generate via: supabase gen types typescript --project-id <your-project-id>
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------
export type UserRole = "customer" | "owner" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type GenderType = "bride" | "groom" | "unisex";
export type OutfitCondition = "like_new" | "excellent" | "good";
export type OutfitStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "paused"
  | "rented"
  | "archived";
export type OutfitVerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested";
export type ImageType =
  | "front"
  | "back"
  | "side"
  | "detail"
  | "label"
  | "damage"
  | "other";
export type AvailabilityStatus = "available" | "blocked" | "maintenance";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "pickup_scheduled"
  | "out_for_delivery"
  | "delivered"
  | "active"
  | "return_scheduled"
  | "returned"
  | "inspection"
  | "completed"
  | "cancelled"
  | "disputed";
export type BookingPaymentStatus =
  | "pending"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "failed";
export type PaymentStatus =
  | "created"
  | "pending"
  | "successful"
  | "failed"
  | "refunded"
  | "partially_refunded";
export type DisputeStatus = "open" | "under_review" | "resolved" | "rejected";
export type InspectionType = "pre_rental" | "post_return";
export type ConditionStatus =
  | "good"
  | "minor_damage"
  | "major_damage"
  | "missing_item";

// -----------------------------------------------------------------------------
// Database schema definition (Supabase client-compatible format)
// -----------------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      // ── profiles ────────────────────────────────────────────────────────────
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          role: UserRole;
          city: string | null;
          district: string | null;
          state: string | null;
          verification_status: VerificationStatus;
          notification_prefs: Json | null;
          is_suspended: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          city?: string | null;
          district?: string | null;
          state?: string | null;
          verification_status?: VerificationStatus;
          notification_prefs?: Json | null;
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          city?: string | null;
          district?: string | null;
          state?: string | null;
          verification_status?: VerificationStatus;
          notification_prefs?: Json | null;
          is_suspended?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── categories ──────────────────────────────────────────────────────────
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          gender_type: GenderType;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          gender_type: GenderType;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          gender_type?: GenderType;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── outfits ─────────────────────────────────────────────────────────────
      outfits: {
        Row: {
          id: string;
          owner_id: string;
          category_id: string;
          title: string;
          slug: string;
          description: string | null;
          brand: string | null;
          purchase_price: number | null;
          rental_price: number;
          security_deposit: number;
          size: string | null;
          condition: OutfitCondition;
          color: string | null;
          status: OutfitStatus;
          verification_status: OutfitVerificationStatus;
          district: string | null;
          city: string | null;
          state: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          category_id: string;
          title: string;
          slug: string;
          description?: string | null;
          brand?: string | null;
          purchase_price?: number | null;
          rental_price: number;
          security_deposit?: number;
          size?: string | null;
          condition?: OutfitCondition;
          color?: string | null;
          status?: OutfitStatus;
          verification_status?: OutfitVerificationStatus;
          district?: string | null;
          city?: string | null;
          state?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          category_id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          brand?: string | null;
          purchase_price?: number | null;
          rental_price?: number;
          security_deposit?: number;
          size?: string | null;
          condition?: OutfitCondition;
          color?: string | null;
          status?: OutfitStatus;
          verification_status?: OutfitVerificationStatus;
          district?: string | null;
          city?: string | null;
          state?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outfits_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outfits_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── outfit_images ───────────────────────────────────────────────────────
      outfit_images: {
        Row: {
          id: string;
          outfit_id: string;
          storage_path: string;
          image_type: ImageType;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          outfit_id: string;
          storage_path: string;
          image_type?: ImageType;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          outfit_id?: string;
          storage_path?: string;
          image_type?: ImageType;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "outfit_images_outfit_id_fkey";
            columns: ["outfit_id"];
            referencedRelation: "outfits";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── outfit_measurements ─────────────────────────────────────────────────
      outfit_measurements: {
        Row: {
          id: string;
          outfit_id: string;
          bust: number | null;
          waist: number | null;
          hip: number | null;
          shoulder: number | null;
          length: number | null;
          sleeve_length: number | null;
          custom_measurements: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outfit_id: string;
          bust?: number | null;
          waist?: number | null;
          hip?: number | null;
          shoulder?: number | null;
          length?: number | null;
          sleeve_length?: number | null;
          custom_measurements?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          outfit_id?: string;
          bust?: number | null;
          waist?: number | null;
          hip?: number | null;
          shoulder?: number | null;
          length?: number | null;
          sleeve_length?: number | null;
          custom_measurements?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outfit_measurements_outfit_id_fkey";
            columns: ["outfit_id"];
            referencedRelation: "outfits";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── outfit_availability ─────────────────────────────────────────────────
      outfit_availability: {
        Row: {
          id: string;
          outfit_id: string;
          start_date: string;
          end_date: string;
          status: AvailabilityStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          outfit_id: string;
          start_date: string;
          end_date: string;
          status?: AvailabilityStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          outfit_id?: string;
          start_date?: string;
          end_date?: string;
          status?: AvailabilityStatus;
        };
        Relationships: [
          {
            foreignKeyName: "outfit_availability_outfit_id_fkey";
            columns: ["outfit_id"];
            referencedRelation: "outfits";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── bookings ────────────────────────────────────────────────────────────
      bookings: {
        Row: {
          id: string;
          booking_number: string;
          outfit_id: string;
          renter_id: string;
          owner_id: string;
          event_date: string | null;
          rental_start_date: string;
          rental_end_date: string;
          rental_amount: number;
          security_deposit: number;
          delivery_fee: number;
          service_fee: number;
          total_amount: number;
          status: BookingStatus;
          payment_status: BookingPaymentStatus;
          delivery_address: Json | null;
          booking_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_number?: string;
          outfit_id: string;
          renter_id: string;
          owner_id: string;
          event_date?: string | null;
          rental_start_date: string;
          rental_end_date: string;
          rental_amount: number;
          security_deposit?: number;
          delivery_fee?: number;
          service_fee?: number;
          total_amount: number;
          status?: BookingStatus;
          payment_status?: BookingPaymentStatus;
          delivery_address?: Json | null;
          booking_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_number?: string;
          outfit_id?: string;
          renter_id?: string;
          owner_id?: string;
          event_date?: string | null;
          rental_start_date?: string;
          rental_end_date?: string;
          rental_amount?: number;
          security_deposit?: number;
          delivery_fee?: number;
          service_fee?: number;
          total_amount?: number;
          status?: BookingStatus;
          payment_status?: BookingPaymentStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_outfit_id_fkey";
            columns: ["outfit_id"];
            referencedRelation: "outfits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_renter_id_fkey";
            columns: ["renter_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── booking_status_history ──────────────────────────────────────────────
      booking_status_history: {
        Row: {
          id: string;
          booking_id: string;
          status: string;
          changed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          status: string;
          changed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          status?: string;
          changed_by?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey";
            columns: ["changed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── payments ────────────────────────────────────────────────────────────
      payments: {
        Row: {
          id: string;
          booking_id: string;
          provider: string;
          provider_payment_id: string | null;
          provider_order_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          provider?: string;
          provider_payment_id?: string | null;
          provider_order_id?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          provider?: string;
          provider_payment_id?: string | null;
          provider_order_id?: string | null;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          metadata?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── reviews ─────────────────────────────────────────────────────────────
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          reviewer_id: string;
          reviewee_id: string;
          outfit_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          reviewer_id: string;
          reviewee_id: string;
          outfit_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          outfit_id?: string;
          rating?: number;
          comment?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey";
            columns: ["reviewee_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_outfit_id_fkey";
            columns: ["outfit_id"];
            referencedRelation: "outfits";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── disputes ────────────────────────────────────────────────────────────
      disputes: {
        Row: {
          id: string;
          booking_id: string;
          raised_by: string;
          reason: string;
          description: string | null;
          amount: number | null;
          status: DisputeStatus;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          raised_by: string;
          reason: string;
          description?: string | null;
          amount?: number | null;
          status?: DisputeStatus;
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          raised_by?: string;
          reason?: string;
          description?: string | null;
          amount?: number | null;
          status?: DisputeStatus;
          resolution_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "disputes_raised_by_fkey";
            columns: ["raised_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── wishlists ────────────────────────────────────────────────────────────
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          outfit_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          outfit_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          outfit_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlists_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlists_outfit_id_fkey";
            columns: ["outfit_id"];
            referencedRelation: "outfits";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── inspection_reports ──────────────────────────────────────────────────
      inspection_reports: {
        Row: {
          id: string;
          booking_id: string;
          inspection_type: InspectionType;
          condition_status: ConditionStatus;
          notes: string | null;
          deduction_amount: number;
          created_by: string | null;
          assigned_to: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          inspection_type: InspectionType;
          condition_status: ConditionStatus;
          notes?: string | null;
          deduction_amount?: number;
          created_by?: string | null;
          assigned_to?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          inspection_type?: InspectionType;
          condition_status?: ConditionStatus;
          notes?: string | null;
          deduction_amount?: number;
          created_by?: string | null;
          assigned_to?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inspection_reports_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inspection_reports_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inspection_reports_assigned_to_fkey";
            columns: ["assigned_to"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── owner_applications ──────────────────────────────────────────────────
      owner_applications: {
        Row: {
          id: string;
          user_id: string;
          status: "draft" | "pending" | "approved" | "rejected";
          full_name: string | null;
          email: string | null;
          phone: string | null;
          alt_phone: string | null;
          dob: string | null;
          gender: "female" | "male" | "other" | "prefer_not_to_say" | null;
          bio: string | null;
          phone_verified: boolean;
          otp_code: string | null;
          otp_expires_at: string | null;
          otp_attempts: number;
          id_type: ("aadhaar" | "passport" | "pan" | "driving_license" | "voter_id") | null;
          id_number: string | null;
          id_front_url: string | null;
          id_back_url: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          district: string | null;
          state: string | null;
          pincode: string | null;
          landmark: string | null;
          agreed_to_terms: boolean;
          declaration_accepted: boolean;
          signature_name: string | null;
          agreed_at: string | null;
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: "draft" | "pending" | "approved" | "rejected";
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          alt_phone?: string | null;
          dob?: string | null;
          gender?: ("female" | "male" | "other" | "prefer_not_to_say") | null;
          bio?: string | null;
          phone_verified?: boolean;
          otp_code?: string | null;
          otp_expires_at?: string | null;
          otp_attempts?: number;
          id_type?: ("aadhaar" | "passport" | "pan" | "driving_license" | "voter_id") | null;
          id_number?: string | null;
          id_front_url?: string | null;
          id_back_url?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          district?: string | null;
          state?: string | null;
          pincode?: string | null;
          landmark?: string | null;
          agreed_to_terms?: boolean;
          declaration_accepted?: boolean;
          signature_name?: string | null;
          agreed_at?: string | null;
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: "draft" | "pending" | "approved" | "rejected";
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          alt_phone?: string | null;
          dob?: string | null;
          gender?: ("female" | "male" | "other" | "prefer_not_to_say") | null;
          bio?: string | null;
          phone_verified?: boolean;
          otp_code?: string | null;
          otp_expires_at?: string | null;
          otp_attempts?: number;
          id_type?: ("aadhaar" | "passport" | "pan" | "driving_license" | "voter_id") | null;
          id_number?: string | null;
          id_front_url?: string | null;
          id_back_url?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          district?: string | null;
          state?: string | null;
          pincode?: string | null;
          landmark?: string | null;
          agreed_to_terms?: boolean;
          declaration_accepted?: boolean;
          signature_name?: string | null;
          agreed_at?: string | null;
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          submitted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "owner_applications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "owner_applications_reviewed_by_fkey";
            columns: ["reviewed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── booking_events ───────────────────────────────────────────────────────
      booking_events: {
        Row: {
          id: string;
          booking_id: string;
          status: string;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          status: string;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          status?: string;
          note?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── platform_settings ────────────────────────────────────────────────────
      platform_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;

    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      current_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
      generate_booking_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      promote_to_owner: {
        Args: Record<string, never>;
        Returns: void;
      };
      admin_review_owner_application: {
        Args: {
          p_application_id: string;
          p_action: string;
          p_notes?: string | null;
        };
        Returns: Json;
      };
    };

    Enums: {
      user_role: UserRole;
      verification_status: VerificationStatus;
      gender_type: GenderType;
      outfit_condition: OutfitCondition;
      outfit_status: OutfitStatus;
      outfit_verification_status: OutfitVerificationStatus;
      image_type: ImageType;
      availability_status: AvailabilityStatus;
      booking_status: BookingStatus;
      booking_payment_status: BookingPaymentStatus;
      payment_status: PaymentStatus;
      dispute_status: DisputeStatus;
      inspection_type: InspectionType;
      condition_status: ConditionStatus;
    };

    CompositeTypes: Record<string, never>;
  };
};

// -----------------------------------------------------------------------------
// Convenience row-type aliases — use these throughout the app
// -----------------------------------------------------------------------------
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Outfit = Database["public"]["Tables"]["outfits"]["Row"];
export type OutfitImage = Database["public"]["Tables"]["outfit_images"]["Row"];
export type OutfitMeasurements =
  Database["public"]["Tables"]["outfit_measurements"]["Row"];
export type OutfitAvailability =
  Database["public"]["Tables"]["outfit_availability"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingStatusHistory =
  Database["public"]["Tables"]["booking_status_history"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Dispute = Database["public"]["Tables"]["disputes"]["Row"];

/** Booking event audit log row — from booking_events table (migration 0011) */
export interface BookingEvent {
  id: string;
  booking_id: string;
  status: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

/** Delivery address shape stored as JSONB in bookings.delivery_address */
export interface DeliveryAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
}
export type InspectionReport =
  Database["public"]["Tables"]["inspection_reports"]["Row"];
export type InspectionReportInsert =
  Database["public"]["Tables"]["inspection_reports"]["Insert"];
export type InspectionReportUpdate =
  Database["public"]["Tables"]["inspection_reports"]["Update"];

// Insert / Update helpers
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type OutfitInsert = Database["public"]["Tables"]["outfits"]["Insert"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type DisputeInsert = Database["public"]["Tables"]["disputes"]["Insert"];
export type Wishlist = Database["public"]["Tables"]["wishlists"]["Row"];
export type WishlistInsert = Database["public"]["Tables"]["wishlists"]["Insert"];
export type OwnerApplication =
  Database["public"]["Tables"]["owner_applications"]["Row"];
export type OwnerApplicationInsert =
  Database["public"]["Tables"]["owner_applications"]["Insert"];
export type OwnerApplicationUpdate =
  Database["public"]["Tables"]["owner_applications"]["Update"];
