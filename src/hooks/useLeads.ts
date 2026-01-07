import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type LeadStage = "quente" | "morno" | "frio";
export type LeadStatus = "lead" | "cliente" | "perdido";

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  event_type: string | null;
  event_date: string | null;
  event_city: string | null;
  stage: LeadStage;
  lead_status: LeadStatus;
  budget_sent: boolean;
  budget_value: number | null;
  packages_requested: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadInput {
  name: string;
  phone?: string;
  email?: string;
  event_type?: string;
  event_date?: string;
  event_city?: string;
  stage?: LeadStage;
  lead_status?: LeadStatus;
  budget_sent?: boolean;
  budget_value?: number;
  packages_requested?: string[];
  notes?: string;
}

export function useLeads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads((data as Lead[]) || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Erro ao carregar leads",
        description: "Não foi possível carregar seus leads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const addLead = async (input: LeadInput): Promise<Lead | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          user_id: user.id,
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
          event_type: input.event_type || null,
          event_date: input.event_date || null,
          event_city: input.event_city || null,
          stage: input.stage || "morno",
          lead_status: input.lead_status || "lead",
          budget_sent: input.budget_sent || false,
          budget_value: input.budget_value || null,
          packages_requested: input.packages_requested || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newLead = data as Lead;
      setLeads((prev) => [newLead, ...prev]);
      
      toast({
        title: "Lead adicionado!",
        description: `${input.name} foi adicionado à sua lista.`,
      });

      return newLead;
    } catch (error) {
      console.error("Error adding lead:", error);
      toast({
        title: "Erro ao adicionar lead",
        description: "Não foi possível adicionar o lead.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateLead = async (id: string, input: Partial<LeadInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id ? { ...lead, ...input, updated_at: new Date().toISOString() } : lead
        )
      );

      toast({
        title: "Lead atualizado!",
        description: "As informações foram salvas.",
      });

      return true;
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Erro ao atualizar lead",
        description: "Não foi possível atualizar o lead.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteLead = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);

      if (error) throw error;

      setLeads((prev) => prev.filter((lead) => lead.id !== id));

      toast({
        title: "Lead removido",
        description: "O lead foi excluído da sua lista.",
      });

      return true;
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Erro ao excluir lead",
        description: "Não foi possível excluir o lead.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateStage = async (id: string, stage: LeadStage): Promise<boolean> => {
    return updateLead(id, { stage });
  };

  const updateLeadStatus = async (id: string, lead_status: LeadStatus): Promise<boolean> => {
    return updateLead(id, { lead_status });
  };

  const getLeadsByStage = (stage: LeadStage) => {
    return leads.filter((lead) => lead.stage === stage);
  };

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.lead_status === status);
  };

  const stats = {
    total: leads.length,
    quente: leads.filter((l) => l.stage === "quente").length,
    morno: leads.filter((l) => l.stage === "morno").length,
    frio: leads.filter((l) => l.stage === "frio").length,
    budgetSent: leads.filter((l) => l.budget_sent).length,
    leads: leads.filter((l) => l.lead_status === "lead").length,
    clientes: leads.filter((l) => l.lead_status === "cliente").length,
    perdidos: leads.filter((l) => l.lead_status === "perdido").length,
  };

  return {
    leads,
    loading,
    addLead,
    updateLead,
    deleteLead,
    updateStage,
    updateLeadStatus,
    getLeadsByStage,
    getLeadsByStatus,
    stats,
    refetch: fetchLeads,
  };
}
