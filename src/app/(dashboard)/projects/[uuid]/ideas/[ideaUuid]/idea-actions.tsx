"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { UserPlus, FileText } from "lucide-react";
import { AssignIdeaModal } from "../assign-idea-modal";

interface IdeaActionsProps {
  ideaUuid: string;
  ideaTitle: string;
  ideaContent: string | null;
  projectUuid: string;
  status: string;
  currentUserUuid: string;
  assignee: { type: string; uuid: string; name: string } | null;
  isUsedInProposal?: boolean;
}

export function IdeaActions({
  ideaUuid,
  ideaTitle,
  ideaContent,
  projectUuid,
  status,
  currentUserUuid,
  assignee,
  isUsedInProposal,
}: IdeaActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Check if current user can create proposal (is the assignee and idea not used)
  const canCreateProposal = assignee?.uuid === currentUserUuid &&
    (status === "assigned" || status === "in_progress") &&
    !isUsedInProposal;

  // Show assign button for open ideas, and reassign/release for assigned ideas
  const canAssign = status === "open" || status === "assigned" || status === "in_progress";
  const isAssigned = !!assignee;

  return (
    <div className="flex gap-2">
      {canAssign && (
        <>
          <Button
            onClick={() => setShowAssignModal(true)}
            className={isAssigned
              ? "border-[#E5E0D8] text-[#6B6B6B]"
              : "bg-[#C67A52] hover:bg-[#B56A42] text-white"
            }
            variant={isAssigned ? "outline" : "default"}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isAssigned ? t("common.reassign") : t("common.assign")}
          </Button>
          {showAssignModal && (
            <AssignIdeaModal
              idea={{
                uuid: ideaUuid,
                title: ideaTitle,
                content: ideaContent,
                status,
                assignee,
              }}
              projectUuid={projectUuid}
              currentUserUuid={currentUserUuid}
              onClose={() => setShowAssignModal(false)}
            />
          )}
        </>
      )}
      {canCreateProposal && (
        <Link href={`/projects/${projectUuid}/proposals/new?ideaUuid=${ideaUuid}`}>
          <Button className="bg-[#C67A52] hover:bg-[#B56A42] text-white">
            <FileText className="mr-2 h-4 w-4" />
            {t("proposals.createProposal")}
          </Button>
        </Link>
      )}
      <Button
        variant="outline"
        className="border-[#E5E0D8] text-[#6B6B6B]"
        onClick={() => router.back()}
      >
        {t("common.back")}
      </Button>
    </div>
  );
}
