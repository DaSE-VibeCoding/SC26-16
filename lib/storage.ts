"use client";
import { createSeedData, hashText } from "./seed";
import { Activity, AppData, Application, Comment, CreateActivityInput, Favorite, Invitation, Message, Notification, Report, User } from "./types";

const KEY = "campusmate_data_v1";
const SESSION_KEY = "campusmate_session_v1";
const VERSION_KEY = "campusmate_version";
const VERSION = "2";
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const now = () => new Date().toISOString();

function load(): AppData {
  const raw = localStorage.getItem(KEY);
  if (!raw) throw new Error("数据尚未初始化");
  return JSON.parse(raw) as AppData;
}
function save(data: AppData) { localStorage.setItem(KEY, JSON.stringify(data)); }
function addNotice(data: AppData, userId: string, type: Notification["type"], content: string) {
  data.notifications.unshift({ id: uid("n"), userId, type, content, read: false, createdAt: now() });
}
function syncStatus(activity: Activity) {
  if (activity.status !== "cancelled" && activity.status !== "finished") activity.status = activity.memberIds.length >= activity.maxMembers ? "full" : "open";
}

export const storage = {
  async init() { if (localStorage.getItem(VERSION_KEY) !== VERSION || !localStorage.getItem(KEY)) { save(await createSeedData()); localStorage.setItem(VERSION_KEY, VERSION); } },
  read: load,
  session() { return localStorage.getItem(SESSION_KEY); },
  logout() { localStorage.removeItem(SESSION_KEY); },
  async reset() { save(await createSeedData()); localStorage.setItem(VERSION_KEY, VERSION); localStorage.removeItem(SESSION_KEY); },
  async register(input: { nickname: string; college: string; grade: string; interests: string[]; password: string }) {
    const data = load();
    if (data.users.some((u) => u.nickname.trim() === input.nickname.trim())) throw new Error("该昵称已被使用，请换一个昵称");
    const user: User = { id: uid("u"), nickname: input.nickname.trim(), college: input.college.trim(), grade: input.grade.trim(), interests: input.interests, passwordHash: await hashText(input.password), createdAt: now() };
    data.users.push(user); save(data); localStorage.setItem(SESSION_KEY, user.id); return user;
  },
  async login(nickname: string, password: string) {
    const data = load(); const hash = await hashText(password);
    const user = data.users.find((u) => u.nickname === nickname.trim() && u.passwordHash === hash);
    if (!user) throw new Error("昵称或密码不正确");
    localStorage.setItem(SESSION_KEY, user.id); return user;
  },
  createActivity(userId: string, input: CreateActivityInput) {
    const data = load();
    const activity: Activity = { id: uid("a"), creatorId: userId, ...input, memberIds: [userId], status: "open", createdAt: now() };
    syncStatus(activity); data.activities.unshift(activity); save(data); return activity;
  },
  apply(userId: string, activityId: string, message: string) {
    const data = load(); const activity = data.activities.find((a) => a.id === activityId);
    if (!activity || activity.status === "cancelled") throw new Error("活动不可申请");
    if (activity.memberIds.includes(userId)) throw new Error("你已经是活动成员");
    if (activity.memberIds.length >= activity.maxMembers) throw new Error("活动名额已满");
    if (data.applications.some((a) => a.activityId === activityId && a.applicantId === userId && a.status === "pending")) throw new Error("你已经提交过申请");
    const application: Application = { id: uid("p"), activityId, applicantId: userId, message: message.trim(), status: "pending", createdAt: now() };
    data.applications.unshift(application); addNotice(data, activity.creatorId, "application", "有新同学申请加入你的活动《" + activity.title + "》"); save(data); return application;
  },
  review(ownerId: string, applicationId: string, approved: boolean) {
    const data = load(); const application = data.applications.find((a) => a.id === applicationId);
    if (!application || application.status !== "pending") throw new Error("该申请无法处理");
    const activity = data.activities.find((a) => a.id === application.activityId);
    if (!activity || activity.creatorId !== ownerId) throw new Error("你无权处理此申请");
    if (approved && activity.memberIds.length >= activity.maxMembers) throw new Error("活动名额已满");
    application.status = approved ? "accepted" : "rejected";
    if (approved) { activity.memberIds.push(application.applicantId); syncStatus(activity); addNotice(data, application.applicantId, "approved", "你已成功加入《" + activity.title + "》，请留意活动时间与地点。"); }
    else addNotice(data, application.applicantId, "rejected", "《" + activity.title + "》的申请暂未通过，继续寻找适合你的活动吧。");
    save(data);
  },
  exitActivity(userId: string, activityId: string) {
    const data = load(); const activity = data.activities.find((a) => a.id === activityId);
    if (!activity || !activity.memberIds.includes(userId)) throw new Error("你不是该活动成员");
    if (activity.creatorId === userId) throw new Error("发起人请使用取消活动功能");
    activity.memberIds = activity.memberIds.filter((id) => id !== userId); syncStatus(activity);
    addNotice(data, activity.creatorId, "exit", "有成员退出了《" + activity.title + "》"); save(data);
  },
  cancelActivity(userId: string, activityId: string) {
    const data = load(); const activity = data.activities.find((a) => a.id === activityId);
    if (!activity || activity.creatorId !== userId) throw new Error("你无权取消此活动");
    activity.status = "cancelled"; activity.memberIds.filter((id) => id !== userId).forEach((id) => addNotice(data, id, "cancel", "发起人已取消《" + activity.title + "》")); save(data);
  },
  markNoticesRead(userId: string) { const data = load(); data.notifications.forEach((n) => { if (n.userId === userId) n.read = true; }); save(data); },
  addComment(userId: string, activityId: string, content: string) {
    const data = load(); const activity = data.activities.find((a) => a.id === activityId);
    if (!activity) throw new Error("活动不存在");
    const text = content.trim();
    if (!text) throw new Error("评论内容不能为空");
    if (text.length > 200) throw new Error("评论最多 200 字");
    const comment: Comment = { id: uid("c"), activityId, authorId: userId, content: text, createdAt: now() };
    data.comments.unshift(comment);
    if (activity.creatorId !== userId) addNotice(data, activity.creatorId, "comment", "你的活动《" + activity.title + "》收到了新评论");
    save(data); return comment;
  },
  deleteComment(userId: string, commentId: string) {
    const data = load(); const comment = data.comments.find((c) => c.id === commentId);
    if (!comment) throw new Error("评论不存在");
    if (comment.authorId !== userId) throw new Error("只能删除自己的评论");
    data.comments = data.comments.filter((c) => c.id !== commentId); save(data);
  },
  toggleFavorite(userId: string, activityId: string) {
    const data = load();
    if (!data.activities.some((a) => a.id === activityId)) throw new Error("活动不存在");
    const existing = data.favorites.find((f) => f.userId === userId && f.activityId === activityId);
    if (existing) { data.favorites = data.favorites.filter((f) => f.id !== existing.id); save(data); return false; }
    const favorite: Favorite = { id: uid("f"), userId, activityId, createdAt: now() };
    data.favorites.unshift(favorite); save(data); return true;
  },
  invite(inviterId: string, activityId: string, inviteeId: string, message: string) {
    const data = load(); const activity = data.activities.find((a) => a.id === activityId);
    if (!activity || activity.status === "cancelled" || activity.status === "finished") throw new Error("该活动不可邀请");
    if (!activity.memberIds.includes(inviterId)) throw new Error("只有活动成员可以发出邀请");
    const invitee = data.users.find((u) => u.id === inviteeId);
    if (!invitee) throw new Error("该同学不存在");
    if (activity.memberIds.includes(inviteeId)) throw new Error("对方已经是活动成员");
    if (activity.memberIds.length >= activity.maxMembers) throw new Error("活动名额已满");
    if (data.invitations.some((i) => i.activityId === activityId && i.inviteeId === inviteeId && i.status === "pending")) throw new Error("已有未处理的邀请，请等待对方回应");
    const inviter = data.users.find((u) => u.id === inviterId);
    const invitation: Invitation = { id: uid("i"), activityId, inviterId, inviteeId, message: message.trim(), status: "pending", createdAt: now() };
    data.invitations.unshift(invitation);
    addNotice(data, inviteeId, "invite", (inviter?.nickname ?? "有同学") + " 邀请你加入《" + activity.title + "》，去通知中心处理吧。");
    save(data); return invitation;
  },
  respondInvitation(userId: string, invitationId: string, accept: boolean) {
    const data = load(); const invitation = data.invitations.find((i) => i.id === invitationId);
    if (!invitation || invitation.inviteeId !== userId) throw new Error("邀请不存在");
    if (invitation.status !== "pending") throw new Error("该邀请已处理过了");
    const activity = data.activities.find((a) => a.id === invitation.activityId);
    if (!activity) throw new Error("活动不存在");
    const responder = data.users.find((u) => u.id === userId);
    if (!accept) {
      invitation.status = "declined";
      addNotice(data, invitation.inviterId, "system", (responder?.nickname ?? "对方") + " 婉拒了你对《" + activity.title + "》的邀请");
      save(data); return;
    }
    if (activity.status === "cancelled" || activity.status === "finished") throw new Error("该活动已结束或取消，无法加入");
    if (activity.memberIds.includes(userId)) { invitation.status = "accepted"; save(data); return; }
    if (activity.memberIds.length >= activity.maxMembers) throw new Error("活动名额已满，无法接受邀请");
    invitation.status = "accepted"; activity.memberIds.push(userId); syncStatus(activity);
    addNotice(data, invitation.inviterId, "system", (responder?.nickname ?? "对方") + " 接受了邀请，已加入《" + activity.title + "》");
    addNotice(data, userId, "approved", "你已通过邀请加入《" + activity.title + "》，请留意活动时间与地点。");
    save(data);
  },
  report(reporterId: string, targetType: Report["targetType"], targetId: string, reason: string, detail: string) {
    const data = load();
    if (!reason.trim()) throw new Error("请选择举报理由");
    const record: Report = { id: uid("r"), reporterId, targetType, targetId, reason: reason.trim(), detail: detail.trim(), createdAt: now() };
    data.reports.unshift(record);
    addNotice(data, reporterId, "system", "举报已提交，管理员会在 24 小时内处理（演示流程）。");
    save(data); return record;
  },
  sendMessage(senderId: string, receiverId: string, content: string) {
    const data = load(); const text = content.trim();
    if (!text) throw new Error("消息内容不能为空");
    if (!data.users.some((u) => u.id === receiverId)) throw new Error("对方不存在");
    const message: Message = { id: uid("m"), senderId, receiverId, content: text, createdAt: now() };
    data.messages.push(message); save(data); return message;
  },
};
