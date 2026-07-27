"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * Example queries that showcase NITRO's business-tool capabilities.
 * Ordered from most-likely-to-be-useful per role is handled by the parent
 * (page.tsx) via the `queries` prop; this component just renders what it gets.
 */
interface AskNitroCardProps {
  queries: string[];
}

/**
 * Dispatches a `nitro:ask` CustomEvent on `window` carrying the query text.
 * The ChatFloating component (bot cluster) listens for this event to open
 * the NITRO chat with the query pre-filled and ready to send.
 *
 * This keeps the dashboard decoupled from the chat implementation: the card
 * only emits the intent, the chat consumer reacts to it.
 */
function askNitro(query: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("nitro:ask", { detail: { query } }),
  );
}

export function AskNitroCard({ queries }: AskNitroCardProps) {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-[linear-gradient(135deg,hsl(var(--primary)/0.10)_0%,hsl(var(--primary)/0.04)_55%,transparent_100%)]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <Sparkles
              className="h-5 w-5 pointer-events-none"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-foreground">
                Preguntar a Nitro
              </h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                Copiloto
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tu asistente de ventas, taller e inventario. Tocá una idea o
              escribí la tuya.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {queries.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => askNitro(query)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-sm transition-[background,color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-primary/40 hover:bg-primary/8 hover:text-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              <span className="truncate">{query}</span>
              <ArrowRight
                className="size-3 shrink-0 text-primary/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary pointer-events-none"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
