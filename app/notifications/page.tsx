"use client";
import { useApp } from "@/components/app-provider";
import { Empty } from "@/components/empty";
import { Notification } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const meta: Record<Notification["type"], [string, string, string]> = {
  application: ["✍", "新申请", "bg-sky-50 text-sky-600"],
  approved: ["✓", "审核通过", "bg-emerald-50 text-emerald-600"],
  rejected: ["✕", "审核结果", "bg-rose-50 text-rose-600"],
  exit: ["↩", "成员退出", "bg-amber-50 text-amber-600"],
  cancel: ["⊘", "活动取消", "bg-slate-100 text-slate-500"],
  invite: ["✉", "组队邀请", "bg-violet-50 text-violet-600"],
  reminder: ["◷", "活动提醒", "bg-teal-50 text-teal-600"],
  comment: ["❝", "新评论", "bg-orange-50 text-orange-600"],
  system: ["◈", "系统消息", "bg-indigo-50 text-indigo-600"],
};
const fmt = (value: string) => new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function NotificationsPage() {
  const { data, currentUser, loading, markNoticesRead, respondInvitation } = useApp(); const router = useRouter();
  const [tab, setTab] = useState<"all" | "unread">("all"); const [error, setError] = useState(""); const [ok, setOk] = useState("");
  useEffect(() => { if (!loading && !currentUser) router.replace("/login"); }, [loading, currentUser, router]);
  if (!currentUser || !data) return <main className="page text-center text-slate-500">正在加载…</main>;
  const mine = data.notifications.filter((n) => n.userId === currentUser.id);
  const unread = mine.filter((n) => !n.read);
  const list = tab === "unread" ? unread : mine;
  const invitations = data.invitations.filter((i) => i.inviteeId === currentUser.id && i.status === "pending" && data.activities.some((a) => a.id === i.activityId && a.status !== "cancelled" && a.status !== "finished"));
  function flash(message: string) { setOk(message); setError(""); window.setTimeout(() => setOk(""), 2500); }
  function respond(id: string, accept: boolean) { try { respondInvitation(id, accept); flash(accept ? "已接受邀请，快去“我的组队”看看吧" : "已婉拒该邀请"); } catch (err) { setError(err instanceof Error ? err.message : "操作失败"); setOk(""); } }
  function readAll() { try { markNoticesRead(); flash("已全部标记为已读"); } catch (err) { setError(err instanceof Error ? err.message : "操作失败"); } }
  return <main className="page max-w-3xl">
    <section className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-black text-ink">通知中心</h1><p className="mt-2 text-sm text-slate-500">报名进展、组队邀请和系统消息都会汇总到这里。</p></div><div className="flex gap-2"><Link href="/messages" className="btn-soft py-2">✉ 演示消息</Link><button className="btn-primary py-2" onClick={readAll} disabled={!unread.length}>全部标记已读</button></div></section>
    {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
    {ok && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600">{ok}</p>}
    {invitations.length > 0 && <section className="mt-5 space-y-3">{invitations.map((invitation) => { const inviter = data.users.find((u) => u.id === invitation.inviterId); const activity = data.activities.find((a) => a.id === invitation.activityId); return <div key={invitation.id} className="card border-2 border-lavender"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-ink">{inviter?.nickname ?? "有同学"} 邀请你加入《{activity?.title ?? "未知活动"}》</p><p className="mt-1 text-sm text-slate-500">{invitation.message || "TA 没有填写邀请留言"} · {fmt(invitation.createdAt)}</p></div><div className="flex gap-2"><button className="btn-danger py-2" onClick={() => respond(invitation.id, false)}>婉拒</button><button className="btn-primary py-2" onClick={() => respond(invitation.id, true)}>接受邀请</button></div></div>{activity && <Link href={`/activity/${activity.id}`} className="mt-3 inline-block text-sm font-bold text-brand">查看活动详情 →</Link>}</div>; })}</section>}
    <div className="mt-5 flex gap-2">{([["all", "全部"], ["unread", "未读"]] as const).map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`tag ${tab === key ? "bg-brand text-white" : "bg-white text-slate-600 shadow-sm"}`}>{label} <span className="ml-1 opacity-70">{key === "all" ? mine.length : unread.length}</span></button>)}</div>
    <section className="mt-4 space-y-3">{list.length ? list.map((n) => { const [icon, label, toneClass] = meta[n.type]; return <div key={n.id} className={`card flex items-start gap-3 ${n.read ? "" : "border-indigo-100 bg-lavender/60"}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg ${toneClass}`}>{icon}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`tag ${toneClass}`}>{label}</span><span className="text-xs text-slate-400">{fmt(n.createdAt)}</span>{!n.read && <span className="h-2 w-2 rounded-full bg-brand" />}</div><p className="mt-2 text-sm leading-6 text-slate-600">{n.content}</p></div></div>; }) : <Empty title={tab === "unread" ? "没有未读通知" : "还没有通知"} description={tab === "unread" ? "所有消息都看过啦。" : "去报名活动或邀请搭子，这里就会热闹起来。"} />}</section>
  </main>;
}
