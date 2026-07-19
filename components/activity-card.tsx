"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "./app-provider";
import { rememberActivity } from "@/lib/discover";
import { Activity } from "@/lib/types";

const tones: Record<string, string> = {
  自习搭子: "bg-sky-50 text-sky-600",
  运动搭子: "bg-emerald-50 text-emerald-600",
  饭搭子: "bg-orange-50 text-orange-600",
  比赛搭子: "bg-violet-50 text-violet-600",
  游戏搭子: "bg-rose-50 text-rose-600",
  兴趣活动: "bg-amber-50 text-amber-600",
};

function statusLabel(activity: Activity, free: number) {
  if (activity.status === "cancelled") return { text: "已取消", tone: "bg-slate-100 text-slate-500" };
  if (activity.status === "finished") return { text: "已结束", tone: "bg-slate-100 text-slate-500" };
  if (free === 0) return { text: "已满员", tone: "bg-rose-50 text-rose-600" };
  const startsAt = new Date(activity.startTime).getTime();
  if (startsAt - Date.now() < 24 * 60 * 60 * 1000) return { text: `余 ${free} 位 · 即将开始`, tone: "bg-amber-50 text-amber-700" };
  return { text: `余 ${free} 位`, tone: "bg-emerald-50 text-emerald-600" };
}

export function ActivityCard({ activity }: { activity: Activity }) {
  const { data, currentUser, toggleFavorite } = useApp();
  const [feedback, setFeedback] = useState("");
  const free = Math.max(0, activity.maxMembers - activity.memberIds.length);
  const status = statusLabel(activity, free);
  const favorite = useMemo(() => Boolean(currentUser && data?.favorites.some((item) => item.userId === currentUser.id && item.activityId === activity.id)), [activity.id, currentUser, data?.favorites]);
  const formattedTime = new Date(activity.startTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
  const formattedEnd = new Date(activity.endTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

  const handleFavorite = () => {
    if (!currentUser) {
      setFeedback("登录后收藏");
      window.setTimeout(() => setFeedback(""), 1600);
      return;
    }
    const added = toggleFavorite(activity.id);
    setFeedback(added ? "已收藏" : "已取消收藏");
    window.setTimeout(() => setFeedback(""), 1600);
  };

  return <article className="card group relative flex h-full flex-col transition duration-200 hover:-translate-y-1 hover:shadow-xl">
    <div className="mb-3 flex items-start justify-between gap-3">
      <span className={`tag ${tones[activity.category] ?? "bg-slate-100 text-slate-600"}`}>{activity.category}</span>
      <div className="flex items-center gap-2">
        <span className={`tag ${status.tone}`}>{status.text}</span>
        <button type="button" onClick={handleFavorite} aria-label={favorite ? "取消收藏活动" : "收藏活动"} className={`grid h-9 w-9 place-items-center rounded-xl border text-lg transition hover:scale-105 ${favorite ? "border-amber-200 bg-amber-50 text-amber-500" : "border-slate-100 bg-slate-50 text-slate-400"}`}>
          {favorite ? "★" : "☆"}
        </button>
      </div>
    </div>
    <Link href={`/activity/${activity.id}`} onClick={() => rememberActivity(activity.id)} className="flex flex-1 flex-col">
      <h3 className="line-clamp-2 text-lg font-black text-ink group-hover:text-brand">{activity.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{activity.description}</p>
      <div className="mt-4 space-y-1.5 text-sm text-slate-600">
        <p>◷ {formattedTime} - {formattedEnd}</p>
        <p className="truncate">⌖ {activity.location}</p>
        <p>◉ {activity.memberIds.length}/{activity.maxMembers} 人 · {free ? `还可加入 ${free} 人` : "等待下一场活动"}</p>
        {activity.cancelReason && <p className="line-clamp-1 text-xs text-rose-500">取消原因：{activity.cancelReason}</p>}
      </div>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">{activity.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">#{tag}</span>)}</div>
    </Link>
    {feedback && <span role="status" className="absolute bottom-4 right-4 rounded-xl bg-ink px-3 py-2 text-xs font-bold text-white shadow-lg">{feedback}</span>}
  </article>;
}
