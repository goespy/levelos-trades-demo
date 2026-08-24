"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./kanban-card";
import type { TrelloCard, TrelloList } from "@/lib/trello";
import type { MatchedClient } from "./kanban-card";

interface KanbanColumnProps {
  list: TrelloList;
  cards: (TrelloCard & { matchedClient: MatchedClient | null })[];
  onCardMove: (cardId: string, targetListId: string) => void;
  onCardClick: (card: TrelloCard & { matchedClient: MatchedClient | null }) => void;
}

export function KanbanColumn({ list, cards, onCardMove, onCardClick }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="flex-shrink-0 w-[280px] flex flex-col max-h-full">
      {/* Column header */}
      <div className="flex items-center gap-2 px-2 py-2 mb-2">
        <h3 className="text-sm font-semibold truncate">{list.name}</h3>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {cards.length}
        </Badge>
      </div>

      {/* Drop target + scrollable cards */}
      <div
        className={cn(
          "flex-1 overflow-y-auto space-y-2 px-1 pb-2 rounded-lg transition-colors min-h-[100px]",
          isDragOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const cardId = e.dataTransfer.getData("cardId");
          const sourceListId = e.dataTransfer.getData("sourceListId");
          if (cardId && sourceListId !== list.id) {
            onCardMove(cardId, list.id);
          }
        }}
      >
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} onCardClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}
