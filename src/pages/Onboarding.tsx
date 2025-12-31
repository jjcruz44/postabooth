import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, ArrowRight, ArrowLeft, Check, Heart, Building2, Crown, PartyPopper, GraduationCap, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

type ServiceType = "cabine" | "espelho" | "totem" | "foto-lembranca";
type EventType = "casamento" | "corporativo" | "15anos" | "infantil" | "formatura";
type BrandStyle = "elegante" | "divertido" | "premium" | "corporativo";
type PostFrequency = "3x" | "5x" | "diario";

interface OnboardingData {
  services: ServiceType[];
  events: EventType[];
  city: string;
  brandStyle: BrandStyle | null;
  frequency: PostFrequency | null;
}

const services = [
  { id: "cabine" as const, label: "Cabine Fotográfica", icon: Camera },
  { id: "espelho" as const, label: "Espelho Mágico", icon: Sparkles },
  { id: "totem" as const, label: "Totem Fotográfico", icon: Camera },
  { id: "foto-lembranca" as const, label: "Foto Lembrança", icon: Heart },
];

const events = [
  { id: "casamento" as const, label: "Casamentos", icon: Heart, color: "bg-pink-500/10 text-pink-600" },
  { id: "corporativo" as const, label: "Corporativo", icon: Building2, color: "bg-blue-500/10 text-blue-600" },
  { id: "15anos" as const, label: "15 Anos", icon: Crown, color: "bg-purple-500/10 text-purple-600" },
  { id: "infantil" as const, label: "Infantil", icon: PartyPopper, color: "bg-amber-500/10 text-amber-600" },
  { id: "formatura" as const, label: "Formaturas", icon: GraduationCap, color: "bg-emerald-500/10 text-emerald-600" },
];

const brandStyles = [
  { id: "elegante" as const, label: "Elegante", description: "Sofisticado e refinado" },
  { id: "divertido" as const, label: "Divertido", description: "Leve e descontraído" },
  { id: "premium" as const, label: "Premium", description: "Luxuoso e exclusivo" },
  { id: "corporativo" as const, label: "Corporativo", description: "Profissional e sério" },
];

const frequencies = [
  { id: "3x" as const, label: "3x por semana", description: "Ideal para começar" },
  { id: "5x" as const, label: "5x por semana", description: "Crescimento consistente" },
  { id: "diario" as const, label: "Diário", description: "Máxima visibilidade" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { updateProfile } = useProfile();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    services: [],
    events: [],
    city: "",
    brandStyle: null,
    frequency: null,
  });

  const totalSteps = 5;

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const toggleService = (serviceId: ServiceType) => {
    setData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const toggleEvent = (eventId: EventType) => {
    setData((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.services.length > 0;
      case 2:
        return data.events.length > 0;
      case 3:
        return data.city.trim().length > 0;
      case 4:
        return data.brandStyle !== null;
      case 5:
        return data.frequency !== null;
      default:
        return false;
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await updateProfile({
        services: data.services,
        events: data.events,
        city: data.city,
        brandStyle: data.brandStyle || undefined,
        postFrequency: data.frequency || undefined,
      });

      toast({
        title: "Perfil configurado!",
        description: "Agora você está pronto para usar o PostaBooth.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas preferências. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">PostaBooth</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Passo {step} de {totalSteps}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full gradient-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Qual é o seu tipo de serviço?
                </h1>
                <p className="text-muted-foreground">
                  Selecione todos que você oferece
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                      data.services.includes(service.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        data.services.includes(service.id)
                          ? "gradient-primary"
                          : "bg-muted"
                      }`}>
                        <service.icon className={`w-6 h-6 ${
                          data.services.includes(service.id)
                            ? "text-primary-foreground"
                            : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{service.label}</div>
                      </div>
                      {data.services.includes(service.id) && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Quais eventos você atende?
                </h1>
                <p className="text-muted-foreground">
                  O conteúdo será adaptado para cada tipo
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => toggleEvent(event.id)}
                    className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                      data.events.includes(event.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${event.color}`}>
                        <event.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{event.label}</div>
                      </div>
                      {data.events.includes(event.id) && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Onde você atua?
                </h1>
                <p className="text-muted-foreground">
                  Isso ajuda a personalizar seu conteúdo
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={data.city}
                  onChange={(e) => setData({ ...data, city: e.target.value })}
                  placeholder="Ex: São Paulo, SP"
                  className="w-full px-4 py-4 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors text-lg"
                />
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Qual é o estilo da sua marca?
                </h1>
                <p className="text-muted-foreground">
                  O tom do conteúdo será baseado nisso
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                {brandStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setData({ ...data, brandStyle: style.id })}
                    className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                      data.brandStyle === style.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="font-semibold text-foreground mb-1">{style.label}</div>
                    <div className="text-sm text-muted-foreground">{style.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Quantas vezes quer postar por semana?
                </h1>
                <p className="text-muted-foreground">
                  Vamos criar um calendário baseado nisso
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                {frequencies.map((freq) => (
                  <button
                    key={freq.id}
                    onClick={() => setData({ ...data, frequency: freq.id })}
                    className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                      data.frequency === freq.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground mb-1">{freq.label}</div>
                        <div className="text-sm text-muted-foreground">{freq.description}</div>
                      </div>
                      {data.frequency === freq.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-2xl">
          {step > 1 ? (
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              className="gap-2"
              disabled={saving}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="gap-2"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="hero"
              onClick={handleComplete}
              disabled={!canProceed() || saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  Começar a usar
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
