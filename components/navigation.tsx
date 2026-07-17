"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./app-provider";

const links = [
  ["/", "⌂", "发现"], ["/create", "＋", "发布"], ["/my-team", "◎", "我的组队"], ["/profile", "◉", "我的"],
];
export function Navigation() {
  const { currentUser, loading } = useApp(); const pathname = usePathname();
  if (loading) return null;
  return <>
    <header className="sticky top-0 z-20 border-b border-indigo-50 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-black text-ink"><span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand text-lg text-white">伴</span><span>搭个伴 <em className="not-italic text-brand">CampusMate</em></span></Link>
        {currentUser ? <div className="flex items-center gap-2 text-sm"><span className="hidden text-slate-500 sm:inline">你好，{currentUser.nickname}</span><Link href="/profile" className="rounded-xl bg-lavender px-3 py-2 font-bold text-brand">个人中心</Link></div> : <Link href="/login" className="btn-primary py-2">登录 / 注册</Link>}
      </div>
    </header>
    {currentUser && <nav className="fixed bottom-0 z-30 flex w-full justify-around border-t border-indigo-100 bg-white px-2 py-2 shadow-lg sm:sticky sm:top-16 sm:order-2 sm:mx-auto sm:mt-3 sm:max-w-xl sm:rounded-2xl sm:border sm:shadow-none">
      {links.map(([href, icon, label]) => <Link key={href} href={href} className={`flex min-w-16 flex-col items-center rounded-xl px-3 py-1 text-xs font-bold ${pathname === href ? "bg-lavender text-brand" : "text-slate-500"}`}><span className="text-lg">{icon}</span>{label}</Link>)}
    </nav>}
  </>;
}
