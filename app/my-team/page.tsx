"use client";
import { useApp } from "@/components/app-provider";
import { ActivityCard } from "@/components/activity-card";
import { Empty } from "@/components/empty";
import { Activity } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Tab = "published" | "applications" | "joined" | "pending";
export default function MyTeamPage() {
  const { data, currentUser, review } = useApp(); const router = useRouter(); const [tab, setTab] = useState<Tab>("published"); const [error, setError] = useState("");
  useEffect(() => { if (!currentUser) router.replace("/login"); }, [currentUser, router]);
  if (!currentUser || !data) return <main className="page text-center text-slate-500">正在加载…</main>;
  const published = data.activities.filter((a) => a.creatorId === currentUser.id);
  const joined = data.activities.filter((a) => a.memberIds.includes(currentUser.id) && a.creatorId !== currentUser.id);
  const applications = data.applications.filter((p) => p.applicantId === currentUser.id).map((p) => ({ p, activity: data.activities.find((a) => a.id === p.activityId) })).filter((x): x is { p: typeof x.p; activity: NonNullable<typeof x.activity> } => Boolean(x.activity));
  const pending = data.applications.filter((p) => p.status === "pending" && data.activities.some((a) => a.id === p.activityId && a.creatorId === currentUser.id));
  const tabs: Array<[Tab, string, number]> = [["published", "我发布的", published.length], ["pending", "待我审批", pending.length], ["applications", "我的申请", applications.length], ["joined", "我已加入", joined.length]];
  function decide(id: string, approved: boolean) { try { review(id, approved); } catch (err) { setError(err instanceof Error ? err.message : "操作失败"); } }
  return <main className="page"><section><h1 className="text-2xl font-black text-ink">我的组队</h1><p className="mt-2 text-sm text-slate-500">管理你发起、申请和参与的每一次校园同行。</p></section><div className="mt-5 flex gap-2 overflow-x-auto pb-1">{tabs.map(([key, label, count]) => <button key={key} onClick={() => setTab(key)} className={`tag whitespace-nowrap ${tab === key ? "bg-brand text-white" : "bg-white text-slate-600 shadow-sm"}`}>{label} <span className="ml-1 opacity-70">{count}</span></button>)}</div>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
    {tab === "published" && <List activities={published} empty="你还没有发布活动，去分享一个计划吧。" />}
    {tab === "joined" && <List activities={joined} empty="还没有加入其他同学的活动。" />}
    {tab === "applications" && <section className="mt-5 space-y-3">{applications.length ? applications.map(({ p, activity }) => <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-ink">{activity.title}</p><p className="mt-1 text-sm text-slate-500">申请留言：{p.message || "未填写"}</p></div><span className={`tag ${p.status === "accepted" ? "bg-emerald-50 text-emerald-600" : p.status === "rejected" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>{p.status === "accepted" ? "已通过" : p.status === "rejected" ? "未通过" : "等待审核"}</span></div>) : <Empty title="还没有申请记录" description="去发现页看看正在招募的活动吧。" />}</section>}
    {tab === "pending" && <section className="mt-5 space-y-3">{pending.length ? pending.map((p) => { const applicant = data.users.find((u) => u.id === p.applicantId); const activity = data.activities.find((a) => a.id === p.activityId); return <div key={p.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-ink">{applicant?.nickname ?? "未知同学"} 申请加入《{activity?.title}》</p><p className="mt-1 text-sm text-slate-500">{applicant?.college} · {applicant?.grade} · {p.message || "未填写申请留言"}</p></div><div className="flex gap-2"><button className="btn-danger py-2" onClick={() => decide(p.id, false)}>拒绝</button><button className="btn-primary py-2" onClick={() => decide(p.id, true)}>同意加入</button></div></div>; }) : <Empty title="暂时没有待处理申请" description="有新同学申请时会在这里显示。" />}</section>}
  </main>;
}
function List({ activities, empty }: { activities: Activity[]; empty: string }) {
  return <section className="mt-5">{activities && activities.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</div> : <Empty title="这里还空着" description={empty} />}</section>;
}
