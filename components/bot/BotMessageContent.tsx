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

  // Filter out whitespace-only text segments to allow consecutive action grouping
  const nonWhitespaceSegments = segments.filter(
    (seg) => seg.type === "action" || seg.content.trim() !== ""
  );

  const groupedSegments: { type: "text" | "actions"; content: string | string[] }[] = [];
  for (const seg of nonWhitespaceSegments) {
    if (seg.type === "text") {
      groupedSegments.push({ type: "text", content: seg.content });
    } else {
      const lastGroup = groupedSegments[groupedSegments.length - 1];
      if (lastGroup && lastGroup.type === "actions") {
        (lastGroup.content as string[]).push(seg.content);
      } else {
        groupedSegments.push({ type: "actions", content: [seg.content] });
      }
    }
  }

  return (
    <div className="space-y-2">
      {groupedSegments.map((seg, i) => {
        if (seg.type === "text") {
          const textContent = seg.content as string;
          return textContent.trim() ? (
            <Streamdown key={i}>{textContent}</Streamdown>
          ) : null;
        }
        const actionsList = seg.content as string[];
        return (
          <div key={i} className="flex flex-wrap gap-2 mt-1">
            {actionsList.map((actionText, idx) => {
              const isConfirm = CONFIRM_ACTIONS.includes(actionText);
              const isCancel = CANCEL_ACTIONS.includes(actionText);
              return (
                <Button
                  key={idx}
                  size="sm"
                  variant={isConfirm ? "default" : isCancel ? "outline" : "secondary"}
                  disabled={disabled}
                  onClick={() => onAction(actionText)}
                  className="h-8 text-xs font-medium"
                >
                  {isConfirm && <Check className="h-3 w-3 mr-1" aria-hidden="true" />}
                  {isCancel && <X className="h-3 w-3 mr-1" aria-hidden="true" />}
                  {actionText}
                </Button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
