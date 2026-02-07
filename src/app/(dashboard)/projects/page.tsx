// Server Component - 数据在服务端获取，零客户端 JS
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FolderOpen, Folder } from "lucide-react";
import { getServerAuthContext } from "@/lib/auth-server";
import { listProjects } from "@/services/project.service";

export default async function ProjectsPage() {
  // 服务端认证
  const auth = await getServerAuthContext();
  if (!auth) {
    redirect("/login");
  }

  // 服务端获取翻译
  const t = await getTranslations();

  // 调用 Service 层获取数据
  const { projects } = await listProjects({
    companyUuid: auth.companyUuid,
    skip: 0,
    take: 100,
  });

  // 转换数据格式
  const projectList = projects.map((p) => ({
    uuid: p.uuid,
    name: p.name,
    description: p.description,
    counts: {
      ideas: p._count.ideas,
      tasks: p._count.tasks,
      documents: p._count.documents,
    },
  }));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2C2C2C]">
            {t("projects.title")}
          </h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">
            {t("projects.subtitle")}
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-[#C67A52] hover:bg-[#B56A42] text-white">
            <Plus className="mr-2 h-4 w-4" />
            {t("projects.newProject")}
          </Button>
        </Link>
      </div>

      {/* Projects Grid */}
      {projectList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-[#E5E0D8]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F2EC]">
            <FolderOpen className="h-8 w-8 text-[#C67A52]" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-[#2C2C2C]">
            {t("projects.noProjects")}
          </h3>
          <p className="mb-6 max-w-sm text-sm text-[#6B6B6B]">
            {t("projects.noProjectsDesc")}
          </p>
          <Link href="/projects/new">
            <Button className="bg-[#C67A52] hover:bg-[#B56A42] text-white">
              {t("projects.createFirst")}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectList.map((project) => (
            <Link key={project.uuid} href={`/projects/${project.uuid}`}>
              <Card className="group cursor-pointer border-[#E5E0D8] p-5 transition-all hover:border-[#C67A52] hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3E0]">
                    <Folder className="h-5 w-5 text-[#C67A52]" />
                  </div>
                </div>
                <h3 className="mb-1 font-medium text-[#2C2C2C] group-hover:text-[#C67A52]">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-[#6B6B6B]">
                    {project.description}
                  </p>
                )}
                <div className="flex gap-4 text-xs text-[#9A9A9A]">
                  <span>
                    {project.counts.ideas} {t("projects.ideas")}
                  </span>
                  <span>
                    {project.counts.tasks} {t("projects.tasks")}
                  </span>
                  <span>
                    {project.counts.documents} {t("projects.docs")}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
