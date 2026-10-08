export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  category?: string;
  summary?: string | null;
  published_at: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      news_articles: {
        Row: {
          id: string;
          title: string;
          url: string;
          source: string;
          category: string;
          summary: string | null;
          published_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          url: string;
          source: string;
          category?: string;
          summary?: string | null;
          published_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          url?: string;
          source?: string;
          category?: string;
          summary?: string | null;
          published_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
