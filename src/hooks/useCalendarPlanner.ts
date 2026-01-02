import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CalendarDay {
  day: number;
  category: string;
  objective: string;
  idea: string;
}

export function useCalendarPlanner() {
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCalendar = useCallback(async (monthlyGoal: string) => {
    setLoading(true);
    setError(null);
    setCalendar([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Você precisa estar logado para gerar o calendário");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-calendar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ monthlyGoal }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar calendário");
      }

      setCalendar(data.calendar);
      return data.calendar;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCalendar = useCallback(() => {
    setCalendar([]);
    setError(null);
  }, []);

  return {
    calendar,
    loading,
    error,
    generateCalendar,
    clearCalendar,
  };
}
