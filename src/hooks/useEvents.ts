import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type EventStatus = "ativo" | "concluido";

export interface Event {
  id: string;
  user_id: string;
  name: string;
  event_date: string;
  event_type: string;
  status: EventStatus;
  notes: string | null;
  contract_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  event_id: string;
  user_id: string;
  phase: "pre" | "during" | "post";
  text: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export const useEvents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents((data || []) as Event[]);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const createEvent = async (eventData: {
    name: string;
    event_date: string;
    event_type: string;
    notes?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("events")
        .insert({
          user_id: user.id,
          name: eventData.name,
          event_date: eventData.event_date,
          event_type: eventData.event_type,
          notes: eventData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setEvents((prev) => [...prev, data as Event]);
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso!",
      });
      return data;
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEvent = async (
    eventId: string,
    eventData: {
      name?: string;
      event_date?: string;
      event_type?: string;
      status?: EventStatus;
      notes?: string;
    }
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, ...eventData } : e))
      );
      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso!",
      });
      return true;
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o evento.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast({
        title: "Sucesso",
        description: "Evento excluído com sucesso!",
      });
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};

export const useChecklistItems = (eventId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    if (!user || !eventId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .order("position", { ascending: true });

      if (error) throw error;
      setItems((data || []) as ChecklistItem[]);
    } catch (error) {
      console.error("Error fetching checklist items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchItems();
    } else {
      setItems([]);
    }
  }, [eventId, user]);

  const addItem = async (phase: "pre" | "during" | "post", text: string) => {
    if (!user || !eventId) return null;

    // Calculate next position for this phase
    const phaseItems = items.filter((i) => i.phase === phase);
    const nextPosition = phaseItems.length > 0 
      ? Math.max(...phaseItems.map((i) => i.position)) + 1 
      : 0;

    try {
      const { data, error } = await supabase
        .from("checklist_items")
        .insert({
          event_id: eventId,
          user_id: user.id,
          phase,
          text,
          completed: false,
          position: nextPosition,
        })
        .select()
        .single();

      if (error) throw error;

      setItems((prev) => [...prev, data as ChecklistItem]);
      return data;
    } catch (error) {
      console.error("Error adding checklist item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateItem = async (
    itemId: string,
    updates: { text?: string; completed?: boolean }
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("checklist_items")
        .update(updates)
        .eq("id", itemId)
        .eq("user_id", user.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      );
      return true;
    } catch (error) {
      console.error("Error updating checklist item:", error);
      return false;
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("checklist_items")
        .delete()
        .eq("id", itemId)
        .eq("user_id", user.id);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      return true;
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleItem = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return false;
    return updateItem(itemId, { completed: !item.completed });
  };

  const moveItem = async (itemId: string, direction: "up" | "down") => {
    const item = items.find((i) => i.id === itemId);
    if (!item || !user) return false;

    const phaseItems = items
      .filter((i) => i.phase === item.phase)
      .sort((a, b) => a.position - b.position);
    
    const currentIndex = phaseItems.findIndex((i) => i.id === itemId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= phaseItems.length) return false;

    const targetItem = phaseItems[targetIndex];

    try {
      // Swap positions
      await supabase
        .from("checklist_items")
        .update({ position: targetItem.position })
        .eq("id", item.id)
        .eq("user_id", user.id);

      await supabase
        .from("checklist_items")
        .update({ position: item.position })
        .eq("id", targetItem.id)
        .eq("user_id", user.id);

      // Update local state
      setItems((prev) =>
        prev.map((i) => {
          if (i.id === item.id) return { ...i, position: targetItem.position };
          if (i.id === targetItem.id) return { ...i, position: item.position };
          return i;
        })
      );

      return true;
    } catch (error) {
      console.error("Error moving checklist item:", error);
      return false;
    }
  };

  const deleteAllItems = async () => {
    if (!user || !eventId) return false;

    try {
      const { error } = await supabase
        .from("checklist_items")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;

      setItems([]);
      return true;
    } catch (error) {
      console.error("Error deleting all checklist items:", error);
      return false;
    }
  };

  const addBulkItems = async (
    itemsToAdd: { phase: "pre" | "during" | "post"; text: string }[]
  ) => {
    if (!user || !eventId || itemsToAdd.length === 0) return false;

    try {
      // Calculate starting positions for each phase
      const existingPositions: Record<string, number> = {
        pre: items.filter((i) => i.phase === "pre").length,
        during: items.filter((i) => i.phase === "during").length,
        post: items.filter((i) => i.phase === "post").length,
      };

      const newItems = itemsToAdd.map((item, index) => {
        const position = existingPositions[item.phase];
        existingPositions[item.phase]++;
        return {
          event_id: eventId,
          user_id: user.id,
          phase: item.phase,
          text: item.text,
          completed: false,
          position,
        };
      });

      const { data, error } = await supabase
        .from("checklist_items")
        .insert(newItems)
        .select();

      if (error) throw error;

      setItems((prev) => [...prev, ...(data as ChecklistItem[])]);
      return true;
    } catch (error) {
      console.error("Error adding bulk checklist items:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar os itens.",
        variant: "destructive",
      });
      return false;
    }
  };

  const copyFromEvent = async (sourceEventId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("checklist_items")
        .select("phase, text, position")
        .eq("event_id", sourceEventId)
        .eq("user_id", user.id)
        .order("position", { ascending: true });

      if (error) throw error;

      return (data || []).map((item) => ({
        phase: item.phase as "pre" | "during" | "post",
        text: item.text,
      }));
    } catch (error) {
      console.error("Error fetching source event items:", error);
      return null;
    }
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    moveItem,
    deleteAllItems,
    addBulkItems,
    copyFromEvent,
    refetch: fetchItems,
  };
};
