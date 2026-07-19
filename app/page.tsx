"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActivityCard } from "@/components/activity-card";
import { Empty } from "@/components/empty";
import { useApp } from "@/components/app-provider";
import { categories, Activity, Category } from "@/lib/types";
import { clearRecentActivities, getActivityPopularity, getInterestScore, getTimeBucket, readRecentActivityIds } from "@/lib/discover";

type SortMode = "soon" | "popular" | "newest" | "match";
type TimeBucket = "全部" | "上午" | "下午" | "晚上";

const categoryIcons: Record<Category, string> = { "自习搭子": "✎", "运动搭子": "♢", "饭搭子": "◒", "比赛搭子": "⚑", "游戏搭子": "◈", "兴趣活动": "✦" };

function activeActivity(activity: Activity) {
  return activity.status !== "cancelled" && activity.status !== "finished";
}

export default function DiscoverPage() {
  const { data, loading, currentUser } = useApp();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<Category | "全部">("全部");
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [timeBucket, setTimeBucket] = useState<TimeBucket>("全部");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<SortMode>("soon");
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    const syncRecent = () => setRecentIds(readRecentActivityIds());
    syncRecent();
    window.addEventListener("campusmate:recent-view", syncRecent);
    return () => window.removeEventListener("campusmate:recent-view", syncRecent);
  }, []);

  const activeActivities = useMemo(() => (data?.activities ?? []).filter(activeActivity), [data?.activities]);
  const result = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const normalizedPlace = place.trim().toLowerCase();
    const filtered = activeActivities.filter((activity) => {
      const searchable = `${activity.title} ${activity.description} ${activity.location} ${activity.tags.join(" ")}`.toLowerCase();
      const available = activity.memberIds.length < activity.maxMembers;
      return (category === "全部" || activity.category === category)
        && (!normalizedKeyword || searchable.includes(normalizedKeyword))
        && (!date || activity.startTime.slice(0, 10) === date)
        && (!normalizedPlace || activity.location.toLowerCase().includes(normalizedPlace))
        && (timeBucket === "全部" || getTimeBucket(activity.startTime) === timeBucket)
        && (!onlyAvailable || available);
    });
    return filtered.sort((a, b) => {
      if (sort === "popular") return getActivityPopularity(b) - getActivityPopularity(a);
      if (sort === "newest") return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sort === "match") return getInterestScore(b, currentUser) - getInterestScore(a, currentUser) || getActivityPopularity(b) - getActivityPopularity(a);
      return +new Date(a.startTime) - +new Date(b.startTime);
    });
  }, [activeActivities, category, currentUser, date, keyword, onlyAvailable, place, sort, timeBucket]);

  const recommended = useMemo(() => [...activeActivities].sort((a, b) => getInterestScore(b, currentUser) - getInterestScore(a, currentUser) || getActivityPopularity(b) - getActivityPopularity(a)).slice(0, 3), [activeActivities, currentUser]);
  const recentActivities = useMemo(() => recentIds.map((id) => data?.activities.find((activity) => activity.id === id)).filter((activity): activity is Activity => Boolean(activity && activeActivity(activity))).slice(0, 3), [data?.activities, recentIds]);
  const hotCategories = useMemo(() => categories.map((item) => ({ name: item, count: activeActivities.filter((activity) => activity.category === item).length })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 3), [activeActivities]);
  const hasFilters = Boolean(keyword || category !== "全部" || date || place || timeBucket !== "全部" || onlyAvailable);
  const todayCount = activeActivities.filter((activity) => activity.startTime.slice(0, 10) === "2026-07-19").length;

  const resetFilters = () => {
    setKeyword(""); setCategory("全部"); setDate(""); setPlace(""); setTimeBucket("全部"); setOnlyAvailable(false); setSort("soon");
  };

  if (loading) return <main className="page"><div className="card py-16 text-center text-slate-500">正在加载校园活动…</div></main>;

  return <main className="page">
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-indigo-500 to-violet-500 p-6 text-white shadow-card sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-indigo-100"><span>CampusMate</span><span className="rounded-full bg-white/15 px-2 py-1">展示型 MVP</span></div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6"><div><h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-5xl">今天，找个同学一起完成。</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">自习、运动、比赛或探索校园——用兴趣和时间找到合拍的活动，让想做的事不再一个人。</p></div>{currentUser ? <Link className="btn bg-white text-brand hover:bg-indigo-50" href="/create">发布一个活动 ＋</Link> : <Link className="btn bg-white text-brand hover:bg-indigo-50" href="/login">登录后加入活动</Link>}</div>
        <div className="mt-8 grid max-w-xl grid-cols-3 gap-3"><div className="rounded-2xl bg-white/10 p-3"><p className="text-2xl font-black">{activeActivities.length}</p><p className="mt-1 text-xs text-indigo-100">正在招募</p></div><div className="rounded-2xl bg-white/10 p-3"><p className="text-2xl font-black">{todayCount}</p><p className="mt-1 text-xs text-indigo-100">今日活动</p></div><div className="rounded-2xl bg-white/10 p-3"><p className="text-2xl font-black">{data?.users.length ?? 0}</p><p className="mt-1 text-xs text-indigo-100">校园同学</p></div></div>
      </div>
    </section>

    <section className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`card flex flex-col items-center gap-2 p-3 text-center transition hover:-translate-y-0.5 ${category === item ? "border-brand bg-lavender text-brand" : "text-slate-600"}`}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-xl">{categoryIcons[item]}</span><span className="text-xs font-bold">{item.replace("搭子", "")}</span></button>)}</section>

    <section className="card mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-ink">找到适合你的活动</h2><p className="mt-1 text-xs text-slate-500">支持关键词、分类、地点、日期和时段组合筛选</p></div>{hasFilters && <button type="button" onClick={resetFilters} className="text-sm font-bold text-brand hover:underline">清除全部条件</button>}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="lg:col-span-2"><span className="sr-only">搜索</span><input className="field" placeholder="搜索活动、标签、描述或地点" value={keyword} onChange={(event) => setKeyword(event.target.value)} /></label><label><span className="sr-only">地点</span><input className="field" placeholder="地点，如图书馆" value={place} onChange={(event) => setPlace(event.target.value)} /></label><label><span className="sr-only">日期</span><input className="field" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-bold text-slate-500">分类</span><button type="button" className={`tag ${category === "全部" ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => setCategory("全部")}>全部</button>{categories.map((item) => <button type="button" key={item} className={`tag ${category === item ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-bold text-slate-500">时间</span>{(["全部", "上午", "下午", "晚上"] as TimeBucket[]).map((item) => <button type="button" key={item} className={`tag ${timeBucket === item ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => setTimeBucket(item)}>{item}</button>)}<label className="ml-2 flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" checked={onlyAvailable} onChange={(event) => setOnlyAvailable(event.target.checked)} className="h-4 w-4 accent-indigo-600" />只看可报名</label></div>
    </section>

    {recommended.length > 0 && <section className="mt-7"><div className="mb-3 flex items-end justify-between"><div><h2 className="text-xl font-black text-ink">{currentUser ? "为你推荐" : "热门推荐"}</h2><p className="mt-1 text-sm text-slate-500">{currentUser ? "根据你的兴趣标签和活动热度生成" : "登录后可以获得更准确的兴趣匹配"}</p></div>{currentUser && <Link href="/profile" className="text-sm font-bold text-brand">完善兴趣 →</Link>}</div><div className="grid gap-4 lg:grid-cols-3">{recommended.map((activity) => <ActivityCard key={`recommend-${activity.id}`} activity={activity} />)}</div></section>}

    <section className="mt-7 grid gap-4 lg:grid-cols-[1fr_280px]"><div><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black text-ink">发现活动</h2><p className="mt-1 text-sm text-slate-500">{hasFilters ? `筛选后找到 ${result.length} 个结果` : `共 ${result.length} 个校园邀约`}</p></div><label className="flex items-center gap-2 text-sm font-bold text-slate-600">排序<select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="soon">即将开始</option><option value="popular">最热门</option><option value="newest">最新发布</option><option value="match">匹配优先</option></select></label></div>{result.length ? <section className="mt-4 grid gap-4 sm:grid-cols-2">{result.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</section> : <div className="mt-4"><Empty title="暂时没有匹配的活动" description="换个关键词、放宽时间条件，或清除筛选后再试试吧。" /></div>}</div><aside className="space-y-4"><div className="card"><div className="flex items-center justify-between"><div><h3 className="font-black text-ink">校园趋势</h3><p className="mt-1 text-xs text-slate-500">当前活动最多的分类</p></div><span className="text-xl">↗</span></div><div className="mt-4 space-y-3">{hotCategories.map((item, index) => <button type="button" key={item.name} onClick={() => setCategory(item.name as Category)} className="flex w-full items-center gap-3 text-left"><span className="grid h-7 w-7 place-items-center rounded-lg bg-lavender text-xs font-black text-brand">0{index + 1}</span><span className="flex-1 text-sm font-bold text-slate-700">{item.name}</span><span className="text-xs text-slate-500">{item.count} 场</span></button>)}</div></div>{recentActivities.length > 0 && <div className="card"><div className="flex items-center justify-between"><div><h3 className="font-black text-ink">最近浏览</h3><p className="mt-1 text-xs text-slate-500">继续看看刚才感兴趣的活动</p></div><button type="button" onClick={() => { clearRecentActivities(); setRecentIds([]); }} className="text-xs font-bold text-slate-400 hover:text-brand">清空</button></div><div className="mt-3 space-y-2">{recentActivities.map((activity) => <Link key={activity.id} href={`/activity/${activity.id}`} onClick={() => window.dispatchEvent(new CustomEvent("campusmate:recent-view"))} className="block rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700 hover:bg-lavender hover:text-brand"><span className="line-clamp-1">{activity.title}</span><span className="mt-1 block text-xs font-normal text-slate-500">{activity.location}</span></Link>)}</div></div>}</aside></section>
  </main>;
}
