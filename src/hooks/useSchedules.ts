import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type ScheduleStatus = "scheduled" | "completed" | "cancelled";

export interface Schedule {
  id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledTime?: string;
  status: ScheduleStatus;
  contentId?: string;
  createdAt: string;
}

export function useSchedules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!user) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;

      const mappedSchedules: Schedule[] = (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || undefined,
        scheduledDate: item.scheduled_date,
        scheduledTime: item.scheduled_time || undefined,
        status: item.status as ScheduleStatus,
        contentId: item.content_id || undefined,
        createdAt: item.created_at,
      }));

      setSchedules(mappedSchedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus agendamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addSchedule = async (schedule: Omit<Schedule, "id" | "createdAt">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("schedules")
        .insert({
          user_id: user.id,
          title: schedule.title,
          description: schedule.description,
          scheduled_date: schedule.scheduledDate,
          scheduled_time: schedule.scheduledTime,
          status: schedule.status,
          content_id: schedule.contentId,
        })
        .select()
        .single();

      if (error) throw error;

      const newSchedule: Schedule = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        scheduledDate: data.scheduled_date,
        scheduledTime: data.scheduled_time || undefined,
        status: data.status as ScheduleStatus,
        contentId: data.content_id || undefined,
        createdAt: data.created_at,
      };

      setSchedules((prev) => [...prev, newSchedule].sort((a, b) => 
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      ));

      toast({
        title: "Agendado!",
        description: "Conteúdo agendado com sucesso.",
      });

      return newSchedule;
    } catch (error) {
      console.error("Error adding schedule:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    if (!user) return;

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;
      if (updates.scheduledTime !== undefined) dbUpdates.scheduled_time = updates.scheduledTime;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.contentId !== undefined) dbUpdates.content_id = updates.contentId;

      const { error } = await supabase
        .from("schedules")
        .update(dbUpdates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o agendamento.",
        variant: "destructive",
      });
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setSchedules((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: "Excluído",
        description: "Agendamento excluído com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    }
  };

  const getSchedulesByDate = (date: string) => {
    return schedules.filter((s) => s.scheduledDate === date);
  };

  const getOccupiedTimes = (date: string) => {
    return schedules
      .filter((s) => s.scheduledDate === date && s.scheduledTime)
      .map((s) => s.scheduledTime!);
  };

  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesByDate,
    getOccupiedTimes,
    refetch: fetchSchedules,
  };
}
