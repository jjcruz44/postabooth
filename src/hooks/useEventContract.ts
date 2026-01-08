import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useEventContract = (eventId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadContract = async (file: File): Promise<string | null> => {
    if (!user || !eventId) return null;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        title: "Formato inválido",
        description: "Apenas arquivos PDF são permitidos.",
        variant: "destructive",
      });
      return null;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);

    try {
      // Create unique file path: user_id/event_id/filename
      const fileExt = file.name.split(".").pop();
      const fileName = `contrato_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${eventId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update event with contract URL
      const { error: updateError } = await supabase
        .from("events")
        .update({ contract_url: filePath })
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Contrato enviado com sucesso!",
      });

      return filePath;
    } catch (error) {
      console.error("Error uploading contract:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o contrato.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteContract = async (contractUrl: string): Promise<boolean> => {
    if (!user || !eventId) return false;

    try {
      // Delete from storage
      const { error: deleteStorageError } = await supabase.storage
        .from("contracts")
        .remove([contractUrl]);

      if (deleteStorageError) throw deleteStorageError;

      // Update event to remove contract URL
      const { error: updateError } = await supabase
        .from("events")
        .update({ contract_url: null })
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Contrato removido com sucesso!",
      });

      return true;
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o contrato.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getContractUrl = async (contractPath: string): Promise<string | null> => {
    if (!contractPath) return null;

    try {
      const { data, error } = await supabase.storage
        .from("contracts")
        .createSignedUrl(contractPath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error("Error getting contract URL:", error);
      return null;
    }
  };

  const getContractFileName = (contractPath: string | null): string => {
    if (!contractPath) return "";
    const parts = contractPath.split("/");
    return parts[parts.length - 1] || "contrato.pdf";
  };

  return {
    uploading,
    uploadContract,
    deleteContract,
    getContractUrl,
    getContractFileName,
  };
};
