
// import { NextResponse } from "next/server";

// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

// const applications = [
//     {
//         id: "app_001",
//         company: "字节跳动",
//         position: "前端开发工程师",
//         status: "一面",
//         matchScore: 86,
//         nextAction: "复习 React 性能优化和项目架构",
//     },
//     {
//         id: "app_002",
//         company: "美团",
//         position: "AI 应用开发工程师",
//         status: "已投递",
//         matchScore: 81,
//         nextAction: "准备 Agent 项目讲解",
//     },
//     {
//         id: "app_003",
//         company: "阿里云",
//         position: "全栈开发工程师",
//         status: "笔试",
//         matchScore: 78,
//         nextAction: "补充 Node.js 和数据库八股",
//     },
// ];

// export async function GET() {
//     return NextResponse.json(
//         {
//             applications,
//         },
//         { status: 200 },
//     );
// }



// import { NextRequest, NextResponse } from "next/server";

// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

// interface ApplicationItem {
//     id: string;
//     company: string;
//     position: string;
//     status: string;
//     matchScore: number;
//     nextAction: string;
// }

// interface CreateApplicationBody {
//     company?: string;
//     position?: string;
//     status?: string;
//     matchScore?: number;
//     nextAction?: string;
// }

// const applications: ApplicationItem[] = [
//     {
//         id: "app_001",
//         company: "字节跳动",
//         position: "前端开发工程师",
//         status: "一面",
//         matchScore: 86,
//         nextAction: "复习 React 性能优化和项目架构",
//     },
//     {
//         id: "app_002",
//         company: "美团",
//         position: "AI 应用开发工程师",
//         status: "已投递",
//         matchScore: 81,
//         nextAction: "准备 Agent 项目讲解",
//     },
//     {
//         id: "app_003",
//         company: "阿里云",
//         position: "全栈开发工程师",
//         status: "笔试",
//         matchScore: 78,
//         nextAction: "补充 Node.js 和数据库八股",
//     },
// ];

// export async function GET() {
//     return NextResponse.json(
//         {
//             applications,
//         },
//         { status: 200 },
//     );
// }

// export async function POST(req: NextRequest) {
//     try {
//         const body = (await req.json()) as CreateApplicationBody;

//         const company = body.company?.trim();
//         const position = body.position?.trim();

//         if (!company || !position) {
//             return NextResponse.json(
//                 { error: "company and position are required" },
//                 { status: 400 },
//             );
//         }

//         const created: ApplicationItem = {
//             id: `app_${Date.now()}`,
//             company,
//             position,
//             status: body.status || "待投递",
//             matchScore: body.matchScore ?? 75,
//             nextAction: body.nextAction?.trim() || "完善岗位 JD 分析并准备面试问题",
//         };

//         applications.unshift(created);

//         return NextResponse.json(created, { status: 201 });
//     } catch {
//         return NextResponse.json(
//             { error: "Failed to create application" },
//             { status: 500 },
//         );
//     }
// }



// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/database/prisma";

// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

// interface CreateApplicationBody {
//     company?: string;
//     position?: string;
//     status?: string;
//     matchScore?: number;
//     nextAction?: string;
// }

// export async function GET() {
//     const applications = await prisma.jobApplication.findMany({
//         orderBy: {
//             createdAt: "desc",
//         },
//     });

//     return NextResponse.json(
//         {
//             applications,
//         },
//         { status: 200 },
//     );
// }

// export async function POST(req: NextRequest) {
//     try {
//         const body = (await req.json()) as CreateApplicationBody;

//         const company = body.company?.trim();
//         const position = body.position?.trim();

//         if (!company || !position) {
//             return NextResponse.json(
//                 { error: "company and position are required" },
//                 { status: 400 },
//             );
//         }

//         const created = await prisma.jobApplication.create({
//             data: {
//                 company,
//                 position,
//                 status: body.status || "待投递",
//                 matchScore: body.matchScore ?? 75,
//                 nextAction: body.nextAction?.trim() || "完善岗位 JD 分析并准备面试问题",
//             },
//         });

//         return NextResponse.json(created, { status: 201 });
//     } catch {
//         return NextResponse.json(
//             { error: "Failed to create application" },
//             { status: 500 },
//         );
//     }
// }




import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CreateApplicationBody {
  company?: string;
  position?: string;
  status?: string;
  matchScore?: number;
  nextAction?: string;
  jobDescriptionId?: string;
}

export async function GET() {
  const applications = await prisma.jobApplication.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      jobDescription: true,
    },
  });

  return NextResponse.json(
    {
      applications,
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateApplicationBody;

    const company = body.company?.trim();
    const position = body.position?.trim();

    if (!company || !position) {
      return NextResponse.json(
        { error: "company and position are required" },
        { status: 400 },
      );
    }

    const latestJD = body.jobDescriptionId
      ? await prisma.jobDescription.findUnique({
        where: {
          id: body.jobDescriptionId,
        },
      })
      : await prisma.jobDescription.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      });

    const created = await prisma.jobApplication.create({
      data: {
        company,
        position,
        status: body.status || "待投递",
        matchScore: latestJD?.matchScore ?? body.matchScore ?? 75,
        nextAction:
          body.nextAction?.trim() ||
          latestJD?.suggestions?.toString() ||
          "完善岗位 JD 分析并准备面试问题",
        jobDescriptionId: latestJD?.id,
      },
      include: {
        jobDescription: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create application:", error);

    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 },
    );
  }
}