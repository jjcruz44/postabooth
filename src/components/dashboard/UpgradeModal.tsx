import { Crown, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccessPhase } from "@/hooks/useAccessPhase";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockedFeature?: string;
}

const proFeatures = [
  "Eventos ilimitados",
  "Tarefas ilimitadas por evento",
  "Leads ilimitados",
  "Conteúdos ilimitados",
  "Upload de contratos PDF",
  "Exportação de dados",
  "Planejamento mensal avançado",
  "Suporte prioritário",
];

const freeFeatures = [
  { feature: "Máximo de 3 eventos ativos", included: true },
  { feature: "Máximo de 5 tarefas por evento", included: true },
  { feature: "Máximo de 10 leads", included: true },
  { feature: "Máximo de 5 conteúdos/mês", included: true },
  { feature: "Upload de contratos PDF", included: false },
  { feature: "Exportação de dados", included: false },
];

export const UpgradeModal = ({
  open,
  onOpenChange,
  blockedFeature,
}: UpgradeModalProps) => {
  const { phase, daysRemaining } = useAccessPhase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Upgrade para o Plano Pro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {blockedFeature && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
              <strong>Limite atingido:</strong> {blockedFeature}
            </div>
          )}

          {phase === "warning" && daysRemaining > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
              Você ainda tem <strong>{daysRemaining} dias</strong> de acesso
              completo. Após esse período, o plano gratuito será aplicado.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Free Plan */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold mb-3">Plano Gratuito</h3>
              <ul className="space-y-2">
                {freeFeatures.map((item) => (
                  <li
                    key={item.feature}
                    className="flex items-start gap-2 text-sm"
                  >
                    {item.included ? (
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <span
                      className={
                        item.included ? "" : "text-muted-foreground line-through"
                      }
                    >
                      {item.feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-medium">
                Recomendado
              </div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Plano Pro
                <Crown className="h-4 w-4 text-amber-500" />
              </h3>
              <ul className="space-y-2">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <Button size="lg" className="w-full max-w-xs gap-2">
              <Crown className="h-4 w-4" />
              Fazer Upgrade Agora
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Em breve disponível. Entre em contato para mais informações.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
