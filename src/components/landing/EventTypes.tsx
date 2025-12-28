import { motion } from "framer-motion";
import { Heart, Building2, Crown, PartyPopper, GraduationCap } from "lucide-react";

const eventTypes = [
  {
    icon: Heart,
    title: "Casamentos",
    description: "Conteúdo romântico e elegante para atrair noivos",
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    icon: Building2,
    title: "Corporativo",
    description: "Tom profissional para empresas e eventos de marca",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Crown,
    title: "15 Anos",
    description: "Linguagem jovem e vibrante para debutantes",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    icon: PartyPopper,
    title: "Infantil",
    description: "Conteúdo divertido e colorido para festas kids",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: GraduationCap,
    title: "Formaturas",
    description: "Celebração e nostalgia para formandos",
    color: "bg-emerald-500/10 text-emerald-600",
  },
];

export const EventTypes = () => {
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
              TIPOS DE EVENTO
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-6"
            >
              Conteúdo adaptado para{" "}
              <span className="text-gradient">cada tipo de cliente</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg mb-8"
            >
              Escolha o tipo de evento e todo o conteúdo se adapta automaticamente: 
              linguagem, tom de voz, CTAs e abordagem comercial.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-muted/50 rounded-xl p-6 border border-border"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Exemplo para Casamentos:</div>
                  <div className="font-medium text-foreground mb-2">
                    "5 momentos que a cabine fotográfica captura e ninguém mais vê"
                  </div>
                  <div className="text-sm text-primary font-medium">
                    CTA: Garanta a cabine para seu grande dia →
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right side - Event cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {eventTypes.map((event, index) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className={`${
                  index === 0 ? "col-span-2 sm:col-span-1" : ""
                } bg-card rounded-xl p-5 border border-border hover:border-primary/20 transition-all duration-300 hover:shadow-soft cursor-pointer group`}
              >
                <div className={`w-10 h-10 rounded-lg ${event.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <event.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {event.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {event.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
