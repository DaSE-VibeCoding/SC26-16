"use client";
import { useEffect } from "react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { /* 页面错误在开发者工具中记录，避免向课堂演示暴露技术细节。 */ }, []);
  return <main className="page grid min-h-[60vh] place-items-center text-center"><section className="card max-w-md"><p className="text-4xl">☁</p><h1 className="mt-4 text-2xl font-black text-ink">页面暂时开了个小差</h1><p className="mt-3 text-sm leading-6 text-slate-500">请重试；如果仍未恢复，可以回到发现页继续体验演示。</p><div className="mt-6 flex justify-center gap-3"><a className="btn-soft" href="/">返回发现页</a><button className="btn-primary" onClick={reset}>重新加载</button></div></section></main>;
}
