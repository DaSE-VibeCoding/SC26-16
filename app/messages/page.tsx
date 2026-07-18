"use client";
import { useApp } from "@/components/app-provider";
import { isOnline } from "@/lib/match";
import { storage } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

const quickReplies = ["你好，我也是初学者", "一起去图书馆吗？", "周末有空一起打球吗？", "到时候在哪里集合呀？"];
const autoReplies = ["收到！我看看时间安排～", "好呀好呀，就这么说定了！", "哈哈没问题，到时候见！", "这是演示自动回复，正式版会接入实时聊天。"];
const fmt = (value: string) => new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function MessagesPage() {
  const { data, currentUser, loading, sendMessage, refresh } = useApp(); const router = useRouter();
  const [peerId, setPeerId] = useState<string | null>(null); const [text, setText] = useState(""); const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null); const replyCount = useRef(0);
  const messageCount = data?.messages.length ?? 0;
  useEffect(() => { if (!loading && !currentUser) router.replace("/login"); }, [loading, currentUser, router]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messageCount, peerId]);
  if (!currentUser || !data) return <main className="page text-center text-slate-500">正在加载…</main>;
  const me = currentUser;
  const chats = data.users.filter((u) => u.id !== me.id).map((user) => {
    const msgs = data.messages.filter((m) => (m.senderId === me.id && m.receiverId === user.id) || (m.senderId === user.id && m.receiverId === me.id));
    return { user, msgs, last: msgs[msgs.length - 1] };
  }).sort((a, b) => (b.last?.createdAt ?? "").localeCompare(a.last?.createdAt ?? ""));
  const active = chats.find((c) => c.user.id === peerId);
  function send(content: string) {
    if (!active) return; const peer = active.user;
    try {
      sendMessage(peer.id, content); setText(""); setError("");
      const reply = autoReplies[replyCount.current++ % autoReplies.length];
      window.setTimeout(() => { try { storage.sendMessage(peer.id, me.id, reply); refresh(); } catch { /* 演示回复失败可忽略 */ } }, 1200);
    } catch (err) { setError(err instanceof Error ? err.message : "发送失败"); }
  }
  function submit(e: FormEvent) { e.preventDefault(); if (text.trim()) send(text); }
  return <main className="page max-w-5xl">
    <section className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-black text-ink">消息</h1><p className="mt-2 text-sm text-slate-500">演示版消息：数据仅保存在本地浏览器，对方回复为自动模拟。</p></div></section>
    <div className="mt-5 grid gap-4 sm:grid-cols-[280px_1fr]">
      <section className={`space-y-2 ${active ? "hidden sm:block" : ""}`}>{chats.map(({ user, last }) => <button key={user.id} onClick={() => setPeerId(user.id)} className={`card block w-full p-4 text-left transition ${peerId === user.id ? "border-brand" : ""}`}><div className="flex items-center gap-3"><span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 font-black text-brand">{user.nickname.slice(0, 1)}<span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${isOnline(user.id) ? "bg-emerald-400" : "bg-slate-300"}`} /></span><div className="min-w-0 flex-1"><p className="truncate font-black text-ink">{user.nickname}</p><p className="truncate text-xs text-slate-500">{last ? (last.senderId === me.id ? "我：" : "") + last.content : "还没聊过，打个招呼吧"}</p></div>{last && <span className="shrink-0 text-xs text-slate-400">{fmt(last.createdAt)}</span>}</div></button>)}</section>
      {active ? <section className="card flex min-h-[420px] flex-col p-0">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4"><button className="font-bold text-slate-500 sm:hidden" onClick={() => setPeerId(null)}>←</button><span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 font-black text-brand">{active.user.nickname.slice(0, 1)}</span><div><p className="font-black text-ink">{active.user.nickname}</p><p className={`text-xs font-bold ${isOnline(active.user.id) ? "text-emerald-500" : "text-slate-400"}`}>{isOnline(active.user.id) ? "在线" : "离线"}</p></div></div>
        <div className="max-h-[50vh] flex-1 space-y-3 overflow-y-auto p-4">{active.msgs.length ? active.msgs.map((m) => <div key={m.id} className={`flex ${m.senderId === me.id ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${m.senderId === me.id ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-lavender text-ink"}`}><p className="break-words">{m.content}</p><p className={`mt-1 text-right text-[10px] ${m.senderId === me.id ? "text-indigo-200" : "text-slate-400"}`}>{fmt(m.createdAt)}</p></div></div>) : <p className="py-8 text-center text-sm text-slate-400">还没有消息，用下方快捷语开始聊天吧。</p>}<div ref={bottomRef} /></div>
        {error && <p className="mx-4 mb-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
        <div className="border-t border-slate-100 p-4"><div className="mb-3 flex flex-wrap gap-2">{quickReplies.map((q) => <button key={q} className="tag bg-slate-100 text-slate-600 transition hover:bg-lavender hover:text-brand" onClick={() => send(q)}>{q}</button>)}</div><form className="flex gap-2" onSubmit={submit}><input className="field flex-1" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder={`发消息给 ${active.user.nickname}…`} /><button className="btn-primary whitespace-nowrap" disabled={!text.trim()}>发送</button></form></div>
      </section> : <section className="card hidden min-h-[420px] place-items-center text-sm text-slate-400 sm:grid">从左侧选择一位同学开始聊天</section>}
    </div>
  </main>;
}
