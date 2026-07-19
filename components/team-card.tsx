"use client";
import { isOnline, matchScore, sharedInterests } from "@/lib/match";
import { User } from "@/lib/types";

export function TeamCard({ user, viewer, action }: { user: User; viewer: User; action?: React.ReactNode }) {
  const profileVisible = user.id === viewer.id || user.profileVisible;
  const score = matchScore(viewer, user); const shared = sharedInterests(viewer, user); const online = isOnline(user.id);
  return <div className="card">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="relative grid h-11 w-11 place-items-center rounded-full bg-indigo-100 text-lg font-black text-brand">{user.nickname.slice(0, 1)}<span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${online ? "bg-emerald-400" : "bg-slate-300"}`} /></span>
        <div><p className="font-black text-ink">{user.nickname} <span className={`ml-1 text-xs font-bold ${online ? "text-emerald-500" : "text-slate-400"}`}>{online ? "在线" : "离线"}</span></p><p className="text-xs text-slate-500">{profileVisible ? `${user.college} · ${user.grade}` : "仅展示基本名片"}</p></div>
      </div>
      {profileVisible && <div className="text-right"><p className="text-xl font-black text-brand">{score}%</p><p className="text-xs text-slate-400">匹配度</p></div>}
    </div>
    {profileVisible && <div className="mt-3 flex flex-wrap gap-1.5">{user.interests.length ? user.interests.map((x) => <span key={x} className={`tag ${shared.includes(x) ? "bg-lavender text-brand" : "bg-slate-100 text-slate-500"}`}>{shared.includes(x) ? "★ " : ""}{x}</span>) : <span className="text-xs text-slate-400">TA 还没有填写兴趣标签</span>}</div>}
    {action}
  </div>;
}
