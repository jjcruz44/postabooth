import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type AccessPhase = "full_access" | "warning" | "limited";

export interface AccessLimits {
  maxActiveEvents: number;
  maxTasksPerEvent: number;
  maxLeads: number;
  maxContentsPerMonth: number;
  canUploadContracts: boolean;
  canExport: boolean;
}

export interface AccessPhaseInfo {
  phase: AccessPhase;
  daysRemaining: number;
  daysSinceCreation: number;
  limits: AccessLimits;
  message: string | null;
  isPro: boolean;
}

const FULL_ACCESS_DAYS = 30;
const WARNING_DAYS = 15;
const TOTAL_GRACE_PERIOD = FULL_ACCESS_DAYS + WARNING_DAYS; // 45 days

const PRO_LIMITS: AccessLimits = {
  maxActiveEvents: Infinity,
  maxTasksPerEvent: Infinity,
  maxLeads: Infinity,
  maxContentsPerMonth: Infinity,
  canUploadContracts: true,
  canExport: true,
};

const FREE_LIMITS: AccessLimits = {
  maxActiveEvents: 3,
  maxTasksPerEvent: 5,
  maxLeads: 10,
  maxContentsPerMonth: 5,
  canUploadContracts: false,
  canExport: false,
};

export function useAccessPhase(): AccessPhaseInfo {
  const { user, isPremiumUser } = useAuth();

  return useMemo(() => {
    // Premium users always have full access
    if (isPremiumUser) {
      return {
        phase: "full_access" as AccessPhase,
        daysRemaining: Infinity,
        daysSinceCreation: 0,
        limits: PRO_LIMITS,
        message: null,
        isPro: true,
      };
    }

    // If no user, return limited access
    if (!user) {
      return {
        phase: "limited" as AccessPhase,
        daysRemaining: 0,
        daysSinceCreation: 0,
        limits: FREE_LIMITS,
        message: null,
        isPro: false,
      };
    }

    // Calculate days since account creation
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const diffTime = now.getTime() - createdAt.getTime();
    const daysSinceCreation = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Phase 1: Full Access (0-30 days)
    if (daysSinceCreation <= FULL_ACCESS_DAYS) {
      const daysRemaining = FULL_ACCESS_DAYS - daysSinceCreation;
      return {
        phase: "full_access" as AccessPhase,
        daysRemaining,
        daysSinceCreation,
        limits: PRO_LIMITS,
        message: `Você está utilizando recursos do Plano Pro durante o período de acesso completo. ${daysRemaining} dias restantes.`,
        isPro: false,
      };
    }

    // Phase 2: Warning (31-45 days)
    if (daysSinceCreation <= TOTAL_GRACE_PERIOD) {
      const daysRemaining = TOTAL_GRACE_PERIOD - daysSinceCreation;
      return {
        phase: "warning" as AccessPhase,
        daysRemaining,
        daysSinceCreation,
        limits: PRO_LIMITS,
        message: `Em breve o plano gratuito terá limites. Faça upgrade para manter acesso completo. ${daysRemaining} dias restantes.`,
        isPro: false,
      };
    }

    // Phase 3: Limited (after 45 days)
    return {
      phase: "limited" as AccessPhase,
      daysRemaining: 0,
      daysSinceCreation,
      limits: FREE_LIMITS,
      message: null,
      isPro: false,
    };
  }, [user, isPremiumUser]);
}

// Helper to check if user can perform action
export function useCanPerformAction() {
  const { limits, isPro } = useAccessPhase();

  return {
    canAddEvent: (currentActiveEvents: number) => 
      isPro || currentActiveEvents < limits.maxActiveEvents,
    canAddTask: (currentTasksInEvent: number) => 
      isPro || currentTasksInEvent < limits.maxTasksPerEvent,
    canAddLead: (currentLeads: number) => 
      isPro || currentLeads < limits.maxLeads,
    canAddContent: (currentMonthContents: number) => 
      isPro || currentMonthContents < limits.maxContentsPerMonth,
    canUploadContract: () => limits.canUploadContracts,
    canExport: () => limits.canExport,
    limits,
    isPro,
  };
}
