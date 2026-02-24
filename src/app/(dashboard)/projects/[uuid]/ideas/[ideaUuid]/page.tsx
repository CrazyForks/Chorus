// src/app/(dashboard)/projects/[uuid]/ideas/[ideaUuid]/page.tsx
// Server Component - UUID obtained from URL

import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Monitor } from "lucide-react";
import { getServerAuthContext } from "@/lib/auth-server";
import { getIdea } from "@/services/idea.service";
import { projectExists } from "@/services/project.service";
import { checkIdeasAvailability } from "@/services/proposal.service";
import { getElaboration } from "@/services/elaboration.service";
import { IdeaActions } from "./idea-actions";
import { MarkdownContent } from "@/components/markdown-content";
import { ElaborationPanel } from "@/components/elaboration-panel";

// Status color configuration
const statusColors: Record<string, string> = {
  open: "bg-[#FFF3E0] text-[#E65100]",
  assigned: "bg-[#E3F2FD] text-[#1976D2]",
  in_progress: "bg-[#E8F5E9] text-[#5A9E6F]",
  pending_review: "bg-[#F3E5F5] text-[#7B1FA2]",
  completed: "bg-[#E0F2F1] text-[#00796B]",
  closed: "bg-[#F5F5F5] text-[#9A9A9A]",
};

// Status to i18n key mapping
const statusI18nKeys: Record<string, string> = {
  open: "open",
  assigned: "assigned",
  in_progress: "inProgress",
  pending_review: "pendingReview",
  completed: "completed",
  closed: "closed",
};

interface PageProps {
  params: Promise<{ uuid: string; ideaUuid: string }>;
}

export default async function IdeaDetailPage({ params }: PageProps) {
  const auth = await getServerAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const { uuid: projectUuid, ideaUuid } = await params;
  const t = await getTranslations();

  // Validate project exists
  const exists = await projectExists(auth.companyUuid, projectUuid);
  if (!exists) {
    redirect("/projects");
  }

  // Get Idea details
  const idea = await getIdea(auth.companyUuid, ideaUuid);
  if (!idea) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-[#6B6B6B]">{t("ideas.ideaNotFound")}</div>
        <Link href={`/projects/${projectUuid}/ideas`} className="mt-4 text-[#C67A52] hover:underline">
          {t("ideas.backToIdeas")}
        </Link>
      </div>
    );
  }

  // Check if Idea has already been used to create a Proposal
  const availabilityCheck = await checkIdeasAvailability(auth.companyUuid, [ideaUuid]);
  const isUsedInProposal = !availabilityCheck.available;

  // Load elaboration data
  let elaboration = null;
  try {
    elaboration = await getElaboration({
      companyUuid: auth.companyUuid,
      ideaUuid,
    });
  } catch {
    // Elaboration may not exist for this idea
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link href={`/projects/${projectUuid}/ideas`} className="text-[#6B6B6B] hover:text-[#2C2C2C]">
          {t("nav.ideas")}
        </Link>
        <ChevronRight className="h-4 w-4 text-[#9A9A9A]" />
        <span className="text-[#2C2C2C]">{idea.title}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <Badge className={statusColors[idea.status] || ""}>
              {t(`status.${statusI18nKeys[idea.status] || idea.status}`)}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold text-[#2C2C2C]">{idea.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-[#6B6B6B]">
            <span>{t("common.created")} {new Date(idea.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <IdeaActions
          ideaUuid={ideaUuid}
          ideaTitle={idea.title}
          ideaContent={idea.content}
          projectUuid={projectUuid}
          status={idea.status}
          currentUserUuid={auth.actorUuid}
          assignee={idea.assignee ? { type: idea.assignee.type, uuid: idea.assignee.uuid, name: idea.assignee.name } : null}
          isUsedInProposal={isUsedInProposal}
        />
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Elaboration Panel */}
          {elaboration && elaboration.rounds.length > 0 && (
            <Card className="border-[#E5E0D8] p-6 mb-6">
              <ElaborationPanel
                ideaUuid={ideaUuid}
                elaboration={elaboration}
              />
            </Card>
          )}

          <Card className="border-[#E5E0D8] p-6">
            <h2 className="mb-4 text-lg font-medium text-[#2C2C2C]">{t("common.content")}</h2>
            {idea.content ? (
              <div className="prose prose-sm max-w-none text-[#2C2C2C]">
                <MarkdownContent>{idea.content}</MarkdownContent>
              </div>
            ) : (
              <p className="text-sm text-[#9A9A9A] italic">{t("common.noContent")}</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Assignment */}
          <Card className="border-[#E5E0D8] p-4">
            <h3 className="mb-3 text-sm font-medium text-[#6B6B6B]">{t("common.assignment")}</h3>
            {idea.assignee ? (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E3F2FD]">
                  <Monitor className="h-4 w-4 text-[#1976D2]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#2C2C2C]">
                    {idea.assignee.name}
                  </div>
                  <div className="text-xs text-[#9A9A9A]">
                    {idea.assignee.type === "agent" ? t("common.agent") : t("common.user")}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#9A9A9A]">{t("common.unassigned")}</div>
            )}
          </Card>

          {/* Details */}
          <Card className="border-[#E5E0D8] p-4">
            <h3 className="mb-3 text-sm font-medium text-[#6B6B6B]">{t("common.details")}</h3>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-[#9A9A9A]">{t("common.status")}</dt>
                <dd className="font-medium text-[#2C2C2C]">
                  {t(`status.${statusI18nKeys[idea.status] || idea.status}`)}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[#9A9A9A]">{t("common.created")}</dt>
                <dd className="font-medium text-[#2C2C2C]">
                  {new Date(idea.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[#9A9A9A]">{t("common.updated")}</dt>
                <dd className="font-medium text-[#2C2C2C]">
                  {new Date(idea.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
