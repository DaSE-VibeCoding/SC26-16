"use client";
import { useApp } from "@/components/app-provider";
import { FormEvent, useState } from "react";

export function CommentList({ activityId }: { activityId: string }) {
  const { data, currentUser, addComment, deleteComment } = useApp();
  const [text, setText] = useState(""); const [error, setError] = useState(""); const [ok, setOk] = useState("");
  if (!data) return null;
  const comments = data.comments.filter((c) => c.activityId === activityId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const author = (id: string) => data.users.find((u) => u.id === id);
  function flash(message: string) { setOk(message); setError(""); window.setTimeout(() => setOk(""), 2500); }
  function submit(e: FormEvent) { e.preventDefault(); try { addComment(activityId, text); setText(""); flash("评论发布成功"); } catch (err) { setError(err instanceof Error ? err.message : "评论失败"); setOk(""); } }
  function remove(id: string) { if (!confirm("确认删除这条评论吗？")) return; try { deleteComment(id); flash("评论已删除"); } catch (err) { setError(err instanceof Error ? err.message : "删除失败"); setOk(""); } }
  return <section className="card mt-5"><h2 className="text-lg font-black text-ink">评论区 <span className="ml-1 text-sm font-bold text-slate-400">{comments.length} 条</span></h2>
    {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
    {ok && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600">{ok}</p>}
    {currentUser ? <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={submit}><input className="field flex-1" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="友善交流，问问细节或分享期待吧" /><button className="btn-primary whitespace-nowrap">发布评论</button></form> : <p className="mt-4 text-sm text-slate-500">登录后即可参与评论。</p>}
    <div className="mt-5 space-y-4">{comments.length ? comments.map((c) => { const u = author(c.authorId); return <div key={c.id} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 font-black text-brand">{u?.nickname.slice(0, 1) ?? "友"}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-sm"><b className="text-ink">{u?.nickname ?? "未知同学"}</b><span className="text-xs text-slate-400">{u?.college}</span><span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>{currentUser?.id === c.authorId && <button className="text-xs font-bold text-rose-500" onClick={() => remove(c.id)}>删除</button>}</div><p className="mt-1 break-words text-sm leading-6 text-slate-600">{c.content}</p></div></div>; }) : <p className="py-4 text-center text-sm text-slate-400">还没有评论，来抢沙发吧。</p>}</div>
  </section>;
}
