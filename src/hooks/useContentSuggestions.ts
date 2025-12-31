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
      console.log("Fetching AI suggestions...");
      
      const { data, error: fnError } = await supabase.functions.invoke("suggest-content");

      if (fnError) {
        console.error("Function invoke error:", fnError);
        throw new Error(fnError.message || "Erro ao chamar função");
      }

      // Handle error response from the function (always returns 200 with error field)
      if (data?.error) {
        console.warn("Function returned error:", data.error);
        setError(data.error);
        setSuggestions(data.suggestions || []);
        toast({
          title: "Aviso",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        console.log("Suggestions received:", data.suggestions.length);
        setSuggestions(data.suggestions);
      } else {
        console.warn("No suggestions in response:", data);
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar sugestões";
      setError(errorMessage);
      setSuggestions([]);
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
