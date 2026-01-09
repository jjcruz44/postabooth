import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "Grátis",
    description: "Para começar a organizar seu conteúdo",
    features: [
      "5 ideias de conteúdo por mês",
      "Calendário básico",
      "1 tipo de evento",
      "Biblioteca básica de ideias",
    ],
    cta: "Começar grátis",
    popular: false,
    navigateTo: "/login?tab=signup",
    priceHidden: false,
  },
  {
    name: "Profissional",
    price: "R$ 39,90",
    period: "/mês",
    description: "Para quem quer consistência nas redes",
    features: [
      "Conteúdo ilimitado",
      "Calendário completo mensal e semanal",
      "Todos os tipos de evento",
      "Roteiros detalhados para Reels",
      "Estrutura de carrossel slide a slide",
      "Sistema de organização completo",
      "Suporte prioritário",
    ],
    cta: "Em breve",
    popular: true,
    disabled: true,
    priceHidden: true,
  },
  {
    name: "Agência",
    price: "R$ 119,90",
    period: "/mês",
    description: "Para múltiplos clientes e perfis",
    features: [
      "Tudo do Profissional",
      "Até 5 perfis de cliente",
      "Relatório de produtividade",
      "Exportação de calendário",
      "Suporte dedicado",
    ],
    cta: "Em breve",
    popular: false,
    disabled: true,
    priceHidden: true,
  },
];

export const Pricing = () => {
  const navigate = useNavigate();

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (plan.navigateTo) {
      navigate(plan.navigateTo);
    }
  };

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold mb-4"
          >
            PLANOS
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            Escolha o plano ideal{" "}
            <span className="text-gradient">para seu negócio</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Comece grátis e evolua conforme sua necessidade.
          </motion.p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-card rounded-2xl p-6 border ${
                plan.popular
                  ? "border-primary shadow-glow"
                  : "border-border"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="gradient-primary px-4 py-1 rounded-full text-primary-foreground text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    MAIS POPULAR
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-4xl font-bold text-foreground ${plan.priceHidden ? 'blur-sm select-none' : ''}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-muted-foreground text-sm ${plan.priceHidden ? 'blur-sm select-none' : ''}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-2">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full"
                disabled={plan.disabled}
                onClick={() => handlePlanClick(plan)}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
