"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, Link as LinkIcon, CheckCircle2, Circle, Copy, Check, Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRELLO_LABEL_COLORS } from "@/lib/trello-constants";
import type { TrelloCard, TrelloChecklist, TrelloList } from "@/lib/trello";
import type { MatchedClient } from "./kanban-card";

type EnrichedCard = TrelloCard & { matchedClient: MatchedClient | null };

interface CardDetailSheetProps {
  card: EnrichedCard | null;
  lists: TrelloList[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardMoved: () => void;
}

export function CardDetailSheet({
  card,
  lists,
  open,
  onOpenChange,
  onCardMoved,
}: CardDetailSheetProps) {
  const [checklists, setChecklists] = useState<TrelloChecklist[]>([]);
  const [loadingChecklists, setLoadingChecklists] = useState(false);
  const [moving, setMoving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);
  const [prepSentAt, setPrepSentAt] = useState<string | null>(null);

  useEffect(() => {
    if (!card || !open) {
      setChecklists([]);
      setCopied(false);
      setPrepSentAt(null);
      return;
    }

    setPrepSentAt(card.matchedClient?.prepTokenSent ?? null);

    setLoadingChecklists(true);
    fetch(`/api/trello/cards/${card.id}`)
      .then((res) => res.json())
      .then((data) => setChecklists(data))
      .catch(() => setChecklists([]))
      .finally(() => setLoadingChecklists(false));
  }, [card, open]);

  const handleMove = async (listId: string) => {
    if (!card || listId === card.idList) return;
    const targetList = lists.find((l) => l.id === listId);
    setMoving(true);
    try {
      await fetch(`/api/trello/cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, listName: targetList?.name }),
      });
      onCardMoved();
    } catch {
      // Best effort
    } finally {
      setMoving(false);
    }
  };

  if (!card) return null;

  const currentList = lists.find((l) => l.id === card.idList);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="pr-8">{card.name}</SheetTitle>
          <SheetDescription>
            {currentList ? `In: ${currentList.name}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-4">
          {/* Open in Trello */}
          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Open in Trello <ExternalLink className="h-3 w-3" />
          </a>

          {/* Labels */}
          {card.labels.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Labels</h4>
              <div className="flex flex-wrap gap-1.5">
                {card.labels.map((label) => (
                  <Badge
                    key={label.id}
                    className="text-white text-[10px]"
                    style={{
                      backgroundColor:
                        TRELLO_LABEL_COLORS[label.color ?? ""] ?? "#94a3b8",
                    }}
                  >
                    {label.name || label.color}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {card.desc && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Description</h4>
              <p className="text-sm whitespace-pre-wrap">{card.desc}</p>
            </div>
          )}

          {/* Move to list */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Move to</h4>
            <Select
              value={card.idList}
              onValueChange={handleMove}
              disabled={moving}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Linked client */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Linked Client
            </h4>
            {card.matchedClient ? (
              <Link href={`/clients/${card.matchedClient.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LinkIcon className="h-3 w-3" />
                  {card.matchedClient.name}
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                    Score: {card.matchedClient.leadScore}
                  </Badge>
                </Button>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not linked — use Sync to auto-match by name
              </p>
            )}
          </div>

          {/* Prep Kit Link */}
          {card.matchedClient && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Prep Kit
              </h4>
              {card.matchedClient.prepToken ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted rounded px-2 py-1.5 truncate">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/prep/${card.matchedClient.prepToken}`
                        : `/prep/${card.matchedClient.prepToken}`}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={() => {
                        const url = `${window.location.origin}/prep/${card.matchedClient!.prepToken}`;
                        navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>

                  {/* Status indicators */}
                  <div className="flex items-center gap-3 text-xs">
                    {card.matchedClient.prepCompleted ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    ) : prepSentAt ? (
                      <span className="flex items-center gap-1 text-blue-400">
                        <Send className="h-3 w-3" />
                        Sent {new Date(prepSentAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto py-1 px-2 text-xs gap-1.5"
                        disabled={markingSent}
                        onClick={async () => {
                          setMarkingSent(true);
                          try {
                            await fetch(`/api/clients/${card.matchedClient!.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ prepTokenSent: new Date().toISOString() }),
                            });
                            setPrepSentAt(new Date().toISOString());
                          } catch {
                            // best effort
                          } finally {
                            setMarkingSent(false);
                          }
                        }}
                      >
                        <Send className="h-3 w-3" />
                        Mark as Sent
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No prep token — open the client to generate one
                </p>
              )}
            </div>
          )}

          {/* Checklists */}
          {loadingChecklists ? (
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
            </div>
          ) : (
            checklists.map((cl) => {
              const total = cl.checkItems.length;
              const done = cl.checkItems.filter(
                (i) => i.state === "complete"
              ).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <div key={cl.id}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      {cl.name}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      {done}/{total}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5 mb-2" />
                  <ul className="space-y-1">
                    {cl.checkItems
                      .sort((a, b) => a.pos - b.pos)
                      .map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          {item.state === "complete" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span
                            className={
                              item.state === "complete"
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {item.name}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
