import { motion } from "framer-motion";
import { Calendar, Lightbulb, FolderOpen, LayoutGrid, Sparkles, Target } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Calendário Editorial Automático",
    description: "Receba um planejamento completo mensal e semanal, separado por tipo de conteúdo: Reels, Carrossel e Stories.",
  },
  {
    icon: Lightbulb,
    title: "Gerador de Conteúdo Guiado",
    description: "Para cada post: ideia, roteiro, estrutura de carrossel, legenda persuasiva, CTA e hashtags segmentadas.",
  },
  {
    icon: FolderOpen,
    title: "Biblioteca de Ideias",
    description: "Conteúdos prontos organizados por categoria: autoridade, prova social, emocional e vendas.",
  },
  {
    icon: LayoutGrid,
    title: "Sistema de Organização",
    description: "Acompanhe cada post: Ideia → Em produção → Pronto → Publicado. Tudo visual e intuitivo.",
  },
  {
    icon: Sparkles,
    title: "Adaptação por Evento",
    description: "Escolha o tipo de evento e o sistema adapta linguagem, tom e CTAs automaticamente.",
  },
  {
    icon: Target,
    title: "Foco em Conversão",
    description: "Cada conteúdo tem um objetivo claro: atrair, criar autoridade, mostrar prova social ou vender.",
  },
];

export const Features = () => {
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
            FUNCIONALIDADES
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            Tudo que você precisa para{" "}
            <span className="text-gradient">dominar seu marketing</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Ferramentas pensadas especialmente para profissionais de cabines e totens fotográficos.
          </motion.p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-elevated"
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
