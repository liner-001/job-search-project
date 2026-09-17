// import { NextResponse } from "next/server";

// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

// export async function GET() {
//     const result = {
//         stats: [
//             {
//                 label: "简历评分",
//                 value: "82",
//                 suffix: "/100",
//             },
//             {
//                 label: "JD 匹配均分",
//                 value: "76",
//                 suffix: "%",
//             },
//             {
//                 label: "投递岗位",
//                 value: "12",
//                 suffix: "个",
//             },
//             {
//                 label: "模拟面试",
//                 value: "5",
//                 suffix: "次",
//             },
//         ],
//         todos: [
//             "完善 React 项目经历中的性能优化描述",
//             "补充 LangGraph Agent 项目的工具调用亮点",
//             "准备三道高频前端八股题",
//         ],
//         agentSuggestion:
//             "当前简历技术栈较完整，但项目成果量化不足。建议补充响应速度提升、用户体验优化、Agent 工具调用准确率等可量化指标。",
//     };

//     return NextResponse.json(result, { status: 200 });
// }



// import { NextResponse } from "next/server";
// import prisma from "@/lib/database/prisma";

// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

// export async function GET() {
//     const applicationCount = await prisma.jobApplication.count();

//     const result = {
//         stats: [
//             {
//                 label: "简历评分",
//                 value: "82",
//                 suffix: "/100",
//             },
//             {
//                 label: "JD 匹配均分",
//                 value: "76",
//                 suffix: "%",
//             },
//             {
//                 label: "投递岗位",
//                 value: String(applicationCount),
//                 suffix: "个",
//             },
//             {
//                 label: "模拟面试",
//                 value: "5",
//                 suffix: "次",
//             },
//         ],
//         todos: [
//             "完善 React 项目经历中的性能优化描述",
//             "补充 LangGraph Agent 项目的工具调用亮点",
//             "准备三道高频前端八股题",
//         ],
//         agentSuggestion:
//             "当前简历技术栈较完整，但项目成果量化不足。建议补充响应速度提升、用户体验优化、Agent 工具调用准确率等可量化指标。",
//     };

//     return NextResponse.json(result, { status: 200 });
// }


import { NextResponse } from "next/server";
import prisma from "@/lib/database/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    const applicationCount = await prisma.jobApplication.count();

    const latestResume = await prisma.resume.findFirst({
        orderBy: {
            createdAt: "desc",
        },
    });

    const resumeScore = latestResume ? String(latestResume.score) : "--";

    const result = {
        stats: [
            {
                label: "简历评分",
                value: resumeScore,
                suffix: latestResume ? "/100" : "",
            },
            {
                label: "JD 匹配均分",
                value: "76",
                suffix: "%",
            },
            {
                label: "投递岗位",
                value: String(applicationCount),
                suffix: "个",
            },
            {
                label: "模拟面试",
                value: "5",
                suffix: "次",
            },
        ],
        todos: [
            "完善 React 项目经历中的性能优化描述",
            "补充 LangGraph Agent 项目的工具调用亮点",
            "准备三道高频前端八股题",
        ],
        agentSuggestion: latestResume
            ? `当前最新简历评分为 ${latestResume.score}/100，建议继续优化项目成果量化和 Agent 编排描述。`
            : "当前还没有上传简历，建议先在简历中心上传简历，建立后续 JD 匹配和模拟面试的基础上下文。",
    };

    return NextResponse.json(result, { status: 200 });
}