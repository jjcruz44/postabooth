import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function useLogoUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Tipo de arquivo não permitido. Use PNG, JPEG ou WebP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Arquivo muito grande. O tamanho máximo é 2MB.";
    }
    return null;
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer upload.",
        variant: "destructive",
      });
      return null;
    }

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Arquivo inválido",
        description: validationError,
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}/logo-${timestamp}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(fileName);

      // Update profile with new logo URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ logo_url: urlData.publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Logo atualizado!",
        description: "Seu logo foi salvo com sucesso.",
      });

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload do logo.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async (currentLogoUrl?: string): Promise<boolean> => {
    if (!user) return false;

    setUploading(true);

    try {
      // Update profile to remove logo URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ logo_url: null })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Try to delete the old file from storage
      if (currentLogoUrl) {
        try {
          const url = new URL(currentLogoUrl);
          const pathParts = url.pathname.split("/logos/");
          if (pathParts.length > 1) {
            await supabase.storage.from("logos").remove([pathParts[1]]);
          }
        } catch {
          // Ignore deletion errors - file might not exist
        }
      }

      toast({
        title: "Logo removido",
        description: "Seu logo foi removido com sucesso.",
      });

      return true;
    } catch (error) {
      console.error("Error removing logo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o logo.",
        variant: "destructive",
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadLogo,
    removeLogo,
    uploading,
    validateFile,
  };
}
