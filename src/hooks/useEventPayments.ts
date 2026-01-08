import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface EventPayment {
  id: string;
  event_id: string;
  user_id: string;
  total_value: number;
  received_value: number;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = "pendente" | "quitado";

export const useEventPayments = (eventId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payment, setPayment] = useState<EventPayment | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPayment = async () => {
    if (!user || !eventId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_payments")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setPayment(data);
    } catch (error) {
      console.error("Error fetching event payment:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchPayment();
    } else {
      setPayment(null);
    }
  }, [eventId, user]);

  const createOrUpdatePayment = async (data: {
    total_value: number;
    received_value: number;
  }) => {
    if (!user || !eventId) return null;

    try {
      if (payment) {
        // Update existing payment
        const { data: updated, error } = await supabase
          .from("event_payments")
          .update({
            total_value: data.total_value,
            received_value: data.received_value,
          })
          .eq("id", payment.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        setPayment(updated);
        return updated;
      } else {
        // Create new payment
        const { data: created, error } = await supabase
          .from("event_payments")
          .insert({
            event_id: eventId,
            user_id: user.id,
            total_value: data.total_value,
            received_value: data.received_value,
          })
          .select()
          .single();

        if (error) throw error;
        setPayment(created);
        return created;
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o pagamento.",
        variant: "destructive",
      });
      return null;
    }
  };

  const getPaymentStatus = (): PaymentStatus => {
    if (!payment) return "pendente";
    return payment.received_value >= payment.total_value ? "quitado" : "pendente";
  };

  const getPendingValue = (): number => {
    if (!payment) return 0;
    return Math.max(0, payment.total_value - payment.received_value);
  };

  return {
    payment,
    loading,
    createOrUpdatePayment,
    getPaymentStatus,
    getPendingValue,
    refetch: fetchPayment,
  };
};
