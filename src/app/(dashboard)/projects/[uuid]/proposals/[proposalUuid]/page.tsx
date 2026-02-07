// src/app/(dashboard)/projects/[uuid]/proposals/[proposalUuid]/page.tsx
// Server Component - UUID 从 URL 获取
// Container Model: Proposal 包含 documentDrafts 和 taskDrafts

import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Streamdown } from "streamdown";
import { getServerAuthContext } from "@/lib/auth-server";
import { getProposal, type DocumentDraft, type TaskDraft } from "@/services/proposal.service";
import { projectExists } from "@/services/project.service";
import { ProposalActions } from "./proposal-actions";
import { ProposalEditor } from "./proposal-editor";

// 状态颜色配置
const statusColors: Record<string, string> = {
  draft: "bg-[#F5F5F5] text-[#6B6B6B]",
  pending: "bg-[#FFF3E0] text-[#E65100]",
  approved: "bg-[#E8F5E9] text-[#5A9E6F]",
  rejected: "bg-[#FFEBEE] text-[#D32F2F]",
  revised: "bg-[#E3F2FD] text-[#1976D2]",
};

// 状态到翻译 key 的映射
const statusI18nKeys: Record<string, string> = {
  draft: "draft",
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  revised: "revised",
};

// 输入类型到翻译 key 的映射
const inputTypeI18nKeys: Record<string, { key: string; icon: string }> = {
  idea: { key: "ideas.title", icon: "💡" },
  document: { key: "documents.title", icon: "📄" },
};

interface PageProps {
  params: Promise<{ uuid: string; proposalUuid: string }>;
}

export default async function ProposalDetailPage({ params }: PageProps) {
  const auth = await getServerAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const { uuid: projectUuid, proposalUuid } = await params;
  const t = await getTranslations();

  // 验证项目存在
  const exists = await projectExists(auth.companyUuid, projectUuid);
  if (!exists) {
    redirect("/projects");
  }

  // 获取 Proposal 详情
  const proposal = await getProposal(auth.companyUuid, proposalUuid);
  if (!proposal) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-[#6B6B6B]">{t("proposals.proposalNotFound")}</div>
        <Link href={`/projects/${projectUuid}/proposals`} className="mt-4 text-[#C67A52] hover:underline">
          {t("proposals.backToProposals")}
        </Link>
      </div>
    );
  }

  const documentDrafts = proposal.documentDrafts as DocumentDraft[] | null;
  const taskDrafts = proposal.taskDrafts as TaskDraft[] | null;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link href={`/projects/${projectUuid}/proposals`} className="text-[#6B6B6B] hover:text-[#2C2C2C]">
          {t("nav.proposals")}
        </Link>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-[#9A9A9A]"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-[#2C2C2C]">{proposal.title}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F5F2EC] text-2xl">
            📋
          </div>
          <div>
            <div className="mb-1 flex items-center gap-3">
              <Badge className={statusColors[proposal.status] || ""}>
                {t(`status.${statusI18nKeys[proposal.status] || proposal.status}`)}
              </Badge>
              <span className="text-sm text-[#6B6B6B]">
                {t("proposals.basedOn")} {t(inputTypeI18nKeys[proposal.inputType]?.key || "common.unknown")}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-[#2C2C2C]">{proposal.title}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-[#6B6B6B]">
              <span>{t("common.created")} {new Date(proposal.createdAt).toLocaleDateString()}</span>
              {proposal.createdBy && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3"
                    >
                      <path d="M12 8V4H8" />
                      <rect width="16" height="12" x="4" y="8" rx="2" />
                    </svg>
                    {proposal.createdBy.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <ProposalActions
          proposalUuid={proposalUuid}
          projectUuid={projectUuid}
          status={proposal.status}
        />
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {proposal.description && (
            <Card className="border-[#E5E0D8] p-6">
              <h2 className="mb-4 text-lg font-medium text-[#2C2C2C]">{t("common.description")}</h2>
              <div className="prose prose-sm max-w-none text-[#6B6B6B]">
                <Streamdown>{proposal.description}</Streamdown>
              </div>
            </Card>
          )}

          {/* Editable Document and Task Drafts */}
          <ProposalEditor
            proposalUuid={proposalUuid}
            projectUuid={projectUuid}
            status={proposal.status}
            documentDrafts={documentDrafts}
            taskDrafts={taskDrafts}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details */}
          <Card className="border-[#E5E0D8] p-4">
            <h3 className="mb-3 text-sm font-medium text-[#6B6B6B]">{t("common.details")}</h3>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-[#9A9A9A]">{t("common.status")}</dt>
                <dd className="font-medium text-[#2C2C2C]">
                  {t(`status.${statusI18nKeys[proposal.status] || proposal.status}`)}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[#9A9A9A]">{t("proposals.inputType")}</dt>
                <dd className="font-medium text-[#2C2C2C]">
                  {t(inputTypeI18nKeys[proposal.inputType]?.key || "common.unknown")}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[#9A9A9A]">{t("proposals.creatorType")}</dt>
                <dd className="font-medium text-[#2C2C2C]">
                  {proposal.createdByType === "agent" ? t("common.agent") : t("common.user")}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[#9A9A9A]">{t("common.created")}</dt>
                <dd className="font-medium text-[#2C2C2C]">
                  {new Date(proposal.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[#9A9A9A]">{t("common.updated")}</dt>
                <dd className="font-medium text-[#2C2C2C]">
                  {new Date(proposal.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Container Summary */}
          <Card className="border-[#E5E0D8] p-4">
            <h3 className="mb-3 text-sm font-medium text-[#6B6B6B]">{t("proposals.containerSummary")}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[#9A9A9A]">
                  <span>📄</span> {t("proposals.documents")}
                </span>
                <span className="font-medium text-[#2C2C2C]">{documentDrafts?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[#9A9A9A]">
                  <span>📝</span> {t("proposals.tasks")}
                </span>
                <span className="font-medium text-[#2C2C2C]">{taskDrafts?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[#9A9A9A]">
                  <span>💡</span> {t("proposals.inputs")}
                </span>
                <span className="font-medium text-[#2C2C2C]">{proposal.inputUuids?.length || 0}</span>
              </div>
            </div>
          </Card>

          {/* Review Info */}
          {proposal.review && (
            <Card className="border-[#E5E0D8] p-4">
              <h3 className="mb-3 text-sm font-medium text-[#6B6B6B]">{t("proposals.reviewInfo")}</h3>
              <dl className="space-y-2">
                <div className="flex justify-between text-sm">
                  <dt className="text-[#9A9A9A]">{t("proposals.reviewedBy")}</dt>
                  <dd className="font-medium text-[#2C2C2C]">
                    {proposal.review.reviewedBy?.name || "-"}
                  </dd>
                </div>
                {proposal.review.reviewedAt && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-[#9A9A9A]">{t("proposals.reviewedAt")}</dt>
                    <dd className="font-medium text-[#2C2C2C]">
                      {new Date(proposal.review.reviewedAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {proposal.review.reviewNote && (
                  <div className="mt-2">
                    <dt className="text-xs text-[#9A9A9A] mb-1">{t("proposals.reviewNote")}</dt>
                    <dd className="text-sm text-[#6B6B6B] bg-[#F5F2EC] p-2 rounded">
                      {proposal.review.reviewNote}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          {/* Draft Notice */}
          {proposal.status === "draft" && (
            <Card className="border-[#6B6B6B] bg-[#F5F5F5] p-4">
              <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                {t("proposals.draftStatus")}
              </div>
              <p className="mt-2 text-xs text-[#6B6B6B]">
                {t("proposals.draftNotice")}
              </p>
            </Card>
          )}

          {/* Pending Review Notice */}
          {proposal.status === "pending" && (
            <Card className="border-[#C67A52] bg-[#FFFBF8] p-4">
              <div className="flex items-center gap-2 text-sm text-[#E65100]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {t("proposals.awaitingReview")}
              </div>
              <p className="mt-2 text-xs text-[#6B6B6B]">
                {t("proposals.reviewInstructions")}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
