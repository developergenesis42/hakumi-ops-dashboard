import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database type definition - this should match your Supabase schema
export type Database = {
  public: {
    Tables: {
      therapists: {
        Row: {
          id: string;
          name: string;
          status: 'inactive' | 'available' | 'in-session' | 'departed';
          total_earnings: number;
          total_sessions: number;
          check_in_time?: string;
          departure_time?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: 'inactive' | 'available' | 'in-session' | 'departed';
          total_earnings?: number;
          total_sessions?: number;
          check_in_time?: string;
          departure_time?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: 'inactive' | 'available' | 'in-session' | 'departed';
          total_earnings?: number;
          total_sessions?: number;
          check_in_time?: string;
          departure_time?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          type: 'Shower' | 'VIP Jacuzzi' | 'Double Bed Shower (large)' | 'Single Bed Shower (large)';
          status: 'available' | 'occupied';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'Shower' | 'VIP Jacuzzi' | 'Double Bed Shower (large)' | 'Single Bed Shower (large)';
          status?: 'available' | 'occupied';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'Shower' | 'VIP Jacuzzi' | 'Double Bed Shower (large)' | 'Single Bed Shower (large)';
          status?: 'available' | 'occupied';
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          category: 'Single' | 'Double' | 'Couple';
          room_type: 'Shower' | 'VIP Jacuzzi' | 'Double Bed Shower (large)' | 'Single Bed Shower (large)';
          duration: number;
          price: number;
          lady_payout: number;
          shop_revenue: number;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: 'Single' | 'Double' | 'Couple';
          room_type: 'Shower' | 'VIP Jacuzzi' | 'Double Bed Shower (large)' | 'Single Bed Shower (large)';
          duration: number;
          price: number;
          lady_payout: number;
          shop_revenue: number;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: 'Single' | 'Double' | 'Couple';
          room_type?: 'Shower' | 'VIP Jacuzzi' | 'Double Bed Shower (large)' | 'Single Bed Shower (large)';
          duration?: number;
          price?: number;
          lady_payout?: number;
          shop_revenue?: number;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          therapist_ids: string[];
          service_id: string;
          room_id: string;
          start_time: string;
          end_time: string;
          discount: number;
          total_price: number;
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
          session_start_time?: string;
          prep_start_time?: string;
          is_in_prep_phase?: boolean;
          actual_end_time?: string;
          actual_duration?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          therapist_ids: string[];
          service_id: string;
          room_id: string;
          start_time: string;
          end_time: string;
          discount?: number;
          total_price: number;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
          session_start_time?: string;
          prep_start_time?: string;
          is_in_prep_phase?: boolean;
          actual_end_time?: string;
          actual_duration?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          therapist_ids?: string[];
          service_id?: string;
          room_id?: string;
          start_time?: string;
          end_time?: string;
          discount?: number;
          total_price?: number;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
          session_start_time?: string;
          prep_start_time?: string;
          is_in_prep_phase?: boolean;
          actual_end_time?: string;
          actual_duration?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          therapist_id: string;
          type: 'Condom 12' | 'Condom 24' | 'Condom 36' | 'Condom 48' | 'Lube' | 'Towel' | 'Other';
          amount: number;
          description?: string;
          timestamp: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          type: 'Condom 12' | 'Condom 24' | 'Condom 36' | 'Condom 48' | 'Lube' | 'Towel' | 'Other';
          amount: number;
          description?: string;
          timestamp: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          therapist_id?: string;
          type?: 'Condom 12' | 'Condom 24' | 'Condom 36' | 'Condom 48' | 'Lube' | 'Towel' | 'Other';
          amount?: number;
          description?: string;
          timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      walk_outs: {
        Row: {
          id: string;
          session_id: string;
          therapist_ids: string[];
          service_id?: string;
          total_amount: number;
          timestamp: string;
          count?: number;
          reason: 'No Rooms' | 'No Ladies' | 'Price Too High' | 'Client Too Picky' | 'Chinese' | 'Laowai';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          therapist_ids: string[];
          service_id?: string;
          total_amount: number;
          timestamp: string;
          count?: number;
          reason: 'No Rooms' | 'No Ladies' | 'Price Too High' | 'Client Too Picky' | 'Chinese' | 'Laowai';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          therapist_ids?: string[];
          service_id?: string;
          total_amount?: number;
          timestamp?: string;
          count?: number;
          reason?: 'No Rooms' | 'No Ladies' | 'Price Too High' | 'Client Too Picky' | 'Chinese' | 'Laowai';
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_stats: {
        Row: {
          id: string;
          date: string;
          total_slips: number;
          total_revenue: number;
          total_payouts: number;
          total_discounts: number;
          shop_revenue: number;
          walk_out_count: number;
          completed_sessions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          total_slips?: number;
          total_revenue?: number;
          total_payouts?: number;
          total_discounts?: number;
          shop_revenue?: number;
          walk_out_count?: number;
          completed_sessions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          total_slips?: number;
          total_revenue?: number;
          total_payouts?: number;
          total_discounts?: number;
          shop_revenue?: number;
          walk_out_count?: number;
          completed_sessions?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};