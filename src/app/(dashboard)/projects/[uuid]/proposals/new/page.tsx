// src/app/(dashboard)/projects/[uuid]/proposals/new/page.tsx
// Server Component - 创建新的 Proposal

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerAuthContext } from "@/lib/auth-server";
import { projectExists } from "@/services/project.service";
import { listIdeas } from "@/services/idea.service";
import { checkIdeasAvailability } from "@/services/proposal.service";
import { CreateProposalForm } from "./create-proposal-form";

interface PageProps {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ ideaUuid?: string }>;
}

export default async function NewProposalPage({ params, searchParams }: PageProps) {
  const auth = await getServerAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const { uuid: projectUuid } = await params;
  const { ideaUuid } = await searchParams;
  const t = await getTranslations();

  // 验证项目存在
  const exists = await projectExists(auth.companyUuid, projectUuid);
  if (!exists) {
    redirect("/projects");
  }

  // 获取用户已认领的 Ideas（只有认领者可以创建 Proposal）
  const { ideas } = await listIdeas({
    companyUuid: auth.companyUuid,
    projectUuid,
    skip: 0,
    take: 100,
    assignedToMe: true,
    actorUuid: auth.actorUuid,
    actorType: auth.type,
  });

  // 过滤出尚未被使用的 ideas
  const ideaUuids = ideas.map(idea => idea.uuid);
  const availabilityCheck = ideaUuids.length > 0
    ? await checkIdeasAvailability(auth.companyUuid, ideaUuids)
    : { usedIdeas: [] };

  const usedIdeaUuids = new Set(availabilityCheck.usedIdeas.map(u => u.uuid));
  const availableIdeas = ideas.filter(idea => !usedIdeaUuids.has(idea.uuid));

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-[#2C2C2C]">
          {t("proposals.createProposal")}
        </h1>
        <CreateProposalForm
          projectUuid={projectUuid}
          availableIdeas={availableIdeas}
          preselectedIdeaUuid={ideaUuid}
        />
      </div>
    </div>
  );
}
