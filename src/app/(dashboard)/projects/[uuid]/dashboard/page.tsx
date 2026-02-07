// src/app/(dashboard)/projects/[uuid]/dashboard/page.tsx
// Server Component - 数据在服务端获取，UUID 从 URL 获取

import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, LayoutGrid, ClipboardList, FileText, Plus, CheckCircle, Monitor } from "lucide-react";
import { getServerAuthContext } from "@/lib/auth-server";
import { getProjectStats, projectExists } from "@/services/project.service";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const auth = await getServerAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const { uuid: projectUuid } = await params;
  const t = await getTranslations();

  // 验证项目存在
  const exists = await projectExists(auth.companyUuid, projectUuid);
  if (!exists) {
    redirect("/projects");
  }

  // 获取项目统计数据
  const stats = await getProjectStats(auth.companyUuid, projectUuid);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#2C2C2C]">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-[#6B6B6B]">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={`/projects/${projectUuid}/ideas`}>
          <Card className="cursor-pointer border-[#E5E0D8] p-5 transition-all hover:border-[#C67A52] hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3E0]">
              <Lightbulb className="h-5 w-5 text-[#E65100]" />
            </div>
            <div className="text-2xl font-semibold text-[#2C2C2C]">{stats.ideas.total}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B6B6B]">{t("nav.ideas")}</span>
              {stats.ideas.open > 0 && (
                <span className="rounded bg-[#FFF3E0] px-2 py-0.5 text-xs font-medium text-[#E65100]">
                  {stats.ideas.open} {t("status.open")}
                </span>
              )}
            </div>
          </Card>
        </Link>

        <Link href={`/projects/${projectUuid}/tasks`}>
          <Card className="cursor-pointer border-[#E5E0D8] p-5 transition-all hover:border-[#C67A52] hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#E3F2FD]">
              <LayoutGrid className="h-5 w-5 text-[#1976D2]" />
            </div>
            <div className="text-2xl font-semibold text-[#2C2C2C]">{stats.tasks.total}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B6B6B]">{t("nav.tasks")}</span>
              {stats.tasks.inProgress > 0 && (
                <span className="rounded bg-[#E8F5E9] px-2 py-0.5 text-xs font-medium text-[#5A9E6F]">
                  {stats.tasks.inProgress} {t("status.active")}
                </span>
              )}
            </div>
          </Card>
        </Link>

        <Link href={`/projects/${projectUuid}/proposals`}>
          <Card className="cursor-pointer border-[#E5E0D8] p-5 transition-all hover:border-[#C67A52] hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3E5F5]">
              <ClipboardList className="h-5 w-5 text-[#7B1FA2]" />
            </div>
            <div className="text-2xl font-semibold text-[#2C2C2C]">{stats.proposals.total}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B6B6B]">{t("nav.proposals")}</span>
              {stats.proposals.pending > 0 && (
                <span className="rounded bg-[#FFF3E0] px-2 py-0.5 text-xs font-medium text-[#E65100]">
                  {stats.proposals.pending} {t("status.pending")}
                </span>
              )}
            </div>
          </Card>
        </Link>

        <Link href={`/projects/${projectUuid}/documents`}>
          <Card className="cursor-pointer border-[#E5E0D8] p-5 transition-all hover:border-[#C67A52] hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F5E9]">
              <FileText className="h-5 w-5 text-[#5A9E6F]" />
            </div>
            <div className="text-2xl font-semibold text-[#2C2C2C]">{stats.documents.total}</div>
            <div className="text-sm text-[#6B6B6B]">{t("nav.documents")}</div>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[#E5E0D8] p-6">
          <h2 className="mb-4 text-lg font-medium text-[#2C2C2C]">{t("dashboard.quickActions")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href={`/projects/${projectUuid}/ideas`}>
              <Button variant="outline" className="w-full justify-start border-[#E5E0D8] text-[#6B6B6B] hover:border-[#C67A52] hover:text-[#C67A52]">
                <Plus className="mr-2 h-4 w-4" />
                {t("dashboard.addNewIdea")}
              </Button>
            </Link>
            <Link href={`/projects/${projectUuid}/proposals`}>
              <Button variant="outline" className="w-full justify-start border-[#E5E0D8] text-[#6B6B6B] hover:border-[#C67A52] hover:text-[#C67A52]">
                <CheckCircle className="mr-2 h-4 w-4" />
                {t("dashboard.reviewProposals")}
              </Button>
            </Link>
            <Link href={`/projects/${projectUuid}/tasks`}>
              <Button variant="outline" className="w-full justify-start border-[#E5E0D8] text-[#6B6B6B] hover:border-[#C67A52] hover:text-[#C67A52]">
                <LayoutGrid className="mr-2 h-4 w-4" />
                {t("dashboard.viewTaskBoard")}
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-start border-[#E5E0D8] text-[#6B6B6B] hover:border-[#C67A52] hover:text-[#C67A52]">
                <Monitor className="mr-2 h-4 w-4" />
                {t("dashboard.manageAgents")}
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="border-[#E5E0D8] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-[#2C2C2C]">{t("dashboard.recentActivity")}</h2>
            <Link href={`/projects/${projectUuid}/activity`} className="text-sm text-[#C67A52] hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          <div className="flex h-32 items-center justify-center text-sm text-[#9A9A9A]">
            {t("dashboard.activityPlaceholder")}
          </div>
        </Card>
      </div>
    </div>
  );
}
