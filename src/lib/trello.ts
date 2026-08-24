// Trello API service — fetch wrappers for board, lists, cards, labels, checklists
import { isPublicDemo } from "@/lib/public-demo";

const TRELLO_BASE = "https://api.trello.com/1";

// --- Types ---

export interface TrelloLabel {
  id: string;
  name: string;
  color: string | null;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  idLabels: string[];
  labels: TrelloLabel[];
  pos: number;
  due: string | null;
  dateLastActivity: string;
  url: string;
}

export interface TrelloList {
  id: string;
  name: string;
  pos: number;
  closed: boolean;
}

export interface TrelloBoard {
  id: string;
  name: string;
  url: string;
}

export interface TrelloCheckItem {
  id: string;
  name: string;
  state: "complete" | "incomplete";
  pos: number;
}

export interface TrelloChecklist {
  id: string;
  name: string;
  checkItems: TrelloCheckItem[];
}

export interface TrelloCredentials {
  apiKey: string;
  token: string;
  boardId: string;
}

// --- Auth ---

export function getCredentials(): TrelloCredentials | null {
  if (isPublicDemo()) return null;

  const apiKey = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_TOKEN;
  const boardId = process.env.TRELLO_BOARD_ID;

  if (!apiKey || !token || !boardId) return null;
  return { apiKey, token, boardId };
}

function buildUrl(
  path: string,
  creds: TrelloCredentials,
  params?: Record<string, string>
): string {
  const url = new URL(`${TRELLO_BASE}${path}`);
  url.searchParams.set("key", creds.apiKey);
  url.searchParams.set("token", creds.token);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

// --- Board ---

export async function getBoard(creds: TrelloCredentials): Promise<TrelloBoard> {
  const res = await fetch(buildUrl(`/boards/${creds.boardId}`, creds, { fields: "id,name,url" }));
  if (!res.ok) throw new Error(`Trello API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getBoardLists(creds: TrelloCredentials): Promise<TrelloList[]> {
  const res = await fetch(buildUrl(`/boards/${creds.boardId}/lists`, creds, { filter: "open" }));
  if (!res.ok) throw new Error(`Trello API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getBoardCards(creds: TrelloCredentials): Promise<TrelloCard[]> {
  const res = await fetch(
    buildUrl(`/boards/${creds.boardId}/cards`, creds, {
      fields: "id,name,desc,idList,idLabels,labels,pos,due,dateLastActivity,url",
    })
  );
  if (!res.ok) throw new Error(`Trello API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getBoardLabels(creds: TrelloCredentials): Promise<TrelloLabel[]> {
  const res = await fetch(buildUrl(`/boards/${creds.boardId}/labels`, creds));
  if (!res.ok) throw new Error(`Trello API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// --- Cards ---

export async function getCardChecklists(
  creds: TrelloCredentials,
  cardId: string
): Promise<TrelloChecklist[]> {
  const res = await fetch(buildUrl(`/cards/${cardId}/checklists`, creds));
  if (!res.ok) throw new Error(`Trello API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function createCard(
  creds: TrelloCredentials,
  listId: string,
  name: string,
  desc?: string
): Promise<TrelloCard> {
  const body: Record<string, string> = { idList: listId, name, pos: "bottom" };
  if (desc) body.desc = desc;

  const res = await fetch(buildUrl("/cards", creds), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Trello API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function moveCard(
  creds: TrelloCredentials,
  cardId: string,
  listId: string
): Promise<TrelloCard> {
  const res = await fetch(buildUrl(`/cards/${cardId}`, creds), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idList: listId }),
  });
  if (!res.ok) throw new Error(`Trello API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function updateCard(
  creds: TrelloCredentials,
  cardId: string,
  data: Record<string, unknown>
): Promise<TrelloCard> {
  const res = await fetch(buildUrl(`/cards/${cardId}`, creds), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Trello API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// --- Comments ---

export async function addCommentToCard(
  creds: TrelloCredentials,
  cardId: string,
  text: string
): Promise<void> {
  const res = await fetch(buildUrl(`/cards/${cardId}/actions/comments`, creds), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Trello API error: ${res.status} ${res.statusText}`);
}

// --- Helpers ---

export async function getListByName(
  creds: TrelloCredentials,
  name: string
): Promise<TrelloList | null> {
  const lists = await getBoardLists(creds);
  return lists.find((l) => l.name.toLowerCase() === name.toLowerCase()) ?? null;
}

export async function testConnection(creds: TrelloCredentials): Promise<{ ok: boolean; error?: string; boardName?: string }> {
  try {
    const board = await getBoard(creds);
    return { ok: true, boardName: board.name };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}
