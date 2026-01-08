export interface ChecklistTemplateItem {
  phase: "pre" | "during" | "post";
  text: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  items: ChecklistTemplateItem[];
}

export const checklistTemplates: ChecklistTemplate[] = [
  {
    id: "casamento",
    name: "Casamento",
    description: "Template completo para eventos de casamento",
    items: [
      // Pré-evento
      { phase: "pre", text: "Confirmar horário e local com cliente" },
      { phase: "pre", text: "Verificar equipamentos (câmera, iluminação, cabine)" },
      { phase: "pre", text: "Carregar baterias e verificar memória" },
      { phase: "pre", text: "Preparar props e acessórios temáticos" },
      { phase: "pre", text: "Testar impressora e papel fotográfico" },
      { phase: "pre", text: "Conferir backdrop e cenário" },
      { phase: "pre", text: "Separar cabos e extensões extras" },
      { phase: "pre", text: "Revisar contrato e horários" },
      // Durante
      { phase: "during", text: "Montar estrutura com antecedência" },
      { phase: "during", text: "Testar todos os equipamentos no local" },
      { phase: "during", text: "Registrar fotos de instalação" },
      { phase: "during", text: "Acompanhar fluxo de convidados" },
      { phase: "during", text: "Verificar estoque de papel e insumos" },
      { phase: "during", text: "Fazer backup das fotos durante evento" },
      // Pós-evento
      { phase: "post", text: "Desmontar e conferir equipamentos" },
      { phase: "post", text: "Backup final de todas as fotos" },
      { phase: "post", text: "Enviar galeria para cliente" },
      { phase: "post", text: "Solicitar feedback/avaliação" },
      { phase: "post", text: "Confirmar recebimento do pagamento final" },
    ],
  },
  {
    id: "corporativo",
    name: "Corporativo",
    description: "Template para eventos empresariais",
    items: [
      // Pré-evento
      { phase: "pre", text: "Confirmar contato do responsável no local" },
      { phase: "pre", text: "Verificar acesso e estacionamento" },
      { phase: "pre", text: "Preparar personalização com logo da empresa" },
      { phase: "pre", text: "Testar equipamentos" },
      { phase: "pre", text: "Confirmar horário de montagem liberado" },
      { phase: "pre", text: "Verificar tomadas e voltagem do local" },
      // Durante
      { phase: "during", text: "Chegar com antecedência para montagem" },
      { phase: "during", text: "Configurar backdrop corporativo" },
      { phase: "during", text: "Testar iluminação e enquadramento" },
      { phase: "during", text: "Manter fluxo organizado de participantes" },
      { phase: "during", text: "Monitorar impressões e insumos" },
      // Pós-evento
      { phase: "post", text: "Desmontar equipamentos" },
      { phase: "post", text: "Enviar fotos para empresa" },
      { phase: "post", text: "Emitir nota fiscal se necessário" },
      { phase: "post", text: "Agendar follow-up comercial" },
    ],
  },
  {
    id: "aniversario",
    name: "Aniversário / 15 Anos",
    description: "Template para festas de aniversário e debutantes",
    items: [
      // Pré-evento
      { phase: "pre", text: "Confirmar tema da festa com cliente" },
      { phase: "pre", text: "Preparar props temáticos" },
      { phase: "pre", text: "Verificar cenário e iluminação" },
      { phase: "pre", text: "Testar impressão com layout personalizado" },
      { phase: "pre", text: "Confirmar horário de chegada" },
      { phase: "pre", text: "Separar equipamentos e acessórios" },
      // Durante
      { phase: "during", text: "Montar estrutura antes dos convidados" },
      { phase: "during", text: "Organizar fila e fluxo de fotos" },
      { phase: "during", text: "Tirar foto especial com aniversariante" },
      { phase: "during", text: "Manter área organizada" },
      { phase: "during", text: "Verificar papel e tinta" },
      // Pós-evento
      { phase: "post", text: "Desmontar e guardar equipamentos" },
      { phase: "post", text: "Fazer backup das fotos" },
      { phase: "post", text: "Enviar galeria para cliente" },
      { phase: "post", text: "Pedir depoimento para redes sociais" },
    ],
  },
  {
    id: "totem",
    name: "Totem / Cabine / Foto Lembrança",
    description: "Template para serviços de totem e cabine fotográfica",
    items: [
      // Pré-evento
      { phase: "pre", text: "Verificar funcionamento do totem/cabine" },
      { phase: "pre", text: "Testar software e câmera" },
      { phase: "pre", text: "Carregar papel e tinta na impressora" },
      { phase: "pre", text: "Preparar layout de impressão" },
      { phase: "pre", text: "Verificar iluminação interna" },
      { phase: "pre", text: "Separar extensões e cabos" },
      // Durante
      { phase: "during", text: "Montar totem em local estratégico" },
      { phase: "during", text: "Testar todas as funções" },
      { phase: "during", text: "Orientar convidados no uso" },
      { phase: "during", text: "Monitorar impressões" },
      { phase: "during", text: "Repor insumos quando necessário" },
      // Pós-evento
      { phase: "post", text: "Desligar e desmontar equipamento" },
      { phase: "post", text: "Exportar fotos do evento" },
      { phase: "post", text: "Limpar e guardar equipamentos" },
      { phase: "post", text: "Enviar link de galeria" },
    ],
  },
  {
    id: "geral",
    name: "Padrão Geral",
    description: "Template genérico para qualquer tipo de evento",
    items: [
      // Pré-evento
      { phase: "pre", text: "Confirmar data, horário e local" },
      { phase: "pre", text: "Verificar equipamentos" },
      { phase: "pre", text: "Preparar materiais e insumos" },
      { phase: "pre", text: "Testar tudo antes de sair" },
      { phase: "pre", text: "Confirmar forma de pagamento" },
      // Durante
      { phase: "during", text: "Chegar com antecedência" },
      { phase: "during", text: "Montar e testar no local" },
      { phase: "during", text: "Executar serviço conforme combinado" },
      { phase: "during", text: "Registrar fotos do trabalho" },
      // Pós-evento
      { phase: "post", text: "Desmontar e conferir materiais" },
      { phase: "post", text: "Fazer backup dos arquivos" },
      { phase: "post", text: "Enviar entregáveis ao cliente" },
      { phase: "post", text: "Confirmar recebimento do pagamento" },
      { phase: "post", text: "Solicitar avaliação" },
    ],
  },
];
