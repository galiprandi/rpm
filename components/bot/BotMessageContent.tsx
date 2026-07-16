"use client";

import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const ACTION_PATTERN = /\[([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)\]/g;
const KNOWN_ACTIONS = ["Confirmar", "Cancelar", "Sí", "No"];

const CONFIRM_ACTIONS = ["Confirmar", "Sí"];
const CANCEL_ACTIONS = ["Cancelar", "No"];

interface BotMessageContentProps {
  text: string;
  onAction?: (action: string) => void;
  disabled?: boolean;
}

export function BotMessageContent({
  text,
  onAction,
  disabled,
}: BotMessageContentProps) {
  if (!onAction) {
    return <Streamdown>{text}</Streamdown>;
  }

  const actions: { text: string; index: number; length: number }[] = [];
  let match;
  const pattern = new RegExp(ACTION_PATTERN.source, "g");
  while ((match = pattern.exec(text)) !== null) {
    const actionText = match[1].trim();
    if (KNOWN_ACTIONS.includes(actionText)) {
      actions.push({
        text: actionText,
        index: match.index,
        length: match[0].length,
      });
    }
  }

  if (actions.length === 0) {
    return <Streamdown>{text}</Streamdown>;
  }

  const segments: { type: "text" | "action"; content: string }[] = [];
  let lastIndex = 0;

  for (const action of actions) {
    if (action.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, action.index),
      });
    }
    segments.push({ type: "action", content: action.text });
    lastIndex = action.index + action.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return (
    <div className="space-y-2">
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return seg.content.trim() ? (
            <Streamdown key={i}>{seg.content}</Streamdown>
          ) : null;
        }
        const isConfirm = CONFIRM_ACTIONS.includes(seg.content);
        const isCancel = CANCEL_ACTIONS.includes(seg.content);
        return (
          <Button
            key={i}
            size="sm"
            variant={isConfirm ? "default" : isCancel ? "outline" : "secondary"}
            disabled={disabled}
            onClick={() => onAction(seg.content)}
            className="mr-2 h-8 text-xs"
          >
            {isConfirm && <Check className="h-3 w-3 mr-1" aria-hidden="true" />}
            {isCancel && <X className="h-3 w-3 mr-1" aria-hidden="true" />}
            {seg.content}
          </Button>
        );
      })}
    </div>
  );
}
