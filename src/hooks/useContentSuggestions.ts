import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ContentSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'reels' | 'carrossel' | 'stories';
  eventType: string;
  objective: string;
}

export function useContentSuggestions() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Ensure we have a valid session before calling
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente.");
      }

      const { data, error: fnError } = await supabase.functions.invoke("suggest-content", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) {
        // Check for specific error types
        if (fnError.message?.includes("401") || fnError.message?.includes("JWT")) {
          throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }
        throw fnError;
      }

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar sugestões";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshSuggestions = useCallback(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    refreshSuggestions,
  };
}
