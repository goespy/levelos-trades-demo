"use client";

import { GripVertical, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TRELLO_LABEL_COLORS } from "@/lib/trello-constants";
import type { TrelloCard } from "@/lib/trello";

interface MatchedClient {
  id: string;
  name: string;
  leadScore: number;
  prepToken: string | null;
  prepTokenSent: string | null;
  prepCompleted: boolean;
  designProject: { id: string; status: string } | null;
}

interface KanbanCardProps {
  card: TrelloCard & { matchedClient: MatchedClient | null };
  onCardClick: (card: TrelloCard & { matchedClient: MatchedClient | null }) => void;
}

export type { MatchedClient };

export function KanbanCard({ card, onCardClick }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("cardId", card.id);
        e.dataTransfer.setData("sourceListId", card.idList);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onCardClick(card)}
      className="bg-card border rounded-lg p-3 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
    >
      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className="inline-block h-2 w-8 rounded-full"
              style={{
                backgroundColor:
                  TRELLO_LABEL_COLORS[label.color ?? ""] ?? "#94a3b8",
              }}
              title={label.name || label.color || ""}
            />
          ))}
        </div>
      )}

      {/* Card name + drag handle */}
      <div className="flex items-start gap-1">
        <GripVertical className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="text-sm font-medium leading-tight">{card.name}</span>
      </div>

      {/* Matched client info */}
      {card.matchedClient && (
        <div className="flex items-center gap-1.5 mt-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0",
              card.matchedClient.leadScore >= 5
                ? "bg-green-500/15 text-green-400"
                : card.matchedClient.leadScore >= 3
                  ? "bg-yellow-500/15 text-yellow-400"
                  : "bg-muted text-muted-foreground"
            )}
          >
            Score: {card.matchedClient.leadScore}
          </Badge>
          <LinkIcon className="h-3 w-3 text-primary" />
          <span className="text-[10px] text-primary">Linked</span>
        </div>
      )}
    </div>
  );
}
