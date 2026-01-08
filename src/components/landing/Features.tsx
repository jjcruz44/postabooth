import { motion } from "framer-motion";
import { Calendar, Lightbulb, FolderOpen, LayoutGrid, Sparkles, Users } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Gerenciamento de Eventos",
    description: "Organize todos os seus eventos em um só lugar, com datas, status e informações sempre atualizadas.",
  },
  {
    icon: Lightbulb,
    title: "Checklists de Tarefas",
    description: "Crie listas de tarefas para cada evento, controlando o que foi feito antes, durante e depois.",
  },
  {
    icon: Users,
    title: "Gestão de Leads",
    description: "Acompanhe seus contatos comerciais, registre orçamentos e converta mais clientes.",
  },
  {
    icon: LayoutGrid,
    title: "Criação de Conteúdo",
    description: "Gere posts para redes sociais com ideias, roteiros e legendas prontos para publicar.",
  },
  {
    icon: Sparkles,
    title: "Calendário Editorial",
    description: "Planeje seu conteúdo mensal com sugestões organizadas por tipo: Reels, Carrossel e Stories.",
  },
  {
    icon: FolderOpen,
    title: "Biblioteca de Ideias",
    description: "Acesse conteúdos prontos organizados por objetivo: autoridade, prova social e vendas.",
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
            <span className="text-gradient">organizar seu negócio</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Ferramentas integradas para gestão de eventos e criação de conteúdo digital.
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
