import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type SavedPostSource = "gerador" | "sugestoes_ia";

export interface SavedPost {
  id: string;
  source: SavedPostSource;
  title: string;
  ideia: string | null;
  short_caption: string | null;
  expanded_text: string | null;
  scheduled_date: string | null;
  created_at: string;
  archived: boolean;
}

export function useSavedPosts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("saved_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedPosts: SavedPost[] = (data || []).map((item) => ({
        id: item.id,
        source: item.source as SavedPostSource,
        title: item.title,
        ideia: item.ideia,
        short_caption: item.short_caption,
        expanded_text: item.expanded_text,
        scheduled_date: item.scheduled_date,
        created_at: item.created_at,
        archived: item.archived,
      }));

      setPosts(mappedPosts);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus posts salvos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const savePost = async (post: {
    source: SavedPostSource;
    title: string;
    ideia?: string;
    short_caption?: string;
    expanded_text?: string;
    scheduled_date?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("saved_posts")
        .insert({
          user_id: user.id,
          source: post.source,
          title: post.title,
          ideia: post.ideia || null,
          short_caption: post.short_caption || null,
          expanded_text: post.expanded_text || null,
          scheduled_date: post.scheduled_date || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newPost: SavedPost = {
        id: data.id,
        source: data.source as SavedPostSource,
        title: data.title,
        ideia: data.ideia,
        short_caption: data.short_caption,
        expanded_text: data.expanded_text,
        scheduled_date: data.scheduled_date,
        created_at: data.created_at,
        archived: data.archived,
      };

      setPosts((prev) => [newPost, ...prev]);
      return newPost;
    } catch (error) {
      console.error("Error saving post:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o post.",
        variant: "destructive",
      });
      return null;
    }
  };

  const archivePost = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("saved_posts")
        .update({ archived: true })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: "Post excluído",
        description: "O post foi removido com sucesso.",
      });
    } catch (error) {
      console.error("Error archiving post:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o post.",
        variant: "destructive",
      });
    }
  };

  return {
    posts,
    loading,
    savePost,
    archivePost,
    refetch: fetchPosts,
  };
}
