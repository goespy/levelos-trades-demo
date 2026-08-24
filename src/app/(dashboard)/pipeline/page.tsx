"use client";

import { useState, useEffect } from "react";
import { Settings, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { CardDetailSheet } from "@/components/pipeline/card-detail-sheet";
import { TrelloSetupDialog } from "@/components/pipeline/trello-setup-dialog";
import type { TrelloCard, TrelloList } from "@/lib/trello";
import type { MatchedClient } from "@/components/pipeline/kanban-card";

type EnrichedCard = TrelloCard & { matchedClient: MatchedClient | null };

export default function PipelinePage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [publicDemo, setPublicDemo] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<EnrichedCard | null>(null);
  const [selectedLists, setSelectedLists] = useState<TrelloList[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [boardKey, setBoardKey] = useState(0);

  useEffect(() => {
    fetch("/api/trello/settings")
      .then((res) => res.json())
      .then((data) => {
        setConfigured(data.configured);
        setPublicDemo(Boolean(data.publicDemo));
      })
      .catch(() => setConfigured(false));
  }, []);

  const handleCardClick = (card: EnrichedCard, lists: TrelloList[]) => {
    setSelectedCard(card);
    setSelectedLists(lists);
    setDetailOpen(true);
  };

  const handleCardMoved = () => {
    setDetailOpen(false);
    setBoardKey((k) => k + 1);
  };

  // Loading state
  if (configured === null) {
    return (
      <div>
        <PageHeader title="Pipeline" description="Your Trello sales pipeline" />
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (publicDemo) {
    return (
      <div>
        <PageHeader
          title="Pipeline integration"
          description="Production-derived lead flow with an isolated public-demo boundary."
        />
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-cyan-400/20 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">Live Trello sync is intentionally disconnected</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            The private operational system uses a two-way board integration for lead import and stage changes. This portfolio edition keeps that adapter disabled so it can never connect to the company board.
          </p>
          <Link href="/clients" className="mt-6 inline-flex">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Explore synthetic leads
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Not configured
  if (!configured) {
    return (
      <div>
        <PageHeader
          title="Pipeline"
          description="Connect your Trello board to get started"
        />
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground text-sm text-center max-w-md">
            Connect your Trello board to see your sales pipeline as a kanban
            board with lead scores, client links, and two-way sync.
          </p>
          <Button onClick={() => setSetupOpen(true)}>Connect Trello</Button>
        </div>
        <TrelloSetupDialog
          open={setupOpen}
          onOpenChange={setSetupOpen}
          onConfigured={() => {
            setSetupOpen(false);
            setConfigured(true);
          }}
        />
      </div>
    );
  }

  // Configured — show kanban
  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Your Trello sales pipeline"
        action={
          <Button variant="ghost" size="icon" onClick={() => setSetupOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        }
      />

      <KanbanBoard key={boardKey} onCardClick={handleCardClick} />

      <CardDetailSheet
        card={selectedCard}
        lists={selectedLists}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onCardMoved={handleCardMoved}
      />

      <TrelloSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onConfigured={() => {
          setSetupOpen(false);
          setBoardKey((k) => k + 1);
        }}
      />
    </div>
  );
}
