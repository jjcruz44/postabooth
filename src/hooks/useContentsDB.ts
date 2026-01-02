import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type ContentStatus = "ideia" | "producao" | "pronto" | "publicado";
export type ContentType = "reels" | "carrossel" | "stories";

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  objective?: string;
  eventType?: string;
  date?: string;
  roteiro?: string;
  legenda?: string;
  cta?: string;
  hashtags?: string[];
  createdAt: string;
}

export function useContentsDB() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContents = useCallback(async () => {
    if (!user) {
      setContents([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedContents: ContentItem[] = (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type as ContentType,
        status: item.status as ContentStatus,
        objective: item.objective || undefined,
        eventType: item.event_type || undefined,
        date: item.scheduled_date || new Date().toISOString().split("T")[0],
        roteiro: item.roteiro || undefined,
        legenda: item.legenda || undefined,
        cta: item.cta || undefined,
        hashtags: item.hashtags || undefined,
        createdAt: item.created_at,
      }));

      setContents(mappedContents);
    } catch (error) {
      console.error("Error fetching contents:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus conteúdos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const addContent = async (content: Omit<ContentItem, "id" | "createdAt">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("contents")
        .insert({
          user_id: user.id,
          title: content.title,
          type: content.type,
          status: content.status,
          objective: content.objective,
          event_type: content.eventType,
          scheduled_date: content.date,
          roteiro: content.roteiro,
          legenda: content.legenda,
          cta: content.cta,
          hashtags: content.hashtags,
        })
        .select()
        .single();

      if (error) throw error;

      const newContent: ContentItem = {
        id: data.id,
        title: data.title,
        type: data.type as ContentType,
        status: data.status as ContentStatus,
        objective: data.objective || undefined,
        eventType: data.event_type || undefined,
        date: data.scheduled_date || new Date().toISOString().split("T")[0],
        roteiro: data.roteiro || undefined,
        legenda: data.legenda || undefined,
        cta: data.cta || undefined,
        hashtags: data.hashtags || undefined,
        createdAt: data.created_at,
      };

      setContents((prev) => [newContent, ...prev]);
      return newContent;
    } catch (error) {
      console.error("Error adding content:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o conteúdo.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateContent = async (id: string, updates: Partial<ContentItem>) => {
    if (!user) return;

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.objective !== undefined) dbUpdates.objective = updates.objective;
      if (updates.eventType !== undefined) dbUpdates.event_type = updates.eventType;
      if (updates.date !== undefined) dbUpdates.scheduled_date = updates.date;
      if (updates.roteiro !== undefined) dbUpdates.roteiro = updates.roteiro;
      if (updates.legenda !== undefined) dbUpdates.legenda = updates.legenda;
      if (updates.cta !== undefined) dbUpdates.cta = updates.cta;
      if (updates.hashtags !== undefined) dbUpdates.hashtags = updates.hashtags;

      const { error } = await supabase
        .from("contents")
        .update(dbUpdates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setContents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    } catch (error) {
      console.error("Error updating content:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o conteúdo.",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (id: string, status: ContentStatus) => {
    await updateContent(id, { status });
  };

  const deleteContent = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("contents")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setContents((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "Excluído",
        description: "Conteúdo excluído com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o conteúdo.",
        variant: "destructive",
      });
    }
  };

  const getContentsByDate = (date: string) => {
    return contents.filter((c) => c.date === date);
  };

  const getContentsByStatus = (status: ContentStatus) => {
    return contents.filter((c) => c.status === status);
  };

  const stats = {
    ideia: contents.filter((c) => c.status === "ideia").length,
    producao: contents.filter((c) => c.status === "producao").length,
    pronto: contents.filter((c) => c.status === "pronto").length,
    publicado: contents.filter((c) => c.status === "publicado").length,
    total: contents.length,
  };

  return {
    contents,
    loading,
    addContent,
    updateContent,
    updateStatus,
    deleteContent,
    getContentsByDate,
    getContentsByStatus,
    stats,
    refetch: fetchContents,
  };
}
