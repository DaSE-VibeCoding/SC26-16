"use client";
import { ActivityCard } from "@/components/activity-card";
import { Empty } from "@/components/empty";
import { useApp } from "@/components/app-provider";
import { categories, Category } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function DiscoverPage() {
  const { data, loading, currentUser } = useApp();
  const [keyword, setKeyword] = useState(""); const [category, setCategory] = useState<Category | "全部">("全部"); const [date, setDate] = useState(""); const [place, setPlace] = useState("");
  const result = useMemo(() => (data?.activities ?? []).filter((a) => {
    const text = `${a.title} ${a.description} ${a.location} ${a.tags.join(" ")}`.toLowerCase();
    return a.status !== "cancelled" && (category === "全部" || a.category === category) && (!keyword || text.includes(keyword.toLowerCase())) && (!date || a.startTime.slice(0, 10) === date) && (!place || a.location.includes(place));
  }).sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)), [data, keyword, category, date, place]);
  if (loading) return <main className="page text-center text-slate-500">正在加载校园活动…</main>;
  return <main className="page">
    <section className="rounded-[2rem] bg-gradient-to-br from-brand to-indigo-400 p-6 text-white shadow-card sm:p-8"><p className="text-sm font-bold text-indigo-100">CampusMate · 让想做的事不再一个人</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black sm:text-4xl">今天，找个同学一起完成。</h1><p className="mt-3 max-w-xl text-indigo-100">自习、运动、比赛或探索校园——每一次连接，都从一个明确的活动开始。</p></div>{currentUser ? <Link className="btn bg-white text-brand hover:bg-indigo-50" href="/create">发布活动 ＋</Link> : <Link className="btn bg-white text-brand hover:bg-indigo-50" href="/login">登录后加入</Link>}</div></section>
    <section className="card mt-5"><div className="grid gap-3 sm:grid-cols-4"><input className="field sm:col-span-2" placeholder="搜索活动、标签或地点" value={keyword} onChange={(e) => setKeyword(e.target.value)} /><input className="field" placeholder="地点，如图书馆" value={place} onChange={(e) => setPlace(e.target.value)} /><input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1"><button className={`tag whitespace-nowrap ${category === "全部" ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => setCategory("全部")}>全部</button>{categories.map((item) => <button key={item} className={`tag whitespace-nowrap ${category === item ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => setCategory(item)}>{item}</button>)}</div></section>
    <div className="mt-7 flex items-center justify-between"><div><h2 className="text-xl font-black text-ink">发现活动</h2><p className="mt-1 text-sm text-slate-500">共 {result.length} 个适合你的校园邀约</p></div></div>
    {result.length ? <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{result.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</section> : <div className="mt-4"><Empty title="暂时没有匹配的活动" description="换个关键词或清除筛选条件试试吧。" /></div>}
  </main>;
}
