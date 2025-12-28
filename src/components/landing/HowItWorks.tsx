import { motion } from "framer-motion";
import { UserPlus, Calendar, FileText, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Configure seu perfil",
    description: "Informe seu tipo de serviço, público principal, estilo da marca e frequência de postagens desejada.",
  },
  {
    icon: Calendar,
    number: "02",
    title: "Receba seu calendário",
    description: "O sistema gera automaticamente um calendário editorial mensal com todos os tipos de conteúdo.",
  },
  {
    icon: FileText,
    number: "03",
    title: "Acesse roteiros prontos",
    description: "Para cada post, você recebe o roteiro completo, legenda, hashtags e sugestão de CTA.",
  },
  {
    icon: Rocket,
    number: "04",
    title: "Publique com confiança",
    description: "Organize, edite e acompanhe o status de cada conteúdo até a publicação.",
  },
];

export const HowItWorks = () => {
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
            COMO FUNCIONA
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            Do bloqueio criativo à{" "}
            <span className="text-gradient">consistência nas redes</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Em 4 passos simples você terá todo o conteúdo do mês organizado.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative flex items-start gap-6 mb-8 last:mb-0"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-16 bg-gradient-to-b from-primary/30 to-transparent" />
              )}
              
              {/* Icon */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
                  <step.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 bg-card rounded-xl p-5 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
