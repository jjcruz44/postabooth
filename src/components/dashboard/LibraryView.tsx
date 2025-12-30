import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ArrowLeft, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  hook: string;
  cta: string;
}

interface Category {
  id: string;
  title: string;
  description: string;
  color: string;
  ideas: ContentIdea[];
}

const libraryCategories: Category[] = [
  {
    id: "sem-evento",
    title: "Conteúdo sem evento",
    description: "Ideias para postar mesmo sem eventos agendados",
    color: "from-primary to-secondary",
    ideas: [
      {
        id: "1",
        title: "Tour pelo equipamento",
        description: "Mostre os bastidores do seu equipamento e como funciona a mágica",
        hook: "Você sabe o que tem dentro de uma cabine fotográfica profissional?",
        cta: "Quer ver a mágica ao vivo? Entre em contato!",
      },
      {
        id: "2",
        title: "Antes e depois da montagem",
        description: "Timelapse ou fotos mostrando a transformação do espaço",
        hook: "De um espaço vazio para uma experiência inesquecível em minutos",
        cta: "Transforme seu evento também! Link na bio",
      },
      {
        id: "3",
        title: "Dicas de poses",
        description: "Ensine seus seguidores a tirar fotos melhores na cabine",
        hook: "3 poses que vão fazer suas fotos na cabine ficarem INCRÍVEIS",
        cta: "Salva pra não esquecer na hora do evento!",
      },
    ],
  },
  {
    id: "autoridade",
    title: "Autoridade",
    description: "Mostre que você é especialista no assunto",
    color: "from-blue-500 to-blue-600",
    ideas: [
      {
        id: "1",
        title: "Estatísticas de satisfação",
        description: "Compartilhe números de eventos realizados e clientes satisfeitos",
        hook: "Mais de X eventos realizados e 100% de clientes satisfeitos. Quer saber o segredo?",
        cta: "Garanta essa experiência no seu evento!",
      },
      {
        id: "2",
        title: "Perguntas frequentes",
        description: "Responda as dúvidas mais comuns sobre cabine fotográfica",
        hook: "5 perguntas que TODO mundo faz antes de contratar uma cabine",
        cta: "Ficou com dúvida? Me chama no direct!",
      },
      {
        id: "3",
        title: "Comparativo de serviços",
        description: "Explique a diferença entre cabine, espelho e totem",
        hook: "Cabine, espelho ou totem? Qual escolher pro seu evento?",
        cta: "Me conta qual combina mais com seu evento!",
      },
    ],
  },
  {
    id: "prova-social",
    title: "Prova social",
    description: "Mostre resultados e depoimentos reais",
    color: "from-emerald-500 to-emerald-600",
    ideas: [
      {
        id: "1",
        title: "Depoimento de cliente",
        description: "Compartilhe o feedback de um cliente satisfeito",
        hook: "O que essa noiva disse sobre nossa cabine vai te emocionar",
        cta: "Quer criar memórias assim no seu casamento?",
      },
      {
        id: "2",
        title: "Fotos dos convidados",
        description: "Compilação das melhores fotos de um evento (com autorização)",
        hook: "Olha a alegria dos convidados nesse casamento!",
        cta: "Leve essa diversão pro seu evento também!",
      },
      {
        id: "3",
        title: "Antes vs Depois",
        description: "Compare eventos com e sem cabine fotográfica",
        hook: "A diferença que uma cabine faz num evento (você não vai acreditar)",
        cta: "Qual experiência você quer no seu evento?",
      },
    ],
  },
  {
    id: "educativo",
    title: "Educativo",
    description: "Ensine algo útil para sua audiência",
    color: "from-purple-500 to-purple-600",
    ideas: [
      {
        id: "1",
        title: "Como escolher o espaço ideal",
        description: "Dicas sobre onde posicionar a cabine no evento",
        hook: "O lugar PERFEITO pra colocar a cabine no seu evento (não é onde você pensa)",
        cta: "Quer ajuda pra planejar? Me chama!",
      },
      {
        id: "2",
        title: "Melhores horários",
        description: "Quando a cabine tem mais movimento durante um evento",
        hook: "O momento em que TODOS querem usar a cabine (planeje pra não perder)",
        cta: "Vamos planejar juntos o timing perfeito!",
      },
      {
        id: "3",
        title: "Tipos de impressão",
        description: "Explique as opções de layout e impressão disponíveis",
        hook: "Sabia que você pode personalizar TUDO nas fotos da cabine?",
        cta: "Me manda a identidade do seu evento!",
      },
    ],
  },
  {
    id: "emocional",
    title: "Emocional",
    description: "Conecte-se emocionalmente com sua audiência",
    color: "from-pink-500 to-pink-600",
    ideas: [
      {
        id: "1",
        title: "Momentos emocionantes",
        description: "Reações emocionais capturadas na cabine",
        hook: "O momento em que ela viu o resultado... (prepare os lenços)",
        cta: "Crie memórias que duram pra sempre",
      },
      {
        id: "2",
        title: "Gerações juntas",
        description: "Avós, pais e netos na mesma foto",
        hook: "3 gerações, 1 foto, memórias infinitas",
        cta: "Reúna sua família em fotos especiais",
      },
      {
        id: "3",
        title: "Último evento dos avós",
        description: "História emocionante de registro familiar",
        hook: "Essa foto vale mais que mil palavras (história real)",
        cta: "Nunca é só uma foto. É uma memória.",
      },
    ],
  },
  {
    id: "fechamento",
    title: "Fechamento",
    description: "Conteúdos focados em converter seguidores em clientes",
    color: "from-amber-500 to-amber-600",
    ideas: [
      {
        id: "1",
        title: "Promoção limitada",
        description: "Oferta especial por tempo limitado",
        hook: "Só até sexta: condição especial pra quem fechar agora",
        cta: "Garanta sua vaga antes que acabe!",
      },
      {
        id: "2",
        title: "Calendário de disponibilidade",
        description: "Mostre as datas ainda disponíveis",
        hook: "ATENÇÃO: Maio já está quase lotado. Confira as datas disponíveis",
        cta: "Reserve agora e garanta sua data!",
      },
      {
        id: "3",
        title: "Pacote completo",
        description: "Apresente todos os benefícios inclusos",
        hook: "Tudo isso incluso no valor (você não vai acreditar)",
        cta: "Peça seu orçamento sem compromisso!",
      },
    ],
  },
];

export function LibraryView() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyIdea = (idea: ContentIdea) => {
    const text = `📌 ${idea.title}\n\n${idea.description}\n\n🎯 Hook: "${idea.hook}"\n\n👉 CTA: "${idea.cta}"`;
    navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copiado!",
      description: "Ideia copiada para a área de transferência.",
    });
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {selectedCategory ? (
          <motion.div
            key="category-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedCategory.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedCategory.description}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {selectedCategory.ideas.map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl p-5 border border-border"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedCategory.color} flex items-center justify-center`}
                      >
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-foreground">{idea.title}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyIdea(idea)}
                      className="gap-1"
                    >
                      {copiedId === idea.id ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copiar
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{idea.description}</p>

                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <span className="text-xs font-medium text-primary uppercase tracking-wide">
                        Hook
                      </span>
                      <p className="text-sm text-foreground mt-1">"{idea.hook}"</p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-3">
                      <span className="text-xs font-medium text-primary uppercase tracking-wide">
                        CTA
                      </span>
                      <p className="text-sm font-medium text-primary mt-1">"{idea.cta}"</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="category-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Biblioteca de Ideias
              </h2>
              <p className="text-muted-foreground">
                Ideias prontas organizadas por objetivo. Clique para ver mais.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {libraryCategories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedCategory(category)}
                  className="bg-card rounded-xl p-5 border border-border cursor-pointer hover:shadow-soft transition-all text-left"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}
                  >
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{category.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {category.description}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    {category.ideas.length} ideias
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
