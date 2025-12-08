export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'coordinator' | 'agent'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: 'admin' | 'coordinator' | 'agent'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'coordinator' | 'agent'
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          lead_name: string
          phone: string
          email: string | null
          source: 'Email' | 'Google Sheet' | 'Manual' | 'Other'
          created_at: string
          relevance_status: 'ממתין לבדיקה' | 'רלוונטי' | 'לא רלוונטי'
          assigned_agent_id: string | null
          meeting_date: string | null
          status: 'לא תואם' | 'לקוח לא רצה' | 'תואם' | 'עסקה נסגרה' | null
          agent_notes: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          lead_name: string
          phone: string
          email?: string | null
          source: 'Email' | 'Google Sheet' | 'Manual' | 'Other'
          created_at?: string
          relevance_status?: 'ממתין לבדיקה' | 'רלוונטי' | 'לא רלוונטי'
          assigned_agent_id?: string | null
          meeting_date?: string | null
          status?: 'לא תואם' | 'לקוח לא רצה' | 'תואם' | 'עסקה נסגרה' | null
          agent_notes?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          lead_name?: string
          phone?: string
          email?: string | null
          source?: 'Email' | 'Google Sheet' | 'Manual' | 'Other'
          created_at?: string
          relevance_status?: 'ממתין לבדיקה' | 'רלוונטי' | 'לא רלוונטי'
          assigned_agent_id?: string | null
          meeting_date?: string | null
          status?: 'לא תואם' | 'לקוח לא רצה' | 'תואם' | 'עסקה נסגרה' | null
          agent_notes?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      lead_status_enum: 'לא תואם' | 'לקוח לא רצה' | 'תואם' | 'עסקה נסגרה'
      relevance_status_enum: 'ממתין לבדיקה' | 'רלוונטי' | 'לא רלוונטי'
      role_enum: 'admin' | 'coordinator' | 'agent'
      source_enum: 'Email' | 'Google Sheet' | 'Manual' | 'Other'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Lead = Database['public']['Tables']['leads']['Row']
export type Agent = Database['public']['Tables']['agents']['Row']
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']

export type LeadStatus = Database['public']['Enums']['lead_status_enum']
export type RelevanceStatus = Database['public']['Enums']['relevance_status_enum']
export type SourceType = Database['public']['Enums']['source_enum']
export type AgentRole = Database['public']['Enums']['role_enum']