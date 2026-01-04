import { motion } from "framer-motion";
import { Video, Image, MessageSquare, Target, MoreHorizontal, Trash2, Edit, ArrowRight } from "lucide-react";
import { ContentItem, ContentStatus, ContentType } from "@/hooks/useContentsDB";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors: Record<ContentStatus, string> = {
  ideia: "bg-muted text-muted-foreground",
  producao: "bg-warning/10 text-warning",
  pronto: "bg-info/10 text-info",
  publicado: "bg-success/10 text-success",
  nao_publicado: "bg-muted text-muted-foreground",
  ignorado: "bg-muted/50 text-muted-foreground opacity-60",
};

const statusLabels: Record<ContentStatus, string> = {
  ideia: "Ideia",
  producao: "Em produção",
  pronto: "Pronto",
  publicado: "Publicado",
  nao_publicado: "Não Publicado",
  ignorado: "Ignorado",
};

const typeIcons: Record<ContentType, React.ElementType> = {
  reels: Video,
  carrossel: Image,
  stories: MessageSquare,
};

interface ContentCardProps {
  content: ContentItem;
  onUpdateStatus: (id: string, status: ContentStatus) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
}

export function ContentCard({ content, onUpdateStatus, onDelete, onClick }: ContentCardProps) {
  const TypeIcon = typeIcons[content.type];
  
  const nextStatus: Record<ContentStatus, ContentStatus> = {
    ideia: "producao",
    producao: "pronto",
    pronto: "publicado",
    publicado: "publicado",
    nao_publicado: "publicado",
    ignorado: "ignorado",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 border border-border hover:border-primary/20 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <TypeIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-foreground">{content.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {content.status !== "publicado" && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(content.id, nextStatus[content.status]);
                  }}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Mover para {statusLabels[nextStatus[content.status]]}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(content.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[content.status]}`}>
              {statusLabels[content.status]}
            </span>
            <span className="text-muted-foreground capitalize">{content.type}</span>
            {content.objective && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" />
                {content.objective}
              </span>
            )}
            {content.eventType && (
              <span className="text-muted-foreground">{content.eventType}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
