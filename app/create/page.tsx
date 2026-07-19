"use client";
import { useApp } from "@/components/app-provider";
import { categories, Category } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";

export default function CreatePage() {
  return <Suspense fallback={<main className="page text-center text-slate-500">正在加载活动表单…</main>}><CreateFormPage /></Suspense>;
}

function CreateFormPage() {
  const { data, currentUser, createActivity, updateActivity } = useApp(); const router = useRouter(); const searchParams = useSearchParams(); const [error, setError] = useState("");
  const editId = searchParams.get("edit");
  const editingActivity = editId ? data?.activities.find((activity) => activity.id === editId) : undefined;
  const [editingReady, setEditingReady] = useState(!editId);
  const initializedEditId = useRef<string | null>(null);
  const [form, setForm] = useState(() => {
    const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(19, 0, 0, 0);
    const localTime = new Date(start.getTime() - start.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const endTime = new Date(end.getTime() - end.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    return { title: "", description: "", category: "自习搭子" as Category, location: "", startTime: localTime, endTime, maxMembers: 2, tags: "" };
  });
  const change = (key: keyof typeof form, value: string | number) => setForm((x) => ({ ...x, [key]: value }));
  useEffect(() => {
    if (!currentUser) router.replace("/login");
    else if (editId && data && (!editingActivity || editingActivity.creatorId !== currentUser.id)) router.replace("/my-team");
    else if (editingActivity && initializedEditId.current !== editingActivity.id) {
      setForm({ title: editingActivity.title, description: editingActivity.description, category: editingActivity.category, location: editingActivity.location, startTime: editingActivity.startTime, endTime: editingActivity.endTime, maxMembers: editingActivity.maxMembers, tags: editingActivity.tags.join("，") });
      initializedEditId.current = editingActivity.id;
      setEditingReady(true);
    }
  }, [currentUser, data, editId, editingActivity, router]);
  if (!currentUser || (editId && (!editingActivity || !editingReady))) return <main className="page text-center text-slate-500">正在加载活动…</main>;
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setError(""); const values = new FormData(e.currentTarget); const input = { title: String(values.get("title") ?? ""), description: String(values.get("description") ?? ""), category: String(values.get("category") ?? "自习搭子") as Category, location: String(values.get("location") ?? ""), startTime: String(values.get("startTime") ?? ""), endTime: String(values.get("endTime") ?? ""), maxMembers: Number(values.get("maxMembers")), tags: String(values.get("tags") ?? "").split(/[，,]/).map((x) => x.trim()).filter(Boolean) }; if (input.maxMembers < 2 || input.maxMembers > 20) return setError("活动人数需设置为 2 至 20 人"); if (new Date(input.startTime).getTime() < Date.now()) return setError("活动时间需要晚于当前时间"); if (new Date(input.endTime).getTime() <= new Date(input.startTime).getTime()) return setError("结束时间需要晚于开始时间"); try { if (editingActivity) { updateActivity(editingActivity.id, input); router.push(`/activity/${editingActivity.id}`); } else { const id = createActivity(input); router.push(`/activity/${id}`); } } catch (err) { setError(err instanceof Error ? err.message : editingActivity ? "保存失败" : "发布失败"); } }
  return <main className="page max-w-2xl"><section className="mb-5"><h1 className="text-2xl font-black text-ink">{editingActivity ? "编辑活动" : "发布一个活动"}</h1><p className="mt-2 text-sm text-slate-500">写清楚时间、地点和要求，更容易找到合适的同学。</p></section><form onSubmit={submit} className="card grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><label className="label">活动标题</label><input name="title" className="field" maxLength={40} placeholder="例如：周五羽毛球新手局" value={form.title} onChange={(e) => change("title", e.target.value)} required /></div><div><label className="label">活动类别</label><select name="category" className="field" value={form.category} onChange={(e) => change("category", e.target.value as Category)}>{categories.map((x) => <option key={x}>{x}</option>)}</select></div><div><label className="label">最大人数（含你自己）</label><input name="maxMembers" className="field" type="number" min={2} max={20} value={form.maxMembers} onChange={(e) => change("maxMembers", Number(e.target.value))} required /></div><div><label className="label">开始时间</label><input name="startTime" className="field" type="datetime-local" value={form.startTime} onChange={(e) => change("startTime", e.target.value)} required /></div><div><label className="label">结束时间</label><input name="endTime" className="field" type="datetime-local" value={form.endTime} onChange={(e) => change("endTime", e.target.value)} required /></div><div className="sm:col-span-2"><label className="label">集合地点</label><input name="location" className="field" placeholder="例如：东区体育馆 2 号场" value={form.location} onChange={(e) => change("location", e.target.value)} required /></div><div className="sm:col-span-2"><label className="label">活动说明</label><textarea name="description" className="field min-h-28 resize-y" maxLength={300} placeholder="说明活动内容、参与条件和注意事项…" value={form.description} onChange={(e) => change("description", e.target.value)} required /></div><div className="sm:col-span-2"><label className="label">标签（用逗号分隔）</label><input name="tags" className="field" placeholder="如：新手友好，晚间，羽毛球" value={form.tags} onChange={(e) => change("tags", e.target.value)} /></div>{error && <p className="sm:col-span-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}<div className="sm:col-span-2 flex items-center justify-between gap-4"><p className="text-xs text-slate-400">{editingActivity ? "变更时间、地点或人数时，已加入成员会收到通知。" : "发布后你将自动成为该活动成员。"}</p><button type="submit" data-testid={editingActivity ? "activity-edit-submit" : "activity-create-submit"} className="btn-primary">{editingActivity ? "保存修改" : "确认发布"}</button></div></form></main>;
}
