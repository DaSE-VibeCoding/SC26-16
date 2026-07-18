import Link from "next/link";
import { Activity } from "@/lib/types";

const tones: Record<string, string> = { "自习搭子": "bg-sky-50 text-sky-600", "运动搭子": "bg-emerald-50 text-emerald-600", "饭搭子": "bg-orange-50 text-orange-600", "比赛搭子": "bg-violet-50 text-violet-600", "游戏搭子": "bg-rose-50 text-rose-600", "兴趣活动": "bg-amber-50 text-amber-600" };
export function ActivityCard({ activity }: { activity: Activity }) {
  const free = Math.max(0, activity.maxMembers - activity.memberIds.length);
  return <Link href={`/activity/${activity.id}`} className="card group block transition hover:-translate-y-1">
    <div className="mb-3 flex items-start justify-between gap-3"><span className={`tag ${tones[activity.category]}`}>{activity.category}</span><span className={activity.status === "cancelled" ? "tag bg-slate-100 text-slate-500" : free ? "tag bg-emerald-50 text-emerald-600" : "tag bg-rose-50 text-rose-600"}>{activity.status === "cancelled" ? "已取消" : free ? `余 ${free} 位` : "已满员"}</span></div>
    <h3 className="line-clamp-1 text-lg font-black text-ink group-hover:text-brand">{activity.title}</h3>
    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{activity.description}</p>
    <div className="mt-4 space-y-1.5 text-sm text-slate-600"><p>◷ {new Date(activity.startTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p><p>⌖ {activity.location}</p><p>◉ {activity.memberIds.length}/{activity.maxMembers} 人</p></div>
    <div className="mt-4 flex flex-wrap gap-1.5">{activity.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">#{tag}</span>)}</div>
  </Link>;
}
