import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CalendarDay {
  day: number;
  category: string;
  objective: string;
  idea: string;
}

interface MonthlyPlanner {
  id: string;
  monthly_goal: string;
  calendar_data: CalendarDay[];
  created_at: string;
  updated_at: string;
}

export function useCalendarPlanner() {
  const { user } = useAuth();
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState("");
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
          setCalendar(plannerData.calendar_data);
          setMonthlyGoal(plannerData.monthly_goal);
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

  const generateCalendar = useCallback(async (goal: string) => {
    if (!user) {
      throw new Error("Você precisa estar logado para gerar o calendário");
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
          body: JSON.stringify({ monthlyGoal: goal }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar calendário");
      }

      const newCalendar = data.calendar as CalendarDay[];

      // Save to database
      if (plannerId) {
        // Update existing planner
        const { error: updateError } = await supabase
          .from("monthly_planners")
          .update({
            monthly_goal: goal,
            calendar_data: newCalendar as unknown as never,
          })
          .eq("id", plannerId);

        if (updateError) throw updateError;
      } else {
        // Create new planner
        const { data: newPlanner, error: insertError } = await supabase
          .from("monthly_planners")
          .insert([{
            user_id: user.id,
            monthly_goal: goal,
            calendar_data: newCalendar as unknown as never,
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setPlannerId(newPlanner.id);
      }

      setCalendar(newCalendar);
      setMonthlyGoal(goal);
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
    setMonthlyGoal("");
    setError(null);
    // Keep plannerId so we can update when generating new calendar
  }, []);

  return {
    calendar,
    monthlyGoal,
    loading,
    initialLoading,
    error,
    generateCalendar,
    clearCalendar,
  };
}
