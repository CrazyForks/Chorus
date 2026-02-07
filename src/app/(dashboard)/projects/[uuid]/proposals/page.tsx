// src/app/(dashboard)/projects/[uuid]/proposals/page.tsx
// Server Component - UUID 从 URL 获取
// Container Model: Proposal 包含 documentDrafts 和 taskDrafts

import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServerAuthContext } from "@/lib/auth-server";
import { listProposals, type DocumentDraft, type TaskDraft } from "@/services/proposal.service";
import { projectExists } from "@/services/project.service";

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
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function ProposalsPage({ params, searchParams }: PageProps) {
  const auth = await getServerAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const { uuid: projectUuid } = await params;
  const { status: filter = "all" } = await searchParams;
  const t = await getTranslations();

  // 验证项目存在
  const exists = await projectExists(auth.companyUuid, projectUuid);
  if (!exists) {
    redirect("/projects");
  }

  // 获取所有 Proposals
  const { proposals: allProposals } = await listProposals({
    companyUuid: auth.companyUuid,
    projectUuid,
    skip: 0,
    take: 1000,
  });

  // 计算各状态数量
  const statusCounts = allProposals.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 根据 filter 过滤
  const filteredProposals = filter === "all"
    ? allProposals
    : allProposals.filter((p) => p.status === filter);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2C2C2C]">{t("proposals.title")}</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">
            {t("proposals.subtitle")}
          </p>
        </div>
        {statusCounts.pending > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-[#FFF3E0] px-3 py-2 text-sm text-[#E65100]">
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
            {statusCounts.pending} {t("proposals.pendingReview")}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border pb-4">
        <Link href={`/projects/${projectUuid}/proposals`}>
          <Button variant={filter === "all" ? "default" : "ghost"} size="sm">
            {t("proposals.all")} ({allProposals.length})
          </Button>
        </Link>
        {Object.keys(statusColors).map((status) => {
          const count = statusCounts[status] || 0;
          if (count === 0 && status !== "pending" && status !== "draft") return null;
          return (
            <Link key={status} href={`/projects/${projectUuid}/proposals?status=${status}`}>
              <Button variant={filter === status ? "default" : "ghost"} size="sm">
                {t(`status.${statusI18nKeys[status]}`)} ({count})
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-[#E5E0D8]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3E5F5]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-[#7B1FA2]"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-[#2C2C2C]">
            {t("proposals.noProposals")}
          </h3>
          <p className="mb-6 max-w-sm text-sm text-[#6B6B6B]">
            {t("proposals.noProposalsDesc")}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProposals.map((proposal) => {
            const documentDrafts = proposal.documentDrafts as DocumentDraft[] | null;
            const taskDrafts = proposal.taskDrafts as TaskDraft[] | null;
            const docCount = documentDrafts?.length || 0;
            const taskCount = taskDrafts?.length || 0;

            return (
              <Link key={proposal.uuid} href={`/projects/${projectUuid}/proposals/${proposal.uuid}`}>
                <Card className="group cursor-pointer border-[#E5E0D8] p-5 transition-all hover:border-[#C67A52] hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F5F2EC] text-2xl">
                        📋
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-medium text-[#2C2C2C] group-hover:text-[#C67A52]">
                            {proposal.title}
                          </h3>
                          <Badge className={statusColors[proposal.status] || ""}>
                            {t(`status.${statusI18nKeys[proposal.status] || proposal.status}`)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#6B6B6B]">
                          <span className="flex items-center gap-1">
                            {inputTypeI18nKeys[proposal.inputType]?.icon || "📥"}
                            {t("proposals.basedOn")} {t(inputTypeI18nKeys[proposal.inputType]?.key || "common.unknown")}
                          </span>
                          <span>·</span>
                          {docCount > 0 && (
                            <>
                              <span className="flex items-center gap-1">
                                <span>📄</span> {docCount}
                              </span>
                              <span>·</span>
                            </>
                          )}
                          {taskCount > 0 && (
                            <>
                              <span className="flex items-center gap-1">
                                <span>📝</span> {taskCount}
                              </span>
                              <span>·</span>
                            </>
                          )}
                          <span>
                            {new Date(proposal.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
