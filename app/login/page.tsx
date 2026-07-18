"use client";
import { useApp } from "@/components/app-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const { login, currentUser } = useApp(); const router = useRouter(); const [nickname, setNickname] = useState("林小羽"); const [password, setPassword] = useState("123456"); const [error, setError] = useState(""); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (currentUser) router.replace("/"); }, [currentUser, router]);
  if (currentUser) return <main className="page text-center text-slate-500">正在进入发现页…</main>;
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); setSubmitting(true); try { await login(nickname, password); router.replace("/"); } catch (err) { setError(err instanceof Error ? err.message : "登录失败"); } finally { setSubmitting(false); } }
  return <main className="page max-w-md"><section className="card mt-6"><div className="mb-6 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-brand text-2xl font-black text-white">伴</div><h1 className="mt-4 text-2xl font-black text-ink">欢迎回来</h1><p className="mt-2 text-sm text-slate-500">登录后，开始寻找你的校园搭子。</p></div><form onSubmit={submit} className="space-y-4"><div><label className="label">昵称</label><input className="field" value={nickname} onChange={(e) => setNickname(e.target.value)} required /></div><div><label className="label">密码</label><input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>{error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}<button disabled={submitting} className="btn-primary w-full">{submitting ? "正在登录…" : "登录 CampusMate"}</button></form><div className="mt-5 rounded-2xl bg-lavender p-4 text-sm text-indigo-700"><strong>演示账号：</strong>林小羽 / 周同学 / 陈同学，密码均为 <b>123456</b>。</div><p className="mt-5 text-center text-sm text-slate-500">还没有账号？ <Link className="font-bold text-brand" href="/register">创建本地演示账号</Link></p></section></main>;
}
