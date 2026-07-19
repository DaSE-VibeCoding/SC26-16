"use client";
import { useApp } from "@/components/app-provider";
import { CommentList } from "@/components/comment-list";
import { Empty } from "@/components/empty";
import { ReportModal } from "@/components/report-modal";
import { UserAvatar } from "@/components/user-avatar";
import { Evaluation } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";

const tone: Record<string, string> = { 自习搭子: "bg-sky-50 text-sky-600", 运动搭子: "bg-emerald-50 text-emerald-600", 饭搭子: "bg-orange-50 text-orange-600", 比赛搭子: "bg-violet-50 text-violet-600", 游戏搭子: "bg-rose-50 text-rose-600", 兴趣活动: "bg-amber-50 text-amber-600" };
const evaluationTags = ["准时", "沟通顺畅", "积极参与", "值得再组队", "临时变更", "未充分参与"];

export default function ActivityDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, currentUser, apply, exitActivity, withdrawApplication, cancelActivity, toggleFavorite, invite, submitEvaluation } = useApp();
  const [message, setMessage] = useState("");
  const [inviteeName, setInviteeName] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [evaluationTarget, setEvaluationTarget] = useState("");
  const [evaluationRating, setEvaluationRating] = useState<Evaluation["rating"]>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [evaluationComment, setEvaluationComment] = useState("");
  const activity = data?.activities.find((a) => a.id === params.id);
  if (!data) return <main className="page">正在加载…</main>;
  if (!activity) return <main className="page"><Empty title="活动不存在" description="它可能已在恢复演示数据时被清除。" /></main>;
  const appData = data;
  const activityId = activity.id;
  const creator = data.users.find((u) => u.id === activity.creatorId);
  const members = activity.memberIds.map((id) => data.users.find((u) => u.id === id)).filter((member): member is NonNullable<typeof member> => Boolean(member));
  const free = activity.maxMembers - activity.memberIds.length;
  const application = currentUser ? data.applications.find((a) => a.activityId === activity.id && a.applicantId === currentUser.id && a.status !== "withdrawn") : undefined;
  const isMember = currentUser ? activity.memberIds.includes(currentUser.id) : false;
  const isCreator = currentUser?.id === activity.creatorId;
  const isFavorite = currentUser ? data.favorites.some((item) => item.userId === currentUser.id && item.activityId === activity.id) : false;
  const activityEvaluations = data.evaluations.filter((item) => item.activityId === activity.id);
  const evaluationCandidates = currentUser && activity.status === "finished" ? members.filter((member) => member.id !== currentUser.id && !activityEvaluations.some((item) => item.reviewerId === currentUser.id && item.revieweeId === member.id)) : [];
  const canViewProfile = (userId: string) => userId === currentUser?.id || data.users.find((user) => user.id === userId)?.profileVisible;
  const currentTime = Date.now();
  const isOngoing = currentTime >= new Date(activity.startTime).getTime() && currentTime < new Date(activity.endTime).getTime();
  const isStartingSoon = !isOngoing && new Date(activity.startTime).getTime() - currentTime < 24 * 60 * 60 * 1000;
  const statusText = activity.status === "cancelled" ? "活动已取消" : activity.status === "finished" ? "活动已结束" : isOngoing ? "活动进行中" : activity.status === "full" ? "活动已满员" : isStartingSoon ? "即将开始" : `报名中 · 还差 ${Math.max(free, 0)} 人`;
  const statusClass = activity.status === "cancelled" || activity.status === "finished" ? "tag bg-slate-100 text-slate-500" : activity.status === "full" ? "tag bg-rose-50 text-rose-600" : "tag bg-emerald-50 text-emerald-600";

  function flash(messageText: string) {
    setOk(messageText);
    setError("");
    window.setTimeout(() => setOk(""), 2500);
  }
  function fail(err: unknown, fallback: string) {
    setError(err instanceof Error ? err.message : fallback);
    setOk("");
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      apply(activityId, message);
      setMessage("");
      flash("申请已提交，等待发起人审核");
    } catch (err) {
      fail(err, "申请失败");
    }
  }
  function leave() {
    if (confirm("确认退出该活动吗？")) {
      try {
        exitActivity(activityId);
        flash("已退出活动");
      } catch (err) {
        fail(err, "退出失败");
      }
    }
  }
  function cancel() {
    const reason = prompt("请填写取消原因，所有成员都会收到通知：");
    if (reason !== null) {
      try {
        cancelActivity(activityId, reason);
        router.push("/my-team");
      } catch (err) {
        fail(err, "取消失败");
      }
    }
  }
  function withdraw() {
    if (confirm("确认撤回这条申请吗？")) {
      try {
        if (application) withdrawApplication(application.id);
        flash("申请已撤回");
      } catch (err) {
        fail(err, "撤回失败");
      }
    }
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash("活动链接已复制，可分享给同学");
    } catch {
      flash("请从浏览器地址栏复制活动链接");
    }
  }
  function sendInvite() {
    try {
      const nickname = inviteeName.trim();
      if (!nickname) throw new Error("请输入要邀请的用户名");
      const invitee = appData.users.find((user) => user.nickname === nickname);
      if (!invitee) throw new Error("未找到该用户名");
      invite(activityId, invitee.id);
      setInviteeName("");
      flash("邀请已发送");
    } catch (err) {
      fail(err, "邀请失败");
    }
  }
  function toggleEvaluationTag(tag: string) {
    setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag].slice(0, 4));
  }
  function sendEvaluation(event: FormEvent) {
    event.preventDefault();
    try {
      if (!evaluationTarget) throw new Error("请选择要评价的成员");
      submitEvaluation({ activityId, revieweeId: evaluationTarget, rating: evaluationRating, tags: selectedTags, comment: evaluationComment });
      setEvaluationTarget("");
      setEvaluationRating(5);
      setSelectedTags([]);
      setEvaluationComment("");
      flash("评价已提交，信用分已按规则更新");
    } catch (err) {
      fail(err, "评价失败");
    }
  }

  return <main className="page max-w-4xl">
    <button className="mb-4 text-sm font-bold text-slate-500" onClick={() => router.back()}>← 返回活动列表</button>
    <div className="grid gap-5 lg:grid-cols-[1.55fr_.85fr]">
      <section className="card">
        <div className="flex flex-wrap justify-between gap-3"><span className={`tag ${tone[activity.category]}`}>{activity.category}</span><span className={statusClass}>{statusText}</span></div>
        <h1 className="mt-4 text-3xl font-black text-ink">{activity.title}</h1>
        <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-600">{activity.description}</p>
        {activity.cancelReason && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">取消原因：{activity.cancelReason}</p>}
        <div className="mt-7 grid gap-3 rounded-2xl bg-lavender p-4 text-sm text-indigo-900 sm:grid-cols-3">
          <p><b>◷ 时间</b><br />{new Date(activity.startTime).toLocaleString("zh-CN", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}<br />至 {new Date(activity.endTime).toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</p>
          <p><b>⌖ 地点</b><br />{activity.location}</p>
          <p><b>● 成员</b><br />{activity.memberIds.length} / {activity.maxMembers} 人</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{activity.tags.map((tag) => <span key={tag} className="tag bg-slate-100 text-slate-600">#{tag}</span>)}</div>
        {currentUser && <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button className={`btn py-2 ${isFavorite ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-lavender text-brand hover:bg-indigo-100"}`} onClick={() => { toggleFavorite(activityId); flash(isFavorite ? "已取消收藏" : "已收藏"); }}>{isFavorite ? "★ 已收藏" : "☆ 收藏"}</button>
          <button className="btn-soft py-2" onClick={share}>↗ 分享</button>
          <button className="btn-danger py-2" onClick={() => setShowReport(true)}>⚠ 举报</button>
        </div>}
        {ok && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600">{ok}</p>}
      </section>
      <aside className="space-y-5">
        <section className="card">
          <p className="text-xs font-bold text-slate-400">活动发起人</p>
          {creator && <div className="mt-2 flex items-center gap-3"><UserAvatar user={creator} size="h-11 w-11" /><h2 className="text-lg font-black text-ink">{creator.nickname}</h2></div>}
          {creator && canViewProfile(creator.id) ? <><p className="mt-2 text-sm text-slate-500">{creator.college} · {creator.grade}</p><p className="mt-1 text-xs text-slate-400">信用分 {creator.creditScore} · 已发起 {data.activities.filter((item) => item.creatorId === creator.id).length} 场活动</p><div className="mt-3 flex flex-wrap gap-1">{creator.interests.map((x) => <span className="tag bg-lavender text-brand" key={x}>{x}</span>)}</div></> : <p className="mt-1 text-sm text-slate-500">该同学选择了仅展示基本名片。</p>}
        </section>
        <section className="card">
          <h2 className="font-black text-ink">已加入成员</h2>
          <div className="mt-3 space-y-3">{members.map((member) => <div key={member.id} className="flex items-center gap-3"><UserAvatar user={member} /><div><p className="text-sm font-bold">{member.nickname}{member.id === activity.creatorId && <span className="ml-2 text-xs text-brand">发起人</span>}</p><p className="text-xs text-slate-500">{canViewProfile(member.id) ? member.college : "仅展示基本名片"}</p></div></div>)}</div>
        </section>
      </aside>
    </div>
    <section className="card mt-5">
      <h2 className="text-lg font-black text-ink">加入这个活动</h2>
      {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
      {!currentUser ? <p className="mt-3 text-sm text-slate-500">登录后即可申请加入。<button className="ml-2 font-bold text-brand" onClick={() => router.push("/login")}>去登录</button></p>
        : activity.status === "cancelled" ? <p className="mt-3 text-sm text-slate-500">该活动已取消。</p>
          : activity.status === "finished" ? <p className="mt-3 text-sm text-slate-500">该活动已结束，可在下方评价同行成员。</p>
            : isCreator ? <div className="mt-3 flex flex-wrap gap-3"><p className="flex-1 text-sm text-slate-500">你是发起人，可在“我的组队”处理申请，也可以邀请同学加入。</p><Link data-testid="activity-edit" className="btn-soft" href={`/create?edit=${activity.id}`}>编辑活动</Link><button data-testid="activity-cancel" className="btn-danger" onClick={cancel}>取消活动</button></div>
              : isMember ? <div className="mt-3 flex flex-wrap gap-3"><p className="flex-1 text-sm text-emerald-600">你已加入，记得准时到达并选择公共地点见面。</p><button data-testid="activity-exit" className="btn-danger" onClick={leave}>退出活动</button></div>
                : application ? <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-lavender p-4 text-sm text-brand"><p className="flex-1">你的申请状态：<b>{application.status === "pending" ? "等待发起人审核" : application.status === "accepted" ? "已通过" : application.status === "withdrawn" ? "已撤回" : "未通过"}</b></p>{application.status === "pending" && <button data-testid={`application-withdraw-${application.id}`} className="btn-soft py-2" onClick={withdraw}>撤回申请</button>}</div>
                  : <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={submit}><input className="field flex-1" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={100} placeholder="简单介绍一下自己或说明参与意愿（可选）" /><button data-testid="activity-apply-submit" className="btn-primary whitespace-nowrap">{free <= 0 ? "申请候补" : "提交申请"}</button></form>}
    </section>
    <section className="card mt-5 grid gap-5 sm:grid-cols-2">
      <div><h2 className="text-lg font-black text-ink">活动规则</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600"><li>• 请按约定时间抵达公共集合地点。</li><li>• 临时无法参加请尽早退出或联系发起人。</li><li>• 尊重其他成员，遇到问题可使用举报功能。</li></ul></div>
      <div><h2 className="text-lg font-black text-ink">活动时间线</h2><ol className="mt-3 space-y-2 text-sm text-slate-600"><li>✓ {new Date(activity.createdAt).toLocaleDateString("zh-CN")} 创建活动</li><li>○ {new Date(activity.startTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} 开始集合</li><li>○ {new Date(activity.endTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} 活动结束</li></ol></div>
    </section>
    {currentUser && isMember && activity.status !== "cancelled" && activity.status !== "finished" && <section className="card mt-5">
      <h2 className="text-lg font-black text-ink">邀请同学</h2>
      <p className="mt-1 text-sm text-slate-500">输入用户名进行邀请；如果用户不存在，会直接给出提示。</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input className="field flex-1" value={inviteeName} onChange={(event) => setInviteeName(event.target.value)} placeholder="输入用户名邀请同学加入" /><button className="btn-primary" onClick={sendInvite}>发送邀请</button></div>
    </section>}
    {currentUser && isMember && activity.status === "finished" && <section className="card mt-5">
      <h2 className="text-lg font-black text-ink">活动完成评价</h2>
      <p className="mt-1 text-sm text-slate-500">评价只开放给本次活动成员。5 星 +2 信用分，4 星 +1，3 星不变，1-2 星 -2。</p>
      {evaluationCandidates.length ? <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={sendEvaluation}><div><label className="label">评价对象</label><select className="field" value={evaluationTarget} onChange={(event) => setEvaluationTarget(event.target.value)}><option value="">选择成员</option>{evaluationCandidates.map((member) => <option value={member.id} key={member.id}>{member.nickname}</option>)}</select></div><div><label className="label">评分</label><select className="field" value={evaluationRating} onChange={(event) => setEvaluationRating(Number(event.target.value) as Evaluation["rating"])}>{[5, 4, 3, 2, 1].map((item) => <option value={item} key={item}>{item} 星</option>)}</select></div><div className="sm:col-span-2"><p className="label">评价标签</p><div className="flex flex-wrap gap-2">{evaluationTags.map((tag) => <button type="button" className={`tag ${selectedTags.includes(tag) ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => toggleEvaluationTag(tag)} key={tag}>{tag}</button>)}</div></div><div className="sm:col-span-2"><label className="label">补充评价</label><textarea className="field min-h-24" maxLength={160} value={evaluationComment} onChange={(event) => setEvaluationComment(event.target.value)} placeholder="可选：记录一次真实、有帮助的同行反馈" /></div><button data-testid="activity-evaluation-submit" className="btn-primary sm:col-span-2">提交评价</button></form> : <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">你已经完成了可评价成员，或本活动没有其他成员。</p>}
    </section>}
    <section className="card mt-5">
      <h2 className="text-lg font-black text-ink">本活动评价记录</h2>
      <div className="mt-3 space-y-3">{activityEvaluations.length ? activityEvaluations.map((evaluation) => {
        const reviewer = data.users.find((user) => user.id === evaluation.reviewerId);
        const reviewee = data.users.find((user) => user.id === evaluation.revieweeId);
        return <div className="rounded-2xl bg-slate-50 p-3" key={evaluation.id}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-ink">{reviewer?.nickname ?? "未知同学"} 评价 {reviewee?.nickname ?? "未知同学"}</p><span className="tag bg-amber-50 text-amber-700">{evaluation.rating} 星</span></div>{evaluation.tags.length > 0 && <p className="mt-2 text-xs text-slate-500">{evaluation.tags.join(" · ")}</p>}{evaluation.comment && <p className="mt-2 text-sm text-slate-600">{evaluation.comment}</p>}</div>;
      }) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">活动结束后，成员评价会显示在这里。</p>}</div>
    </section>
    <CommentList activityId={activity.id} />
    {showReport && <ReportModal targets={[{ type: "activity", id: activity.id, name: activity.title }, { type: "user", id: activity.creatorId, name: creator?.nickname ?? "未知同学" }]} onClose={() => setShowReport(false)} />}
  </main>;
}
