import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CalendarDay {
  day: number;
  weekday: string;
  date: string;
  category: string;
  objective: string;
  idea: string;
  title: string;
  roteiro: string;
  legenda: string;
}

export interface PlannerFilters {
  postingFrequency: number;
  postingDays: string[];
  contentFocus: string;
  monthObjective: string;
}

interface MonthlyPlanner {
  id: string;
  monthly_goal: string;
  calendar_data: CalendarDay[];
  posting_frequency: number;
  posting_days: string[];
  content_focus: string;
  month_objective: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_FILTERS: PlannerFilters = {
  postingFrequency: 3,
  postingDays: ["segunda", "quarta", "sexta"],
  contentFocus: "Aleatório",
  monthObjective: "",
};

export function useCalendarPlanner() {
  const { user } = useAuth();
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [filters, setFilters] = useState<PlannerFilters>(DEFAULT_FILTERS);
  const [plannerId, setPlannerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing planner on mount
  useEffect(() => {
    if (!user) {
      setInitialLoading(false);
      return;
    }

    const loadPlanner = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("monthly_planners")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          const plannerData = data as unknown as MonthlyPlanner;
          setCalendar(plannerData.calendar_data || []);
          setFilters({
            postingFrequency: plannerData.posting_frequency || 3,
            postingDays: plannerData.posting_days || ["segunda", "quarta", "sexta"],
            contentFocus: plannerData.content_focus || "Aleatório",
            monthObjective: plannerData.month_objective || plannerData.monthly_goal || "",
          });
          setPlannerId(plannerData.id);
        }
      } catch (err) {
        console.error("Error loading planner:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadPlanner();
  }, [user]);

  const generateCalendar = useCallback(async (newFilters: PlannerFilters) => {
    if (!user) {
      throw new Error("Você precisa estar logado para gerar o calendário");
    }

    if (!newFilters.monthObjective.trim()) {
      throw new Error("O objetivo do mês é obrigatório");
    }

    if (newFilters.postingDays.length === 0) {
      throw new Error("Selecione pelo menos um dia da semana");
    }

    setLoading(true);
    setError(null);

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
          body: JSON.stringify({
            postingFrequency: newFilters.postingFrequency,
            postingDays: newFilters.postingDays,
            contentFocus: newFilters.contentFocus,
            monthObjective: newFilters.monthObjective,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar calendário");
      }

      const newCalendar = data.calendar as CalendarDay[];

      // Save to database
      if (plannerId) {
        const { error: updateError } = await supabase
          .from("monthly_planners")
          .update({
            monthly_goal: newFilters.monthObjective,
            calendar_data: newCalendar as unknown as never,
            posting_frequency: newFilters.postingFrequency,
            posting_days: newFilters.postingDays,
            content_focus: newFilters.contentFocus,
            month_objective: newFilters.monthObjective,
          })
          .eq("id", plannerId);

        if (updateError) throw updateError;
      } else {
        const { data: newPlanner, error: insertError } = await supabase
          .from("monthly_planners")
          .insert([{
            user_id: user.id,
            monthly_goal: newFilters.monthObjective,
            calendar_data: newCalendar as unknown as never,
            posting_frequency: newFilters.postingFrequency,
            posting_days: newFilters.postingDays,
            content_focus: newFilters.contentFocus,
            month_objective: newFilters.monthObjective,
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setPlannerId(newPlanner.id);
      }

      setCalendar(newCalendar);
      setFilters(newFilters);
      return newCalendar;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, plannerId]);

  const clearCalendar = useCallback(() => {
    setCalendar([]);
    setFilters(DEFAULT_FILTERS);
    setError(null);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<PlannerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    calendar,
    filters,
    loading,
    initialLoading,
    error,
    generateCalendar,
    clearCalendar,
    updateFilters,
  };
}
