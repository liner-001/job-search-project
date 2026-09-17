// 投递管理模块把 Agent 的分析结果落到真实求职流程中，不只是一次性问答，
// 而是持续跟踪岗位、简历版本、面试记录和投递状态。
// "use client";

// import { useEffect, useState } from "react";

// interface ApplicationItem {
//   id: string;
//   company: string;
//   position: string;
//   status: string;
//   matchScore: number;
//   nextAction: string;
// }

// export const ApplicationPanel = () => {
//   const [applications, setApplications] = useState<ApplicationItem[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     const fetchApplications = async () => {
//       setIsLoading(true);

//       try {
//         const response = await fetch("/api/career/applications");

//         if (!response.ok) {
//           throw new Error("Failed to fetch applications");
//         }

//         const data = (await response.json()) as {
//           applications: ApplicationItem[];
//         };

//         setApplications(data.applications);
//       } catch (error) {
//         console.error("Failed to fetch applications:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchApplications();
//   }, []);

//   return (
//     <section>
//       <div className="mb-6">
//         <h2 className="text-2xl font-semibold">投递管理</h2>
//         <p className="mt-1 text-sm text-slate-500">
//           管理岗位投递状态、JD、简历版本和面试记录。
//         </p>
//       </div>

//       <div className="rounded-lg border border-slate-200 bg-white">
//         <div className="grid grid-cols-5 border-b border-slate-200 px-5 py-3 text-sm font-medium text-slate-500">
//           <span>公司</span>
//           <span>岗位</span>
//           <span>状态</span>
//           <span>匹配度</span>
//           <span>下一步行动</span>
//         </div>

//         {isLoading && (
//           <div className="px-5 py-6 text-sm text-slate-500">
//             正在加载投递记录...
//           </div>
//         )}

//         {!isLoading &&
//           applications.map((item) => (
//             <div
//               key={item.id}
//               className="grid grid-cols-5 items-center border-b border-slate-100 px-5 py-4 text-sm last:border-b-0"
//             >
//               <span className="font-medium">{item.company}</span>
//               <span className="text-slate-600">{item.position}</span>
//               <span>
//                 <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
//                   {item.status}
//                 </span>
//               </span>
//               <span>{item.matchScore}%</span>
//               <span className="text-slate-600">{item.nextAction}</span>
//             </div>
//           ))}
//       </div>
//     </section>
//   );
// };



// "use client";

// import { useEffect, useState } from "react";

// interface ApplicationItem {
//   id: string;
//   company: string;
//   position: string;
//   status: string;
//   matchScore: number;
//   nextAction: string;
// }

// export const ApplicationPanel = () => {
//   const [applications, setApplications] = useState<ApplicationItem[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isCreating, setIsCreating] = useState(false);

//   const [company, setCompany] = useState("");
//   const [position, setPosition] = useState("");
//   const [status, setStatus] = useState("待投递");
//   const [matchScore, setMatchScore] = useState(75);
//   const [nextAction, setNextAction] = useState("");

//   useEffect(() => {
//     const fetchApplications = async () => {
//       setIsLoading(true);

//       try {
//         const response = await fetch("/api/career/applications");

//         if (!response.ok) {
//           console.error("Failed to fetch applications", response.status);
//           return;
//         }

//         const data = (await response.json()) as {
//           applications: ApplicationItem[];
//         };

//         setApplications(data.applications);
//       } catch (error) {
//         console.error("Failed to fetch applications:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchApplications();
//   }, []);

//   const handleCreateApplication = async () => {
//     if (!company.trim() || !position.trim()) return;

//     setIsCreating(true);

//     try {
//       const response = await fetch("/api/career/applications", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           company,
//           position,
//           status,
//           matchScore,
//           nextAction,
//         }),
//       });

//       if (!response.ok) {
//         console.error("Failed to create application", response.status);
//         return;
//       }

//       const created = (await response.json()) as ApplicationItem;
//       setApplications((prev) => [created, ...prev]);

//       setCompany("");
//       setPosition("");
//       setStatus("待投递");
//       setMatchScore(75);
//       setNextAction("");
//     } catch (error) {
//       console.error("Failed to create application:", error);
//     } finally {
//       setIsCreating(false);
//     }
//   };

//   return (
//     <section>
//       <div className="mb-6">
//         <h2 className="text-2xl font-semibold">投递管理</h2>
//         <p className="mt-1 text-sm text-slate-500">
//           管理岗位投递状态、JD、简历版本和面试记录。
//         </p>
//       </div>

//       <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5">
//         <h3 className="font-medium">新增投递记录</h3>

//         <div className="mt-4 grid grid-cols-5 gap-3">
//           <input
//             value={company}
//             onChange={(e) => setCompany(e.target.value)}
//             placeholder="公司"
//             className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
//           />

//           <input
//             value={position}
//             onChange={(e) => setPosition(e.target.value)}
//             placeholder="岗位"
//             className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
//           />

//           <select
//             value={status}
//             onChange={(e) => setStatus(e.target.value)}
//             className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
//           >
//             <option value="待投递">待投递</option>
//             <option value="已投递">已投递</option>
//             <option value="笔试">笔试</option>
//             <option value="一面">一面</option>
//             <option value="二面">二面</option>
//             <option value="HR面">HR面</option>
//             <option value="Offer">Offer</option>
//             <option value="已结束">已结束</option>
//           </select>

//           <input
//             type="number"
//             value={matchScore}
//             onChange={(e) => setMatchScore(Number(e.target.value))}
//             min={0}
//             max={100}
//             className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
//           />

//           <button
//             type="button"
//             onClick={handleCreateApplication}
//             disabled={!company.trim() || !position.trim() || isCreating}
//             className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
//           >
//             {isCreating ? "添加中..." : "添加"}
//           </button>
//         </div>

//         <input
//           value={nextAction}
//           onChange={(e) => setNextAction(e.target.value)}
//           placeholder="下一步行动，例如：准备 React 性能优化问题"
//           className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
//         />
//       </div>

//       <div className="rounded-lg border border-slate-200 bg-white">
//         <div className="grid grid-cols-5 border-b border-slate-200 px-5 py-3 text-sm font-medium text-slate-500">
//           <span>公司</span>
//           <span>岗位</span>
//           <span>状态</span>
//           <span>匹配度</span>
//           <span>下一步行动</span>
//         </div>

//         {isLoading && (
//           <div className="px-5 py-6 text-sm text-slate-500">
//             正在加载投递记录...
//           </div>
//         )}

//         {!isLoading &&
//           applications.map((item) => (
//             <div
//               key={item.id}
//               className="grid grid-cols-5 items-center border-b border-slate-100 px-5 py-4 text-sm last:border-b-0"
//             >
//               <span className="font-medium">{item.company}</span>
//               <span className="text-slate-600">{item.position}</span>
//               <span>
//                 <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
//                   {item.status}
//                 </span>
//               </span>
//               <span>{item.matchScore}%</span>
//               <span className="text-slate-600">{item.nextAction}</span>
//             </div>
//           ))}
//       </div>
//     </section>
//   );
// };




"use client";

import { useEffect, useState } from "react";

interface LinkedJobDescription {
  id: string;
  title: string | null;
  matchScore: number;
  level: string;
}

interface ApplicationItem {
  id: string;
  company: string;
  position: string;
  status: string;
  matchScore: number;
  nextAction: string | null;
  jobDescription: LinkedJobDescription | null;
}

export const ApplicationPanel = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("待投递");
  const [matchScore, setMatchScore] = useState(75);
  const [nextAction, setNextAction] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/career/applications");

        if (!response.ok) {
          console.error("Failed to fetch applications", response.status);
          return;
        }

        const data = (await response.json()) as {
          applications: ApplicationItem[];
        };

        setApplications(data.applications);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleCreateApplication = async () => {
    if (!company.trim() || !position.trim()) return;

    setIsCreating(true);

    try {
      const response = await fetch("/api/career/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company,
          position,
          status,
          matchScore,
          nextAction,
        }),
      });

      if (!response.ok) {
        console.error("Failed to create application", response.status);
        return;
      }

      const created = (await response.json()) as ApplicationItem;
      setApplications((prev) => [created, ...prev]);

      setCompany("");
      setPosition("");
      setStatus("待投递");
      setMatchScore(75);
      setNextAction("");
    } catch (error) {
      console.error("Failed to create application:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">投递管理</h2>
        <p className="mt-1 text-sm text-slate-500">
          管理岗位投递状态，并关联最近一次 JD 匹配分析结果。
        </p>
      </div>

      <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="font-medium">新增投递记录</h3>

        <div className="mt-4 grid grid-cols-5 gap-3">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="公司"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />

          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="岗位"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          >
            <option value="待投递">待投递</option>
            <option value="已投递">已投递</option>
            <option value="笔试">笔试</option>
            <option value="一面">一面</option>
            <option value="二面">二面</option>
            <option value="HR面">HR面</option>
            <option value="Offer">Offer</option>
            <option value="已结束">已结束</option>
          </select>

          <input
            type="number"
            value={matchScore}
            onChange={(e) => setMatchScore(Number(e.target.value))}
            min={0}
            max={100}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />

          <button
            type="button"
            onClick={handleCreateApplication}
            disabled={!company.trim() || !position.trim() || isCreating}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isCreating ? "添加中..." : "添加"}
          </button>
        </div>

        <input
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          placeholder="下一步行动，不填则自动使用最近 JD 分析建议"
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />

        <p className="mt-2 text-xs text-slate-500">
          如果你刚做过 JD 匹配，新增投递记录会自动关联最近一次 JD 分析。
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-6 border-b border-slate-200 px-5 py-3 text-sm font-medium text-slate-500">
          <span>公司</span>
          <span>岗位</span>
          <span>状态</span>
          <span>匹配度</span>
          <span>关联 JD</span>
          <span>下一步行动</span>
        </div>

        {isLoading && (
          <div className="px-5 py-6 text-sm text-slate-500">
            正在加载投递记录...
          </div>
        )}

        {!isLoading &&
          applications.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-6 items-center border-b border-slate-100 px-5 py-4 text-sm last:border-b-0"
            >
              <span className="font-medium">{item.company}</span>
              <span className="text-slate-600">{item.position}</span>
              <span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  {item.status}
                </span>
              </span>
              <span>{item.matchScore}%</span>
              <span className="text-slate-600">
                {item.jobDescription
                  ? `${item.jobDescription.level} / ${item.jobDescription.matchScore}%`
                  : "未关联"}
              </span>
              <span className="text-slate-600">
                {item.nextAction || "暂无"}
              </span>
            </div>
          ))}
      </div>
    </section>
  );
};