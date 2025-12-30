import { useState, useCallback } from "react";

export type ContentStatus = "ideia" | "producao" | "pronto" | "publicado";
export type ContentType = "reels" | "carrossel" | "stories";

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  objective: string;
  date: string;
  eventType: string;
  roteiro?: string;
  legenda?: string;
  cta?: string;
  hashtags?: string[];
  createdAt: Date;
}

const initialContents: ContentItem[] = [
  {
    id: "1",
    title: "3 motivos para ter cabine no casamento",
    type: "reels",
    status: "pronto",
    objective: "Autoridade",
    date: "2024-01-15",
    eventType: "Casamento",
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "2",
    title: "Bastidores: montagem do espelho mágico",
    type: "stories",
    status: "producao",
    objective: "Prova Social",
    date: "2024-01-16",
    eventType: "Corporativo",
    createdAt: new Date("2024-01-11"),
  },
  {
    id: "3",
    title: "Antes vs Depois: fotos com e sem cabine",
    type: "carrossel",
    status: "ideia",
    objective: "Atração",
    date: "2024-01-18",
    eventType: "15 Anos",
    createdAt: new Date("2024-01-12"),
  },
  {
    id: "4",
    title: "Depoimento de noiva emocionada",
    type: "reels",
    status: "publicado",
    objective: "Prova Social",
    date: "2024-01-12",
    eventType: "Casamento",
    createdAt: new Date("2024-01-08"),
  },
  {
    id: "5",
    title: "5 perguntas que todo contratante faz",
    type: "carrossel",
    status: "ideia",
    objective: "Venda",
    date: "2024-01-20",
    eventType: "Geral",
    createdAt: new Date("2024-01-13"),
  },
];

export function useContents() {
  const [contents, setContents] = useState<ContentItem[]>(initialContents);

  const addContent = useCallback((content: Omit<ContentItem, "id" | "createdAt">) => {
    const newContent: ContentItem = {
      ...content,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setContents((prev) => [newContent, ...prev]);
    return newContent;
  }, []);

  const updateContent = useCallback((id: string, updates: Partial<ContentItem>) => {
    setContents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const deleteContent = useCallback((id: string) => {
    setContents((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateStatus = useCallback((id: string, status: ContentStatus) => {
    updateContent(id, { status });
  }, [updateContent]);

  const getContentsByDate = useCallback((date: string) => {
    return contents.filter((c) => c.date === date);
  }, [contents]);

  const getContentsByStatus = useCallback((status: ContentStatus) => {
    return contents.filter((c) => c.status === status);
  }, [contents]);

  const stats = {
    ideia: contents.filter((c) => c.status === "ideia").length,
    producao: contents.filter((c) => c.status === "producao").length,
    pronto: contents.filter((c) => c.status === "pronto").length,
    publicado: contents.filter((c) => c.status === "publicado").length,
    total: contents.length,
  };

  return {
    contents,
    addContent,
    updateContent,
    deleteContent,
    updateStatus,
    getContentsByDate,
    getContentsByStatus,
    stats,
  };
}
