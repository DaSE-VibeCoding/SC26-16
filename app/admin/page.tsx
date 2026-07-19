"use client";
import { Empty } from "@/components/empty";
import { useApp } from "@/components/app-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const { data, currentUser, resolveReport, moderateActivity } = useApp();
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => {
    if (!currentUser) router.replace("/login");
    else if (!currentUser.isAdmin) router.replace("/");
  }, [currentUser, router]);
  if (!data || !currentUser) return <main className="page text-center text-slate-500">正在加载…</main>;
  if (!currentUser.isAdmin) return <main className="page text-center text-slate-500">正在返回发现页…</main>;
  const pendingReports = data.reports.filter((item) => item.status === "pending");
  const pendingApplications = data.applications.filter((item) => item.status === "pending").length;
  const openActivities = data.activities.filter((item) => item.status === "open").length;
  const cancelledActivities = data.activities.filter((item) => item.status === "cancelled").length;
  const recentActivities = data.activities.slice(0, 8);
  function resolve(id: string, action: "resolved" | "dismissed") {
    try {
      resolveReport(id, action);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "处理失败");
    }
  }
  function moderate(activityId: string, action: "cancel" | "reopen") {
    try {
      moderateActivity(activityId, action);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "处理失败");
    }
  }
  return <main className="page max-w-4xl">
    <h1 className="text-2xl font-black text-ink">管理员演示视角</h1>
    <p className="mt-2 text-sm text-slate-500">课堂演示用本地管理员视图，用于展示活动审核、举报处理和数据概览，不代表真实后台权限系统。</p>
    {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
    <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["用户数", data.users.length], ["活动数", data.activities.length], ["开放活动", openActivities], ["待审批申请", pendingApplications], ["待处理举报", pendingReports.length], ["已取消活动", cancelledActivities], ["评价数", data.evaluations.length], ["通知数", data.notifications.length]].map(([label, value]) => <div className="card p-4 text-center" key={String(label)}><p className="text-2xl font-black text-brand">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</section>
    <section className="card mt-5">
      <h2 className="text-lg font-black text-ink">活动审核</h2>
      <p className="mt-1 text-sm text-slate-500">查看最近活动状态，并在演示环境中下架或恢复展示。</p>
      <div className="mt-4 space-y-3">{recentActivities.map((activity) => <div className="rounded-2xl bg-slate-50 p-3" key={activity.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><Link className="font-black text-ink hover:text-brand" href={`/activity/${activity.id}`}>{activity.title}</Link><p className="mt-1 text-xs text-slate-500">{activity.category} · {activity.location} · {activity.status}</p></div><div className="flex gap-2">{activity.status === "cancelled" ? <button className="btn-soft py-2" onClick={() => moderate(activity.id, "reopen")}>恢复展示</button> : <button className="btn-danger py-2" onClick={() => moderate(activity.id, "cancel")}>下架活动</button>}</div></div>{activity.cancelReason && <p className="mt-2 text-xs text-rose-600">原因：{activity.cancelReason}</p>}</div>)}</div>
    </section>
    <section className="mt-5 space-y-3">
      <h2 className="text-lg font-black text-ink">举报处理</h2>
      {pendingReports.length ? pendingReports.map((report) => {
        const targetActivity = report.targetType === "activity" ? data.activities.find((item) => item.id === report.targetId) : undefined;
        const targetUser = report.targetType === "user" ? data.users.find((item) => item.id === report.targetId) : undefined;
        const reporter = data.users.find((item) => item.id === report.reporterId);
        return <div className="card" key={report.id}><p className="font-black text-ink">{report.targetType === "activity" ? targetActivity?.title ?? "已删除活动" : targetUser?.nickname ?? "未知用户"}</p><p className="mt-2 text-sm text-slate-600">举报人：{reporter?.nickname ?? "未知同学"}</p><p className="mt-1 text-sm text-slate-600">举报原因：{report.reason}</p>{report.detail && <p className="mt-1 text-sm text-slate-500">补充说明：{report.detail}</p>}<div className="mt-4 flex gap-2"><button className="btn-danger py-2" onClick={() => resolve(report.id, "resolved")}>{report.targetType === "activity" ? "下架活动" : "标记已处理"}</button><button className="btn-soft py-2" onClick={() => resolve(report.id, "dismissed")}>忽略举报</button></div></div>;
      }) : <Empty title="没有待处理举报" description="提交活动或用户举报后会显示在这里。" />}
    </section>
  </main>;
}
