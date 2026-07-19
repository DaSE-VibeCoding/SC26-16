"use client";
import { useApp } from "@/components/app-provider";
import { categories, Category, User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const defaultReviewVisibility: User["applicationProfileVisibility"] = {
  college: true,
  grade: true,
  interests: true,
  bio: false,
  availability: true,
  creditScore: true,
};

export default function SettingsPage() {
  const { currentUser, updateSettings, logout } = useApp(); const router = useRouter();
  const [applications, setApplications] = useState(true); const [activityUpdates, setActivityUpdates] = useState(true); const [social, setSocial] = useState(true); const [system, setSystem] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true); const [applicationProfileVisibility, setApplicationProfileVisibility] = useState<User["applicationProfileVisibility"]>(defaultReviewVisibility);
  const [preferredCategories, setPreferredCategories] = useState<Category[]>([]); const [availability, setAvailability] = useState<User["availability"]>("时间灵活"); const [saved, setSaved] = useState("");
  useEffect(() => {
    if (!currentUser) router.replace("/login");
    else {
      setApplications(currentUser.notificationPreferences.applications); setActivityUpdates(currentUser.notificationPreferences.activityUpdates); setSocial(currentUser.notificationPreferences.social); setSystem(currentUser.notificationPreferences.system);
      setProfileVisible(currentUser.profileVisible); setApplicationProfileVisibility({ ...defaultReviewVisibility, ...currentUser.applicationProfileVisibility });
      setPreferredCategories(currentUser.preferredCategories); setAvailability(currentUser.availability);
    }
  }, [currentUser, router]);
  if (!currentUser) return <main className="page text-center text-slate-500">正在加载…</main>;
  function toggleCategory(category: Category) { setPreferredCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]); }
  function toggleReviewField(field: keyof User["applicationProfileVisibility"], checked: boolean) { setApplicationProfileVisibility((current) => ({ ...current, [field]: checked })); }
  function save() { updateSettings({ notificationPreferences: { applications, activityUpdates, social, system }, profileVisible, applicationProfileVisibility, preferredCategories, availability }); setSaved("设置已保存到当前浏览器"); }
  function signOut() { logout(); router.replace("/login"); }
  const noticeRows: Array<[string, string, boolean, (value: boolean) => void]> = [["申请与审批", "有人申请、通过或拒绝你的活动时提醒", applications, setApplications], ["活动变更", "成员退出或活动取消时提醒", activityUpdates, setActivityUpdates], ["社交互动", "接收邀请、评论和评价提醒", social, setSocial], ["系统消息", "接收演示环境和产品说明消息", system, setSystem]];
  const reviewRows: Array<[keyof User["applicationProfileVisibility"], string, string]> = [["college", "学院", "帮助发起人判断专业背景或校区相关性"], ["grade", "年级", "帮助发起人安排节奏和协作预期"], ["interests", "兴趣标签", "帮助发起人判断活动匹配度"], ["availability", "可参与时间", "帮助发起人确认时间是否合适"], ["creditScore", "信用分", "展示你的参与可靠度"], ["bio", "个人简介", "包含更多主观表达，默认不公开给申请审核"]];
  return <main className="page max-w-2xl"><h1 className="text-2xl font-black text-ink">通知与隐私设置</h1><p className="mt-2 text-sm text-slate-500">这些设置仅用于本地演示，会保存在当前浏览器中。</p>
    <section className="card mt-5 space-y-2">{noticeRows.map(([title, description, checked, change]) => <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-3 hover:bg-slate-50" key={title}><span><b className="text-sm text-ink">{title}</b><small className="mt-1 block text-sm text-slate-500">{description}</small></span><input className="h-5 w-5 accent-indigo-600" type="checkbox" checked={checked} onChange={(event) => change(event.target.checked)} /></label>)}</section>
    <section className="card mt-5"><div className="flex items-center justify-between gap-4"><div><h2 className="font-black text-ink">个人主页公开状态</h2><p className="mt-1 text-sm text-slate-500">控制其他活动成员是否能查看你的学院、年级和兴趣。</p></div><label className="flex items-center gap-2 text-sm font-bold text-slate-600"><input className="h-5 w-5 accent-indigo-600" type="checkbox" checked={profileVisible} onChange={(event) => setProfileVisible(event.target.checked)} />{profileVisible ? "公开" : "私密"}</label></div></section>
    <section className="card mt-5"><h2 className="font-black text-ink">申请活动时允许发起人查看哪些信息</h2><p className="mt-1 text-sm text-slate-500">发起人只会在审批你的申请时看到你授权的字段，昵称和申请留言始终可见。</p><div className="mt-4 space-y-2">{reviewRows.map(([field, title, description]) => <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-3 hover:bg-slate-50" key={field}><span><b className="text-sm text-ink">{title}</b><small className="mt-1 block text-sm text-slate-500">{description}</small></span><input className="h-5 w-5 accent-indigo-600" type="checkbox" checked={applicationProfileVisibility[field]} onChange={(event) => toggleReviewField(field, event.target.checked)} /></label>)}</div></section>
    <section className="card mt-5"><h2 className="font-black text-ink">活动偏好</h2><p className="mt-1 text-sm text-slate-500">选择你更愿意参与的活动类型，后续推荐可据此展示理由。</p><div className="mt-4 flex flex-wrap gap-2">{categories.map((category) => <button type="button" className={`tag ${preferredCategories.includes(category) ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => toggleCategory(category)} key={category}>{category}</button>)}</div><label className="label mt-5">通常方便的时间</label><select className="field" value={availability} onChange={(event) => setAvailability(event.target.value as User["availability"])}>{["工作日上午", "工作日晚上", "周末", "时间灵活"].map((item) => <option key={item}>{item}</option>)}</select></section>
    <section className="card mt-5"><h2 className="font-black text-ink">账户操作</h2><p className="mt-1 text-sm text-slate-500">退出只会清除当前浏览器的登录状态，不会删除演示数据。</p><button data-testid="settings-logout" className="btn-danger mt-4" onClick={signOut}>退出登录</button></section>
    {saved && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{saved}</p>}<div className="mt-5 flex gap-3"><button className="btn-soft" onClick={() => router.back()}>返回</button><button className="btn-primary" onClick={save}>保存设置</button></div></main>;
}
