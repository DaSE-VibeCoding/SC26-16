"use client";
import { useApp } from "@/components/app-provider";
import { TeamCard } from "@/components/team-card";
import { matchScore } from "@/lib/match";
import { Activity } from "@/lib/types";
import { useState } from "react";

export function InviteModal({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  const { data, currentUser, invite } = useApp();
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [ok, setOk] = useState("");
  if (!data || !currentUser) return null;
  const viewer = currentUser;
  const candidates = data.users.filter((u) => !activity.memberIds.includes(u.id)).sort((a, b) => matchScore(viewer, b) - matchScore(viewer, a));
  const pendingFor = (userId: string) => data.invitations.some((i) => i.activityId === activity.id && i.inviteeId === userId && i.status === "pending");
  function send(userId: string) { try { invite(activity.id, userId, message); setOk("邀请已发送，等待对方回应"); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "邀请失败"); setOk(""); } }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}><div className="card max-h-[85vh] w-full max-w-lg overflow-y-auto" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-between"><h3 className="text-lg font-black text-ink">邀请搭子加入</h3><button className="px-1 text-slate-400" onClick={onClose}>✕</button></div>
    <p className="mt-2 text-sm text-slate-500">《{activity.title}》还差 {Math.max(0, activity.maxMembers - activity.memberIds.length)} 人，按匹配度为你推荐同学。</p>
    <input className="field mt-4" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={60} placeholder="附上一句邀请留言（选填）" />
    {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
    {ok && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600">{ok}</p>}
    <div className="mt-4 space-y-3">{candidates.length ? candidates.map((u) => <TeamCard key={u.id} user={u} viewer={viewer} action={<button className={`mt-3 w-full py-2 ${pendingFor(u.id) ? "btn-soft" : "btn-primary"}`} disabled={pendingFor(u.id)} onClick={() => send(u.id)}>{pendingFor(u.id) ? "已邀请，等待回应" : "发送邀请"}</button>} />) : <p className="py-4 text-center text-sm text-slate-400">暂时没有可以邀请的同学。</p>}</div>
  </div></div>;
}
