import { motion } from "framer-motion";
import { Camera, MonitorSmartphone, Sparkles, CheckCircle2 } from "lucide-react";

const audiences = [
  {
    icon: Camera,
    title: "Cabines Fotográficas",
    description: "Profissionais que trabalham com cabines de fotos em eventos",
  },
  {
    icon: MonitorSmartphone,
    title: "Totens de Fotos",
    description: "Empreendedores com totens digitais para festas e casamentos",
  },
  {
    icon: Sparkles,
    title: "Espelho Mágico",
    description: "Quem oferece experiências interativas com espelho mágico",
  },
];

const benefits = [
  "Organizar eventos sem perder informações",
  "Acompanhar tarefas antes, durante e depois",
  "Gerenciar contatos e orçamentos",
  "Manter presença ativa nas redes sociais",
];

export const ForWho = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block text-primary font-semibold mb-4"
            >
              PARA QUEM É O CLICKAR
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-6"
            >
              Feito para profissionais de{" "}
              <span className="text-gradient">fotos lembrança</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg mb-8"
            >
              Se você trabalha com cabines, totens ou espelho mágico e precisa de mais 
              organização no dia a dia, o Clickar foi criado para você.
            </motion.p>

            {/* Benefits list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right side - Audience cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {audiences.map((audience, index) => (
              <motion.div
                key={audience.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="bg-card rounded-xl p-5 border border-border hover:border-primary/20 transition-all duration-300 hover:shadow-soft flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <audience.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {audience.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {audience.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
