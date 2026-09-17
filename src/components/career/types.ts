// CareerView 表示当前页面选中的模块，比如："resume"代表当前展示“简历中心”。
export type CareerView =
    | "dashboard"
    | "resume"
    | "rag"
    | "jd-match"
    | "interview"
    | "applications"
    | "agent-chat";
// ApplicationItem 表示一个投递记录，比如：
// {
//   company: "字节跳动",
//   position: "前端开发工程师",
//   status: "一面",
//   matchScore: 86
// }
export interface ApplicationItem {
    id: string;
    company: string;
    position: string;
    status: "待投递" | "已投递" | "笔试" | "一面" | "二面" | "HR面" | "Offer" | "已结束";
    matchScore: number;
}
