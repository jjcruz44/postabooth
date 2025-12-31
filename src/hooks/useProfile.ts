import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Profile {
  id: string;
  userId: string;
  fullName?: string;
  city?: string;
  services: string[];
  events: string[];
  brandStyle?: string;
  postFrequency?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          id: data.id,
          userId: data.user_id,
          fullName: data.full_name || undefined,
          city: data.city || undefined,
          services: data.services || [],
          events: data.events || [],
          brandStyle: data.brand_style || undefined,
          postFrequency: data.post_frequency || undefined,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Omit<Profile, "id" | "userId">>) => {
    if (!user) return;

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.services !== undefined) dbUpdates.services = updates.services;
      if (updates.events !== undefined) dbUpdates.events = updates.events;
      if (updates.brandStyle !== undefined) dbUpdates.brand_style = updates.brandStyle;
      if (updates.postFrequency !== undefined) dbUpdates.post_frequency = updates.postFrequency;

      const { error } = await supabase
        .from("profiles")
        .update(dbUpdates)
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
      
      toast({
        title: "Salvo!",
        description: "Perfil atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile,
  };
}
