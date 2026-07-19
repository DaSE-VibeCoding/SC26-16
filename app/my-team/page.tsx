"use client";
import { useApp } from "@/components/app-provider";
import { ActivityCard } from "@/components/activity-card";
import { Empty } from "@/components/empty";
import { TeamCard } from "@/components/team-card";
import { UserAvatar } from "@/components/user-avatar";
import { matchScore } from "@/lib/match";
import { Activity, User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Tab = "published" | "applications" | "joined" | "waitlist" | "favorites" | "buddies" | "pending";
export default function MyTeamPage() {
  const { data, currentUser, loading, review, invite } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("published");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [inviteActivityId, setInviteActivityId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  useEffect(() => {
    if (!loading && !currentUser) router.replace("/login");
  }, [loading, currentUser, router]);
  if (!currentUser || !data) return <main className="page text-center text-slate-500">正在加载…</main>;
  const appData = data;
  const user = currentUser;
  const published = appData.activities.filter((a) => a.creatorId === user.id);
  const joined = appData.activities.filter((a) => a.memberIds.includes(user.id) && a.creatorId !== user.id);
  const favorites = appData.favorites.filter((f) => f.userId === user.id).map((f) => appData.activities.find((a) => a.id === f.activityId)).filter((a): a is Activity => Boolean(a));
  const buddies = appData.users.filter((u) => u.id !== user.id).sort((a, b) => matchScore(user, b) - matchScore(user, a));
  const applications = data.applications
    .filter((p) => p.applicantId === currentUser.id)
    .map((p) => ({ p, activity: appData.activities.find((a) => a.id === p.activityId) }))
    .filter((x): x is { p: typeof x.p; activity: NonNullable<typeof x.activity> } => Boolean(x.activity));
  const pending = appData.applications.filter((p) => p.status === "pending" && appData.activities.some((a) => a.id === p.activityId && a.creatorId === user.id && a.status !== "cancelled" && a.status !== "finished"));
  const waitlisted = appData.applications.filter((p) => p.applicantId === user.id && p.status === "pending").map((p) => appData.activities.find((a) => a.id === p.activityId)).filter((a): a is Activity => !!a && a.memberIds.length >= a.maxMembers);
  const tabs: Array<[Tab, string, number]> = [["published", "我发布的", published.length], ["pending", "待我审批", pending.length], ["applications", "我的申请", applications.length], ["joined", "我已加入", joined.length], ["waitlist", "候补中", waitlisted.length], ["favorites", "我收藏的", favorites.length], ["buddies", "搭子推荐", buddies.length]];
  const invitable = (u: User) => appData.activities.filter((a) => a.memberIds.includes(user.id) && a.status === "open" && a.memberIds.length < a.maxMembers && !a.memberIds.includes(u.id) && !appData.invitations.some((i) => i.activityId === a.id && i.inviteeId === u.id && i.status === "pending"));
  function flash(message: string) {
    setOk(message);
    setError("");
    window.setTimeout(() => setOk(""), 2500);
  }
  function decide(id: string, approved: boolean) {
    try {
      review(id, approved);
      flash(approved ? "已同意该申请" : "已拒绝该申请");
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
      setOk("");
    }
  }
  function openInvite(u: User) {
    const list = invitable(u);
    if (!list.length) {
      const alreadyInvited = appData.invitations.some((i) => i.inviteeId === u.id && i.status === "pending" && appData.activities.some((a) => a.id === i.activityId && a.memberIds.includes(user.id)));
      if (alreadyInvited) flash(`已向 ${u.nickname} 发出过邀请，等待对方回应`);
      else {
        setError("暂时没有可以邀请 TA 的活动：先发布或加入一个未满员的活动吧");
        setOk("");
      }
      return;
    }
    setError("");
    setInvitingId(u.id);
    setInviteActivityId(list[0].id);
    setInviteMessage("");
  }
  function sendInvite(u: User) {
    try {
      invite(inviteActivityId, u.id, inviteMessage);
      setInvitingId(null);
      flash(`已向 ${u.nickname} 发出邀请，等待对方回应`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "邀请失败");
      setOk("");
    }
  }
  return <main className="page">
    <section><h1 className="text-2xl font-black text-ink">我的组队</h1><p className="mt-2 text-sm text-slate-500">管理你发起、申请和参与的每一次校园同行。</p></section>
    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{tabs.map(([key, label, count]) => <button key={key} onClick={() => setTab(key)} className={`tag whitespace-nowrap ${tab === key ? "bg-brand text-white" : "bg-white text-slate-600 shadow-sm"}`}>{label} <span className="ml-1 opacity-70">{count}</span></button>)}</div>
    {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
    {ok && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600">{ok}</p>}
    {tab === "published" && <List activities={published} empty="你还没有发布活动，去分享一个计划吧。" />}
    {tab === "joined" && <List activities={joined} empty="还没有加入其他同学的活动。" />}
    {tab === "waitlist" && <List activities={waitlisted} empty="当你申请的活动满员时，会在这里等待候补转正。" />}
    {tab === "favorites" && <List activities={favorites} empty="在活动详情页点“☆ 收藏”，喜欢的活动会集中在这里。" />}
    {tab === "buddies" && <section className="mt-5"><p className="text-sm text-slate-500">根据共同兴趣为你推荐搭子，星标为你们的共同兴趣。</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{buddies.map((u) => <TeamCard key={u.id} user={u} viewer={user} action={invitingId === u.id ? <div className="mt-3 space-y-2 rounded-2xl bg-lavender/60 p-3"><select className="field py-2" value={inviteActivityId} onChange={(e) => setInviteActivityId(e.target.value)}>{invitable(u).map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select><input className="field py-2" value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} maxLength={60} placeholder="附上一句邀请留言（选填）" /><div className="flex gap-2"><button className="btn-soft flex-1 py-2" onClick={() => setInvitingId(null)}>收起</button><button className="btn-primary flex-1 py-2" onClick={() => sendInvite(u)}>发送邀请</button></div></div> : <button className="btn-primary mt-3 w-full py-2" onClick={() => openInvite(u)}>邀请组队</button>} />)}</div>{!buddies.length && <Empty title="还没有其他同学" description="等更多同学注册后，这里会按兴趣为你推荐搭子。" />}</section>}
    {tab === "applications" && <section className="mt-5 space-y-3">{applications.length ? applications.map(({ p, activity }) => <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-ink">{activity.title}</p><p className="mt-1 text-sm text-slate-500">申请留言：{p.message || "未填写"}</p></div><span className={`tag ${p.status === "accepted" ? "bg-emerald-50 text-emerald-600" : p.status === "rejected" || p.status === "cancelled" ? "bg-rose-50 text-rose-600" : p.status === "withdrawn" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-600"}`}>{p.status === "accepted" ? "已通过" : p.status === "rejected" ? "未通过" : p.status === "cancelled" ? "活动已取消" : p.status === "withdrawn" ? "已撤回" : "等待审核"}</span></div>) : <Empty title="还没有申请记录" description="去发现页看看正在招募的活动吧。" />}</section>}
    {tab === "pending" && <section className="mt-5 space-y-3">{pending.length ? pending.map((p) => {
      const applicant = appData.users.find((u) => u.id === p.applicantId);
      const activity = appData.activities.find((a) => a.id === p.activityId);
      return <div key={p.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3">{applicant && <UserAvatar user={applicant} />}<div><p className="font-black text-ink">{applicant?.nickname ?? "未知同学"} 申请加入《{activity?.title}》</p>{applicant ? <ApplicantPrivacyLine applicant={applicant} message={p.message} /> : <p className="mt-1 text-sm text-slate-500">{p.message || "未填写申请留言"}</p>}</div></div><div className="flex gap-2"><button className="btn-danger py-2" onClick={() => decide(p.id, false)}>拒绝</button><button className="btn-primary py-2" onClick={() => decide(p.id, true)}>同意加入</button></div></div>;
    }) : <Empty title="暂时没有待处理申请" description="有新同学申请时会在这里显示。" />}</section>}
  </main>;
}

function ApplicantPrivacyLine({ applicant, message }: { applicant: User; message: string }) {
  const fields = [
    applicant.applicationProfileVisibility.college ? applicant.college : null,
    applicant.applicationProfileVisibility.grade ? applicant.grade : null,
    applicant.applicationProfileVisibility.availability ? applicant.availability : null,
    applicant.applicationProfileVisibility.creditScore ? `信用分 ${applicant.creditScore}` : null,
  ].filter(Boolean);
  return <div className="mt-1 space-y-1 text-sm text-slate-500">
    <p>{fields.length ? fields.join(" · ") : "申请人未开放学院、年级、时间偏好或信用分"}</p>
    {applicant.applicationProfileVisibility.interests && applicant.interests.length > 0 && <p>兴趣：{applicant.interests.join("、")}</p>}
    {applicant.applicationProfileVisibility.bio && applicant.bio && <p>简介：{applicant.bio}</p>}
    <p>申请留言：{message || "未填写申请留言"}</p>
  </div>;
}

function List({ activities, empty }: { activities: Activity[]; empty: string }) {
  return <section className="mt-5">{activities && activities.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</div> : <Empty title="这里还空着" description={empty} />}</section>;
}
