"use client";
import { useApp } from "@/components/app-provider";
import { useState } from "react";

const reasons = ["虚假或误导信息", "不友善或骚扰行为", "垃圾广告", "违规或不适宜内容", "其他"];
type Target = { type: "activity" | "user"; id: string; name: string };

export function ReportModal({ targets, onClose }: { targets: Target[]; onClose: () => void }) {
  const { currentUser, report } = useApp();
  const [targetIndex, setTargetIndex] = useState(0); const [reason, setReason] = useState(reasons[0]); const [detail, setDetail] = useState(""); const [done, setDone] = useState(false); const [error, setError] = useState("");
  const target = targets[targetIndex];
  function submit() { try { report(target.type, target.id, reason, detail); setDone(true); } catch (err) { setError(err instanceof Error ? err.message : "提交失败"); } }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}><div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
    {done ? <div className="py-6 text-center"><div className="text-4xl text-emerald-500">✓</div><h3 className="mt-3 text-lg font-black text-ink">举报已提交</h3><p className="mt-2 text-sm text-slate-500">感谢反馈，管理员会尽快核实处理（演示流程）。</p><button className="btn-primary mt-5" onClick={onClose}>好的</button></div>
      : <><div className="flex items-center justify-between"><h3 className="text-lg font-black text-ink">举报</h3><button className="px-1 text-slate-400" onClick={onClose}>✕</button></div>
        {!currentUser ? <p className="mt-4 text-sm text-slate-500">请先登录后再提交举报。</p> : <>
          {targets.length > 1 && <div className="mt-4 flex gap-2">{targets.map((t, i) => <button key={t.type + t.id} className={`tag ${i === targetIndex ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => setTargetIndex(i)}>{t.type === "activity" ? "举报活动" : "举报用户"}</button>)}</div>}
          <p className="mt-3 text-sm text-slate-500">举报对象：<b className="text-ink">{target.name}</b></p>
          <div className="mt-4 space-y-2">{reasons.map((r) => <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm font-bold ${reason === r ? "border-brand bg-lavender text-brand" : "border-slate-200 text-slate-600"}`}><input type="radio" name="report-reason" checked={reason === r} onChange={() => setReason(r)} />{r}</label>)}</div>
          <textarea className="field mt-4" rows={3} maxLength={200} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="补充说明（选填）" />
          {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
          <div className="mt-4 flex justify-end gap-2"><button className="btn-soft" onClick={onClose}>取消</button><button className="btn-danger" onClick={submit}>提交举报</button></div>
        </>}</>}
  </div></div>;
}
