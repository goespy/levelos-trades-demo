"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { DESIGN_STATUS_LABELS, DESIGN_STATUS_COLORS } from "@/lib/constants";
import { Plus, Search, Users } from "lucide-react";

interface ClientListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  source: string | null;
  leadScore: number;
  createdAt: string;
  designProject: { id: string; status: string } | null;
  files: { id: string; category: string }[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/clients?${params}`);
      const data = await res.json();
      setClients(data);
      setLoading(false);
    };
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${clients.length} total clients`}
        action={
          <Link href="/clients/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Client
            </Button>
          </Link>
        }
      />

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              {search
                ? "No clients found matching your search"
                : "No clients yet. Add your first lead!"}
            </p>
            {!search && (
              <Link href="/clients/new">
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Client
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{client.name}</p>
                        <Badge variant="outline" className="shrink-0">
                          {client.leadScore} pts
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {client.city && <span>{client.city}</span>}
                        {client.source && (
                          <>
                            <span>&bull;</span>
                            <span>{client.source}</span>
                          </>
                        )}
                        {client.phone && (
                          <>
                            <span>&bull;</span>
                            <span>{client.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {client.designProject && (
                        <Badge
                          variant="secondary"
                          className={
                            DESIGN_STATUS_COLORS[client.designProject.status]
                          }
                        >
                          {DESIGN_STATUS_LABELS[client.designProject.status]}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {client.files.length} files
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
