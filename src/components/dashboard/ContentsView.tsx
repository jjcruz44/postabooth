import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentCard } from "./ContentCard";
import { ContentItem, ContentStatus, ContentType } from "@/hooks/useContents";

interface ContentsViewProps {
  contents: ContentItem[];
  onUpdateStatus: (id: string, status: ContentStatus) => void;
  onDelete: (id: string) => void;
  onNewContent: () => void;
  onSelectContent: (content: ContentItem) => void;
}

export function ContentsView({
  contents,
  onUpdateStatus,
  onDelete,
  onNewContent,
  onSelectContent,
}: ContentsViewProps) {
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");

  const filteredContents = contents.filter((content) => {
    if (statusFilter !== "all" && content.status !== statusFilter) return false;
    if (typeFilter !== "all" && content.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContentStatus | "all")}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">Todos os status</option>
          <option value="ideia">Ideia</option>
          <option value="producao">Em produção</option>
          <option value="pronto">Pronto</option>
          <option value="publicado">Publicado</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ContentType | "all")}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">Todos os tipos</option>
          <option value="reels">Reels</option>
          <option value="carrossel">Carrossel</option>
          <option value="stories">Stories</option>
        </select>
        <div className="flex-1" />
        <Button className="gap-2" onClick={onNewContent}>
          <Plus className="w-4 h-4" />
          Novo conteúdo
        </Button>
      </div>

      {/* Content list */}
      <div className="grid gap-4">
        {filteredContents.length > 0 ? (
          filteredContents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
              onClick={() => onSelectContent(content)}
            />
          ))
        ) : (
          <div className="bg-muted/30 rounded-xl p-12 text-center border border-dashed border-border">
            <p className="text-muted-foreground mb-4">Nenhum conteúdo encontrado</p>
            <Button onClick={onNewContent} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro conteúdo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
