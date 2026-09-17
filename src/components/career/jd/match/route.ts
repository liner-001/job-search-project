import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface JDMatchRequestBody {
    jdText?: string;
}
// 表示这个接口处理 POST 请求
export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as JDMatchRequestBody;
        const jdText = body.jdText?.trim();

        if (!jdText) {
            return NextResponse.json(
                { error: "jdText is required" },
                { status: 400 },
            );
        }

        const result = {
            matchScore: 84,
            level: "推荐投递",
            strengths: [
                "React / TypeScript 技术栈匹配",
                "具备 AI Agent 项目经验",
                "有前后端联调和流式响应经验",
            ],
            weaknesses: [
                "简历中缺少性能优化的量化指标",
                "后端工程化经验描述不足",
                "缺少线上部署和监控相关说明",
            ],
            suggestions: [
                "补充 SSE 流式响应优化的实现细节",
                "强调 LangGraph 状态图和工具调用设计",
                "增加 Docker / PostgreSQL / Prisma 的项目部署描述",
            ],
        };

        return NextResponse.json(result, { status: 200 });
    } catch {
        return NextResponse.json(
            { error: "Failed to analyze JD" },
            { status: 500 },
        );
    }
}