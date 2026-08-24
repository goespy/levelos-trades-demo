"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanColumn } from "./kanban-column";
import type { TrelloCard, TrelloList, TrelloLabel } from "@/lib/trello";
import type { MatchedClient } from "./kanban-card";

type EnrichedCard = TrelloCard & { matchedClient: MatchedClient | null };

interface BoardData {
  lists: TrelloList[];
  cards: EnrichedCard[];
  labels: TrelloLabel[];
}

interface KanbanBoardProps {
  onCardClick: (card: EnrichedCard, lists: TrelloList[]) => void;
}

export function KanbanBoard({ onCardClick }: KanbanBoardProps) {
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trello/board");
      if (!res.ok) throw new Error("Failed to load board");
      const board: BoardData = await res.json();
      setData(board);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleCardMove = async (cardId: string, targetListId: string) => {
    if (!data) return;

    const targetList = data.lists.find((l) => l.id === targetListId);

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: prev.cards.map((c) =>
          c.id === cardId ? { ...c, idList: targetListId } : c
        ),
      };
    });

    try {
      const res = await fetch(`/api/trello/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: targetListId,
          listName: targetList?.name,
        }),
      });
      const result = await res.json();
      // Refresh board to show newly linked client
      if (result.clientCreated) {
        fetchBoard();
      }
    } catch {
      // Revert on failure
      fetchBoard();
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/trello/sync", { method: "POST" });
      const result = await res.json();
      if (result.matched > 0) {
        // Refresh board to show linked clients
        await fetchBoard();
      }
    } catch {
      // Sync is best-effort
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[280px] space-y-2">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-24 bg-muted rounded animate-pulse" />
            <div className="h-24 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchBoard}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  // Sort lists by position, group cards by list
  const sortedLists = [...data.lists].sort((a, b) => a.pos - b.pos);
  const cardsByList = new Map<string, EnrichedCard[]>();
  for (const list of sortedLists) {
    cardsByList.set(list.id, []);
  }
  for (const card of data.cards) {
    const arr = cardsByList.get(card.idList);
    if (arr) arr.push(card);
  }
  // Sort cards within each list by position
  for (const arr of cardsByList.values()) {
    arr.sort((a, b) => a.pos - b.pos);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Clients"}
        </Button>
        <Button variant="ghost" size="sm" onClick={fetchBoard}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedLists.map((list) => (
          <KanbanColumn
            key={list.id}
            list={list}
            cards={cardsByList.get(list.id) ?? []}
            onCardMove={handleCardMove}
            onCardClick={(card) => onCardClick(card, sortedLists)}
          />
        ))}
      </div>
    </div>
  );
}
