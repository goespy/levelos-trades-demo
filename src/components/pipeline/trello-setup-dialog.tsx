"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TrelloSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigured: () => void;
}

export function TrelloSetupDialog({
  open,
  onOpenChange,
  onConfigured,
}: TrelloSetupDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [token, setToken] = useState("");
  const [boardId, setBoardId] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    boardName?: string;
    error?: string;
  } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/trello/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, token, boardId }),
      });
      const data = await res.json();
      setResult(data);
      if (data.ok) {
        onConfigured();
      }
    } catch {
      setResult({ ok: false, error: "Network error" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Trello</DialogTitle>
          <DialogDescription>
            Enter your Trello API credentials to connect your pipeline board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Get your API key and token from{" "}
            <a
              href="https://trello.com/power-ups/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              trello.com/power-ups/admin
            </a>
            . For board ID, open your board and add <code>.json</code> to the URL — the{" "}
            <code>id</code> field at the top is your board ID.
          </p>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your Trello API key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Your Trello token"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boardId">Board ID</Label>
            <Input
              id="boardId"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              placeholder="Your Trello board ID"
            />
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 text-sm ${
                result.ok ? "text-green-400" : "text-destructive"
              }`}
            >
              {result.ok ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Connected to: {result.boardName}
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  {result.error}
                </>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Add these values to your <code>.env</code> file as{" "}
            <code>TRELLO_API_KEY</code>, <code>TRELLO_TOKEN</code>, and{" "}
            <code>TRELLO_BOARD_ID</code>, then restart the dev server.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={handleTest}
            disabled={testing || !apiKey || !token || !boardId}
          >
            {testing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Test Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
