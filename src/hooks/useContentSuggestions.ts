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
      const { data, error: fnError } = await supabase.functions.invoke("suggest-content");

      if (fnError) throw fnError;

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
