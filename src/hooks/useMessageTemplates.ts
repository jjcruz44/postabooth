import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type TemplateCategory = "orcamento" | "follow-up" | "promocao";

export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  category: TemplateCategory;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateInput {
  name: string;
  category: TemplateCategory;
  content: string;
}

const defaultTemplates: Omit<TemplateInput, "category">[] = [
  {
    name: "Primeiro Contato",
    content: "Olá {{nome}}! Tudo bem? Estou entrando em contato sobre seu interesse em nosso serviço de cabine fotográfica para o seu {{evento}}. Podemos conversar?",
  },
  {
    name: "Envio de Orçamento",
    content: "Olá {{nome}}! Segue o orçamento para o seu {{evento}} em {{cidade}}{{data}}. O valor total é {{valor}}. Ficou alguma dúvida?",
  },
  {
    name: "Follow-up",
    content: "Olá {{nome}}! Passando para saber se você teve a oportunidade de analisar nosso orçamento. Estou à disposição para esclarecer qualquer dúvida!",
  },
];

export function useMessageTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates((data as MessageTemplate[]) || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Erro ao carregar templates",
        description: "Não foi possível carregar seus templates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const addTemplate = async (input: TemplateInput): Promise<MessageTemplate | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("message_templates")
        .insert({
          user_id: user.id,
          name: input.name,
          category: input.category,
          content: input.content,
        })
        .select()
        .single();

      if (error) throw error;

      const newTemplate = data as MessageTemplate;
      setTemplates((prev) => [newTemplate, ...prev]);

      toast({
        title: "Template criado!",
        description: `"${input.name}" foi adicionado aos seus templates.`,
      });

      return newTemplate;
    } catch (error) {
      console.error("Error adding template:", error);
      toast({
        title: "Erro ao criar template",
        description: "Não foi possível criar o template.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTemplate = async (id: string, input: Partial<TemplateInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("message_templates")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setTemplates((prev) =>
        prev.map((template) =>
          template.id === id
            ? { ...template, ...input, updated_at: new Date().toISOString() }
            : template
        )
      );

      toast({
        title: "Template atualizado!",
        description: "As alterações foram salvas.",
      });

      return true;
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Erro ao atualizar template",
        description: "Não foi possível atualizar o template.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("message_templates").delete().eq("id", id);

      if (error) throw error;

      setTemplates((prev) => prev.filter((template) => template.id !== id));

      toast({
        title: "Template removido",
        description: "O template foi excluído.",
      });

      return true;
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Erro ao excluir template",
        description: "Não foi possível excluir o template.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getTemplatesByCategory = (category: TemplateCategory) => {
    return templates.filter((template) => template.category === category);
  };

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByCategory,
    refetch: fetchTemplates,
    defaultTemplates,
  };
}
