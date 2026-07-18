"use client";
import { useApp } from "@/components/app-provider";
import { categories, Category } from "@/lib/types";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function CreatePage() {
  const { currentUser, createActivity } = useApp(); const router = useRouter(); const [error, setError] = useState("");
  const [form, setForm] = useState(() => {
    const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(19, 0, 0, 0);
    const localTime = new Date(start.getTime() - start.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const endTime = new Date(end.getTime() - end.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    return { title: "", description: "", category: "自习搭子" as Category, location: "", startTime: localTime, endTime, maxMembers: 2, tags: "" };
  });
  const change = (key: keyof typeof form, value: string | number) => setForm((x) => ({ ...x, [key]: value }));
  useEffect(() => { if (!currentUser) router.replace("/login"); }, [currentUser, router]);
  if (!currentUser) return <main className="page text-center text-slate-500">正在前往登录页…</main>;
  function submit(e: FormEvent) { e.preventDefault(); setError(""); if (form.maxMembers < 2 || form.maxMembers > 20) return setError("活动人数需设置为 2 至 20 人"); if (new Date(form.startTime).getTime() < Date.now()) return setError("活动时间需要晚于当前时间"); if (new Date(form.endTime).getTime() <= new Date(form.startTime).getTime()) return setError("结束时间需要晚于开始时间"); try { const id = createActivity({ ...form, tags: form.tags.split(/[，,]/).map((x) => x.trim()).filter(Boolean) }); router.push(`/activity/${id}`); } catch (err) { setError(err instanceof Error ? err.message : "发布失败"); } }
  return <main className="page max-w-2xl"><section className="mb-5"><h1 className="text-2xl font-black text-ink">发布一个活动</h1><p className="mt-2 text-sm text-slate-500">写清楚时间、地点和要求，更容易找到合适的同学。</p></section><form onSubmit={submit} className="card grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><label className="label">活动标题</label><input className="field" maxLength={40} placeholder="例如：周五羽毛球新手局" value={form.title} onChange={(e) => change("title", e.target.value)} required /></div><div><label className="label">活动类别</label><select className="field" value={form.category} onChange={(e) => change("category", e.target.value as Category)}>{categories.map((x) => <option key={x}>{x}</option>)}</select></div><div><label className="label">最大人数（含你自己）</label><input className="field" type="number" min={2} max={20} value={form.maxMembers} onChange={(e) => change("maxMembers", Number(e.target.value))} required /></div><div><label className="label">开始时间</label><input className="field" type="datetime-local" value={form.startTime} onChange={(e) => change("startTime", e.target.value)} required /></div><div><label className="label">结束时间</label><input className="field" type="datetime-local" value={form.endTime} onChange={(e) => change("endTime", e.target.value)} required /></div><div className="sm:col-span-2"><label className="label">集合地点</label><input className="field" placeholder="例如：东区体育馆 2 号场" value={form.location} onChange={(e) => change("location", e.target.value)} required /></div><div className="sm:col-span-2"><label className="label">活动说明</label><textarea className="field min-h-28 resize-y" maxLength={300} placeholder="说明活动内容、参与条件和注意事项…" value={form.description} onChange={(e) => change("description", e.target.value)} required /></div><div className="sm:col-span-2"><label className="label">标签（用逗号分隔）</label><input className="field" placeholder="如：新手友好，晚间，羽毛球" value={form.tags} onChange={(e) => change("tags", e.target.value)} /></div>{error && <p className="sm:col-span-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}<div className="sm:col-span-2 flex items-center justify-between gap-4"><p className="text-xs text-slate-400">发布后你将自动成为该活动成员。</p><button data-testid="activity-create-submit" className="btn-primary">确认发布</button></div></form></main>;
}
