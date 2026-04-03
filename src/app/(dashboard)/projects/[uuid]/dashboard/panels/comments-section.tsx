"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Bot, User, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContentWithMentions } from "@/components/mention-renderer";
import { MentionEditor, type MentionEditorRef } from "@/components/mention-editor";
import { useRealtimeEntityEvent } from "@/contexts/realtime-context";
import {
  getIdeaCommentsAction,
  createIdeaCommentAction,
} from "@/app/(dashboard)/projects/[uuid]/ideas/[ideaUuid]/comment-actions";
import { formatRelativeTime, type TranslateFn } from "../utils";
import type { CommentResponse } from "@/services/comment.service";

interface CommentsSectionProps {
  ideaUuid: string;
  currentUserUuid: string;
}

export function CommentsSection({ ideaUuid, currentUserUuid }: CommentsSectionProps) {
  const t = useTranslations();
  const locale = useLocale();

  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<MentionEditorRef>(null);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    const result = await getIdeaCommentsAction(ideaUuid);
    setComments(result.comments);
    setIsLoading(false);
  }, [ideaUuid]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Auto-refresh when another user adds a comment
  useRealtimeEntityEvent("idea", ideaUuid, (event) => {
    if (event.actorUuid === currentUserUuid) return;
    getIdeaCommentsAction(ideaUuid).then((result) => {
      setComments(result.comments);
    });
  });

  const handleSubmit = async () => {
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const result = await createIdeaCommentAction(ideaUuid, comment);
    setIsSubmitting(false);

    if (result.success && result.comment) {
      setComments((prev) => [...prev, result.comment!]);
      setComment("");
      editorRef.current?.clear();
    }
  };

  return (
    <div className="mt-5">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-[#9A9A9A]">
        {t("comments.title")}
      </Label>
      <div className="mt-2 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-[#9A9A9A]" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-[#9A9A9A] italic">{t("comments.noComments")}</p>
        ) : (
          comments.map((c) => (
            <div key={c.uuid} className="flex gap-2.5">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className={c.author.type === "agent" ? "bg-[#C67A52] text-white" : "bg-[#E5E0D8] text-[#6B6B6B] text-[10px]"}>
                  {c.author.type === "agent" ? (
                    <Bot className="h-3 w-3" />
                  ) : (
                    c.author.name.charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${c.author.type === "agent" ? "text-[#C67A52]" : "text-[#2C2C2C]"}`}>{c.author.name}</span>
                  <span className="text-[11px] text-[#9A9A9A]">{formatRelativeTime(c.createdAt, t as TranslateFn, locale)}</span>
                </div>
                <div className="mt-1 text-xs leading-relaxed text-[#2C2C2C]">
                  <ContentWithMentions>{c.content}</ContentWithMentions>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Separator className="my-3 bg-[#F5F2EC]" />
      <div className="flex items-start gap-2.5">
        <Avatar className="mt-1.5 h-6 w-6">
          <AvatarFallback className="bg-[#C67A52] text-white text-[10px]">
            <User className="h-3 w-3" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <MentionEditor
            ref={editorRef}
            value={comment}
            onChange={setComment}
            onSubmit={handleSubmit}
            placeholder={t("comments.addComment")}
            className="border-none bg-[#FAF8F4] text-sm"
            disabled={isSubmitting}
          />
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="mt-1 h-7 w-7"
          disabled={!comment.trim() || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#9A9A9A]" />
          ) : (
            <Send className="h-3.5 w-3.5 text-[#C67A52]" />
          )}
        </Button>
      </div>
    </div>
  );
}
