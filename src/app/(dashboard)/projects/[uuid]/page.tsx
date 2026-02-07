// src/app/(dashboard)/projects/[uuid]/page.tsx
// Server Component - 数据在服务端获取，零客户端 JS

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, LayoutGrid, FileText, ClipboardList, Settings, ChevronRight, Plus } from "lucide-react";
import { getServerAuthContext } from "@/lib/auth-server";
import { getProject, getProjectStats } from "@/services/project.service";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function ProjectOverviewPage({ params }: PageProps) {
  const auth = await getServerAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const { uuid } = await params;
  const t = await getTranslations();

  // 获取项目详情
  const project = await getProject(auth.companyUuid, uuid);
  if (!project) {
    notFound();
  }

  // 获取项目统计数据
  const stats = await getProjectStats(auth.companyUuid, uuid);

  const statCards = [
    {
      label: t("nav.ideas"),
      value: stats.ideas.total,
      subtext: t("projectOverview.ideasSubtext", { open: stats.ideas.open, inProgress: 0 }),
      href: `/projects/${uuid}/ideas`,
      color: "bg-[#FFF3E0]",
      iconColor: "text-[#E65100]",
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      label: t("nav.tasks"),
      value: stats.tasks.total,
      subtext: t("projectOverview.tasksSubtext", { open: stats.tasks.total - stats.tasks.inProgress, toVerify: 0 }),
      href: `/projects/${uuid}/tasks`,
      color: "bg-[#E3F2FD]",
      iconColor: "text-[#1976D2]",
      icon: <LayoutGrid className="h-5 w-5" />,
    },
    {
      label: t("nav.documents"),
      value: stats.documents.total,
      subtext: t("projectOverview.documentsSubtext"),
      href: `/projects/${uuid}/documents`,
      color: "bg-[#E8F5E9]",
      iconColor: "text-[#5A9E6F]",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: t("nav.proposals"),
      value: stats.proposals.total,
      subtext: t("projectOverview.proposalsSubtext", { pending: stats.proposals.pending }),
      href: `/projects/${uuid}/proposals`,
      color: "bg-[#F3E5F5]",
      iconColor: "text-[#7B1FA2]",
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[#2C2C2C]">
                {project.name}
              </h1>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#E8F5E9] text-[#5A9E6F]">
                active
              </span>
            </div>
            {project.description && (
              <p className="max-w-2xl text-sm text-[#6B6B6B]">
                {project.description}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            className="border-[#E5E0D8] text-[#6B6B6B] hover:bg-[#F5F2EC]"
          >
            <Settings className="mr-2 h-4 w-4" />
            {t("projectOverview.settings")}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="group cursor-pointer border-[#E5E0D8] p-5 transition-all hover:border-[#C67A52] hover:shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
                >
                  <span className={stat.iconColor}>{stat.icon}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#9A9A9A] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="text-2xl font-semibold text-[#2C2C2C]">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-[#6B6B6B]">
                {stat.label}
              </div>
              <div className="mt-1 text-xs text-[#9A9A9A]">{stat.subtext}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-[#E5E0D8] p-6">
        <h2 className="mb-4 text-lg font-medium text-[#2C2C2C]">
          {t("projectOverview.quickActions")}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href={`/projects/${uuid}/ideas`}>
            <Button
              variant="outline"
              className="border-[#E5E0D8] text-[#6B6B6B] hover:bg-[#F5F2EC]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("projectOverview.addIdea")}
            </Button>
          </Link>
          <Link href={`/projects/${uuid}/tasks`}>
            <Button
              variant="outline"
              className="border-[#E5E0D8] text-[#6B6B6B] hover:bg-[#F5F2EC]"
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              {t("projectOverview.viewKanban")}
            </Button>
          </Link>
          <Link href={`/projects/${uuid}/documents`}>
            <Button
              variant="outline"
              className="border-[#E5E0D8] text-[#6B6B6B] hover:bg-[#F5F2EC]"
            >
              <FileText className="mr-2 h-4 w-4" />
              {t("projectOverview.browseDocuments")}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
