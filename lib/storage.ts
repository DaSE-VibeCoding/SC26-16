"use client";
import { createSeedData, hashText } from "./seed";
import {
  Activity,
  AppData,
  Application,
  ApplicationProfileVisibility,
  Comment,
  CreateActivityInput,
  Evaluation,
  Favorite,
  Invitation,
  Message,
  Notification,
  Report,
  SubmitEvaluationInput,
  UpdateProfileInput,
  UpdateSettingsInput,
  User,
} from "./types";

const KEY = "campusmate_data_v1";
const SESSION_KEY = "campusmate_session_v1";
const VERSION_KEY = "campusmate_version";
const VERSION = "3";
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const now = () => new Date().toISOString();
const defaultApplicationProfileVisibility: ApplicationProfileVisibility = {
  college: true,
  grade: true,
  interests: true,
  bio: false,
  availability: true,
  creditScore: true,
};

function normalize(data: AppData): AppData {
  data.schemaVersion = 3;
  data.comments ??= [];
  data.favorites = (data.favorites ?? []).map((item) => ({
    id: (item as Favorite).id ?? uid("f"),
    userId: item.userId,
    activityId: item.activityId,
    createdAt: (item as Favorite).createdAt ?? now(),
  }));
  data.invitations = (data.invitations ?? []).map((item) => ({
    ...item,
    message: (item as Invitation).message ?? "",
    status: ((item.status as string) === "rejected" ? "declined" : item.status) as Invitation["status"],
  }));
  data.reports = (data.reports ?? []).map((item) => {
    const legacy = item as Report & { activityId?: string; status?: Report["status"] };
    return {
      id: legacy.id,
      reporterId: legacy.reporterId,
      targetType: legacy.targetType ?? "activity",
      targetId: legacy.targetId ?? legacy.activityId ?? "",
      reason: legacy.reason,
      detail: legacy.detail ?? "",
      status: legacy.status ?? "pending",
      createdAt: legacy.createdAt,
      resolvedAt: legacy.resolvedAt,
    };
  });
  data.messages ??= [];
  data.creditLogs ??= [];
  data.evaluations ??= [];
  data.users.forEach((user) => {
    user.bio ??= "";
    user.creditScore ??= 100;
    user.notificationPreferences ??= { applications: true, activityUpdates: true, social: true, system: true };
    user.notificationPreferences.applications ??= true;
    user.notificationPreferences.activityUpdates ??= true;
    user.notificationPreferences.social ??= true;
    user.notificationPreferences.system ??= true;
    user.profileVisible ??= true;
    user.applicationProfileVisibility ??= { ...defaultApplicationProfileVisibility };
    user.applicationProfileVisibility.college ??= true;
    user.applicationProfileVisibility.grade ??= true;
    user.applicationProfileVisibility.interests ??= true;
    user.applicationProfileVisibility.bio ??= false;
    user.applicationProfileVisibility.availability ??= true;
    user.applicationProfileVisibility.creditScore ??= true;
    user.preferredCategories ??= [];
    user.availability ??= "时间灵活";
    user.avatarTone ??= "indigo";
    user.avatarUrl ??= "";
    user.isAdmin ??= user.id === "u-lin";
  });
  syncDerived(data);
  return data;
}

function load(): AppData {
  const raw = localStorage.getItem(KEY);
  if (!raw) throw new Error("数据尚未初始化");
  try {
    return normalize(JSON.parse(raw) as AppData);
  } catch {
    throw new Error("本地演示数据已损坏");
  }
}

function save(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function addCredit(data: AppData, userId: string, change: number, reason: string, activityId?: string) {
  if (activityId && data.creditLogs.some((item) => item.userId === userId && item.activityId === activityId && item.reason === reason)) return;
  const user = data.users.find((item) => item.id === userId);
  if (!user) return;
  user.creditScore = Math.max(0, user.creditScore + change);
  data.creditLogs.unshift({ id: uid("credit"), userId, activityId, change, reason, createdAt: now() });
}

function addNotice(data: AppData, userId: string, type: Notification["type"], content: string, activityId?: string) {
  const user = data.users.find((item) => item.id === userId);
  const preference =
    type === "application" || type === "approved" || type === "rejected"
      ? "applications"
      : type === "exit" || type === "cancel" || type === "reminder"
        ? "activityUpdates"
        : type === "invite" || type === "comment" || type === "evaluation"
          ? "social"
          : "system";
  if (user && !user.notificationPreferences[preference]) return;
  data.notifications.unshift({ id: uid("n"), userId, type, content, read: false, createdAt: now(), activityId });
}

function syncStatus(activity: Activity) {
  if (activity.status === "cancelled") return;
  if (new Date(activity.endTime).getTime() <= Date.now()) {
    activity.status = "finished";
    return;
  }
  activity.status = activity.memberIds.length >= activity.maxMembers ? "full" : "open";
}

function syncDerived(data: AppData) {
  data.activities.forEach((activity) => {
    activity.endTime ??= new Date(new Date(activity.startTime).getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
    syncStatus(activity);
    if (activity.status === "finished") activity.memberIds.forEach((userId) => addCredit(data, userId, 2, "完成活动", activity.id));
  });
  data.applications.forEach((application) => {
    const activity = data.activities.find((item) => item.id === application.activityId);
    if (application.status === "pending" && activity && activity.status === "finished") application.status = "withdrawn";
    if (application.status === "pending" && activity?.status === "cancelled") application.status = "cancelled";
  });
  data.invitations.forEach((invitation) => {
    const activity = data.activities.find((item) => item.id === invitation.activityId);
    if (invitation.status === "pending" && activity && (activity.status === "finished" || activity.status === "cancelled")) invitation.status = "declined";
  });
}

export const storage = {
  async init() {
    if (!localStorage.getItem(KEY)) save(normalize(await createSeedData()));
    else {
      try {
        save(load());
      } catch {
        save(normalize(await createSeedData()));
        localStorage.removeItem(SESSION_KEY);
      }
    }
    localStorage.setItem(VERSION_KEY, VERSION);
  },
  read() {
    const data = load();
    save(data);
    return data;
  },
  session() {
    return localStorage.getItem(SESSION_KEY);
  },
  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
  async reset() {
    save(normalize(await createSeedData()));
    localStorage.setItem(VERSION_KEY, VERSION);
    localStorage.removeItem(SESSION_KEY);
  },
  async register(input: { nickname: string; college: string; grade: string; interests: string[]; password: string }) {
    const data = load();
    if (data.users.some((u) => u.nickname.trim() === input.nickname.trim())) throw new Error("该昵称已被使用，请换一个昵称");
    const user: User = {
      id: uid("u"),
      nickname: input.nickname.trim(),
      college: input.college.trim(),
      grade: input.grade.trim(),
      interests: input.interests,
      bio: "",
      creditScore: 100,
      notificationPreferences: { applications: true, activityUpdates: true, social: true, system: true },
      profileVisible: true,
      applicationProfileVisibility: { ...defaultApplicationProfileVisibility },
      preferredCategories: [],
      availability: "时间灵活",
      avatarTone: "indigo",
      avatarUrl: "",
      passwordHash: await hashText(input.password),
      createdAt: now(),
    };
    data.users.push(user);
    save(data);
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  },
  async login(nickname: string, password: string) {
    const data = load();
    const hash = await hashText(password);
    const user = data.users.find((u) => u.nickname === nickname.trim() && u.passwordHash === hash);
    if (!user) throw new Error("昵称或密码不正确");
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  },
  updateProfile(userId: string, input: UpdateProfileInput) {
    const data = load();
    const user = data.users.find((item) => item.id === userId);
    if (!user) throw new Error("用户不存在");
    const nickname = input.nickname.trim();
    if (!nickname) throw new Error("昵称不能为空");
    if (data.users.some((item) => item.id !== userId && item.nickname === nickname)) throw new Error("该昵称已被使用，请换一个昵称");
    user.nickname = nickname;
    user.college = input.college.trim();
    user.grade = input.grade.trim();
    user.interests = input.interests;
    user.bio = input.bio.trim();
    user.avatarTone = input.avatarTone;
    user.avatarUrl = input.avatarUrl ?? "";
    save(data);
  },
  updateSettings(userId: string, input: UpdateSettingsInput) {
    const data = load();
    const user = data.users.find((item) => item.id === userId);
    if (!user) throw new Error("用户不存在");
    user.notificationPreferences = input.notificationPreferences;
    user.profileVisible = input.profileVisible;
    user.applicationProfileVisibility = input.applicationProfileVisibility;
    user.preferredCategories = input.preferredCategories;
    user.availability = input.availability;
    save(data);
  },
  createActivity(userId: string, input: CreateActivityInput) {
    const data = load();
    const activity: Activity = { id: uid("a"), creatorId: userId, ...input, memberIds: [userId], status: "open", createdAt: now() };
    syncStatus(activity);
    data.activities.unshift(activity);
    addCredit(data, userId, 3, "发布活动", activity.id);
    save(data);
    return activity;
  },
  apply(userId: string, activityId: string, message: string) {
    const data = load();
    const activity = data.activities.find((a) => a.id === activityId);
    if (!activity || activity.status === "cancelled" || activity.status === "finished") throw new Error("活动不可申请");
    if (activity.memberIds.includes(userId)) throw new Error("你已经是活动成员");
    if (activity.memberIds.length >= activity.maxMembers) throw new Error("活动名额已满");
    if (data.applications.some((a) => a.activityId === activityId && a.applicantId === userId && a.status === "pending")) throw new Error("你已经提交过申请");
    const application: Application = { id: uid("p"), activityId, applicantId: userId, message: message.trim(), status: "pending", createdAt: now() };
    data.applications.unshift(application);
    addNotice(data, activity.creatorId, "application", "有新同学申请加入你的活动《" + activity.title + "》", activity.id);
    save(data);
    return application;
  },
  review(ownerId: string, applicationId: string, approved: boolean) {
    const data = load();
    const application = data.applications.find((a) => a.id === applicationId);
    if (!application || application.status !== "pending") throw new Error("该申请无法处理");
    const activity = data.activities.find((a) => a.id === application.activityId);
    if (!activity || activity.creatorId !== ownerId) throw new Error("你无权处理此申请");
    if (activity.status === "cancelled" || activity.status === "finished") throw new Error("活动已结束，无法处理申请");
    if (approved && activity.memberIds.includes(application.applicantId)) {
      application.status = "accepted";
      save(data);
      return;
    }
    if (approved && activity.memberIds.length >= activity.maxMembers) throw new Error("活动名额已满");
    application.status = approved ? "accepted" : "rejected";
    if (approved) {
      activity.memberIds.push(application.applicantId);
      syncStatus(activity);
      addNotice(data, application.applicantId, "approved", "你已成功加入《" + activity.title + "》，请留意活动时间与地点。", activity.id);
    } else addNotice(data, application.applicantId, "rejected", "《" + activity.title + "》的申请暂未通过，继续寻找适合你的活动吧。", activity.id);
    save(data);
  },
  exitActivity(userId: string, activityId: string) {
    const data = load();
    const activity = data.activities.find((a) => a.id === activityId);
    if (!activity || !activity.memberIds.includes(userId)) throw new Error("你不是该活动成员");
    if (activity.status === "finished" || activity.status === "cancelled") throw new Error("已结束或取消的活动不能退出");
    if (activity.creatorId === userId) throw new Error("发起人请使用取消活动功能");
    activity.memberIds = activity.memberIds.filter((id) => id !== userId);
    syncStatus(activity);
    if (new Date(activity.startTime).getTime() - Date.now() < 24 * 60 * 60 * 1000) addCredit(data, userId, -2, "临近活动退出", activity.id);
    addNotice(data, activity.creatorId, "exit", "有成员退出了《" + activity.title + "》", activity.id);
    save(data);
  },
  withdrawApplication(userId: string, applicationId: string) {
    const data = load();
    const application = data.applications.find((item) => item.id === applicationId);
    if (!application || application.applicantId !== userId || application.status !== "pending") throw new Error("该申请无法撤回");
    application.status = "withdrawn";
    save(data);
  },
  cancelActivity(userId: string, activityId: string, reason = "发起人取消活动") {
    const data = load();
    const activity = data.activities.find((a) => a.id === activityId);
    if (!activity || activity.creatorId !== userId) throw new Error("你无权取消此活动");
    if (activity.status === "finished") throw new Error("已结束活动不能取消");
    activity.status = "cancelled";
    activity.cancelReason = reason.trim() || "发起人取消活动";
    data.invitations.forEach((i) => {
      if (i.activityId === activityId && i.status === "pending") i.status = "declined";
    });
    data.applications.forEach((application) => {
      if (application.activityId === activityId && application.status === "pending") {
        application.status = "cancelled";
        addNotice(data, application.applicantId, "cancel", `《${activity.title}》已取消，你的申请已自动关闭。`, activity.id);
      }
    });
    if (new Date(activity.startTime).getTime() - Date.now() < 24 * 60 * 60 * 1000) addCredit(data, userId, -3, "临近活动取消", activity.id);
    activity.memberIds
      .filter((id) => id !== userId)
      .forEach((id) => addNotice(data, id, "cancel", `发起人已取消《${activity.title}》：${activity.cancelReason}`, activity.id));
    save(data);
  },
  markNoticesRead(userId: string) {
    const data = load();
    data.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    save(data);
  },
  deleteNotice(userId: string, noticeId: string) {
    const data = load();
    const index = data.notifications.findIndex((notice) => notice.id === noticeId && notice.userId === userId);
    if (index < 0) throw new Error("通知不存在或无权删除");
    data.notifications.splice(index, 1);
    save(data);
  },
  addComment(userId: string, activityId: string, content: string) {
    const data = load();
    const activity = data.activities.find((a) => a.id === activityId);
    if (!activity) throw new Error("活动不存在");
    const text = content.trim();
    if (!text) throw new Error("评论内容不能为空");
    if (text.length > 200) throw new Error("评论最多 200 字");
    const comment: Comment = { id: uid("c"), activityId, authorId: userId, content: text, createdAt: now() };
    data.comments.unshift(comment);
    if (activity.creatorId !== userId) addNotice(data, activity.creatorId, "comment", "你的活动《" + activity.title + "》收到了一条新评论", activity.id);
    save(data);
    return comment;
  },
  deleteComment(userId: string, commentId: string) {
    const data = load();
    const comment = data.comments.find((c) => c.id === commentId);
    if (!comment) throw new Error("评论不存在");
    if (comment.authorId !== userId) throw new Error("只能删除自己的评论");
    data.comments = data.comments.filter((c) => c.id !== commentId);
    save(data);
  },
  toggleFavorite(userId: string, activityId: string) {
    const data = load();
    if (!data.activities.some((a) => a.id === activityId)) throw new Error("活动不存在");
    const existing = data.favorites.find((f) => f.userId === userId && f.activityId === activityId);
    if (existing) {
      data.favorites = data.favorites.filter((f) => f.id !== existing.id);
      save(data);
      return false;
    }
    const favorite: Favorite = { id: uid("f"), userId, activityId, createdAt: now() };
    data.favorites.unshift(favorite);
    save(data);
    return true;
  },
  invite(inviterId: string, activityId: string, inviteeId: string, message = "") {
    const data = load();
    const activity = data.activities.find((a) => a.id === activityId);
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
    addNotice(data, inviteeId, "invite", (inviter?.nickname ?? "有同学") + " 邀请你加入《" + activity.title + "》，去通知中心处理吧。", activity.id);
    save(data);
    return invitation;
  },
  respondInvitation(userId: string, invitationId: string, accept: boolean) {
    const data = load();
    const invitation = data.invitations.find((i) => i.id === invitationId);
    if (!invitation || invitation.inviteeId !== userId) throw new Error("邀请不存在");
    if (invitation.status !== "pending") throw new Error("该邀请已处理过了");
    const activity = data.activities.find((a) => a.id === invitation.activityId);
    if (!activity) throw new Error("活动不存在");
    const responder = data.users.find((u) => u.id === userId);
    if (!accept) {
      invitation.status = "declined";
      addNotice(data, invitation.inviterId, "system", (responder?.nickname ?? "对方") + " 婉拒了你对《" + activity.title + "》的邀请", activity.id);
      save(data);
      return;
    }
    if (activity.status === "cancelled" || activity.status === "finished") throw new Error("该活动已结束或取消，无法加入");
    const pendingApp = data.applications.find((p) => p.activityId === activity.id && p.applicantId === userId && p.status === "pending");
    if (activity.memberIds.includes(userId)) {
      invitation.status = "accepted";
      if (pendingApp) pendingApp.status = "accepted";
      save(data);
      return;
    }
    if (activity.memberIds.length >= activity.maxMembers) throw new Error("活动名额已满，无法接受邀请");
    invitation.status = "accepted";
    activity.memberIds.push(userId);
    syncStatus(activity);
    if (pendingApp) pendingApp.status = "accepted";
    addNotice(data, invitation.inviterId, "system", (responder?.nickname ?? "对方") + " 接受了邀请，已加入《" + activity.title + "》", activity.id);
    addNotice(data, userId, "approved", "你已通过邀请加入《" + activity.title + "》，请留意活动时间与地点。", activity.id);
    save(data);
  },
  report(reporterId: string, targetType: Report["targetType"], targetId: string, reason: string, detail: string) {
    const data = load();
    if (!reason.trim()) throw new Error("请选择举报理由");
    const exists = targetType === "activity" ? data.activities.some((item) => item.id === targetId) : data.users.some((item) => item.id === targetId);
    if (!exists) throw new Error("举报对象不存在");
    if (data.reports.some((item) => item.reporterId === reporterId && item.targetType === targetType && item.targetId === targetId && item.status === "pending")) {
      throw new Error("你已提交过该举报，管理员会尽快处理");
    }
    const record: Report = { id: uid("r"), reporterId, targetType, targetId, reason: reason.trim(), detail: detail.trim(), status: "pending", createdAt: now() };
    data.reports.unshift(record);
    addNotice(data, reporterId, "system", "举报已提交，管理员会在 24 小时内处理（演示流程）。");
    save(data);
    return record;
  },
  sendMessage(senderId: string, receiverId: string, content: string) {
    const data = load();
    const text = content.trim();
    if (!text) throw new Error("消息内容不能为空");
    if (!data.users.some((u) => u.id === receiverId)) throw new Error("对方不存在");
    const message: Message = { id: uid("m"), senderId, receiverId, content: text, createdAt: now() };
    data.messages.push(message);
    save(data);
    return message;
  },
  submitEvaluation(userId: string, input: SubmitEvaluationInput) {
    const data = load();
    const activity = data.activities.find((item) => item.id === input.activityId);
    if (!activity || activity.status !== "finished") throw new Error("活动结束后才能评价");
    if (!activity.memberIds.includes(userId) || !activity.memberIds.includes(input.revieweeId)) throw new Error("只有活动成员之间可以评价");
    if (userId === input.revieweeId) throw new Error("不能评价自己");
    if (data.evaluations.some((item) => item.activityId === input.activityId && item.reviewerId === userId && item.revieweeId === input.revieweeId)) throw new Error("你已经评价过这位成员");
    const rating = Math.min(5, Math.max(1, input.rating)) as Evaluation["rating"];
    const reviewer = data.users.find((item) => item.id === userId);
    const reviewee = data.users.find((item) => item.id === input.revieweeId);
    if (!reviewer || !reviewee) throw new Error("评价对象不存在");
    const tags = input.tags.map((item) => item.trim()).filter(Boolean).slice(0, 4);
    const evaluation: Evaluation = {
      id: uid("e"),
      activityId: activity.id,
      reviewerId: userId,
      revieweeId: input.revieweeId,
      rating,
      tags,
      comment: input.comment.trim().slice(0, 160),
      createdAt: now(),
    };
    data.evaluations.unshift(evaluation);
    if (rating === 5) addCredit(data, input.revieweeId, 2, `收到${reviewer.nickname}的五星评价`, activity.id);
    else if (rating === 4) addCredit(data, input.revieweeId, 1, `收到${reviewer.nickname}的好评`, activity.id);
    else if (rating <= 2) addCredit(data, input.revieweeId, -2, `收到${reviewer.nickname}的低分评价`, activity.id);
    addNotice(data, input.revieweeId, "evaluation", `${reviewer.nickname}评价了你在《${activity.title}》中的表现`, activity.id);
    save(data);
    return evaluation;
  },
  importData(serialized: string) {
    let candidate: unknown;
    try {
      candidate = JSON.parse(serialized);
    } catch {
      throw new Error("导入文件不是有效的 JSON");
    }
    if (!candidate || typeof candidate !== "object" || !Array.isArray((candidate as AppData).users) || !Array.isArray((candidate as AppData).activities)) {
      throw new Error("导入文件不是有效的 CampusMate 数据");
    }
    const data = normalize(candidate as AppData);
    save(data);
    localStorage.setItem(VERSION_KEY, VERSION);
  },
  resolveReport(adminId: string, reportId: string, action: "resolved" | "dismissed") {
    const data = load();
    if (!data.users.find((user) => user.id === adminId)?.isAdmin) throw new Error("仅演示管理员可以处理举报");
    const report = data.reports.find((item) => item.id === reportId);
    if (!report || report.status !== "pending") throw new Error("该举报无法处理");
    report.status = action;
    report.resolvedAt = now();
    if (action === "resolved" && report.targetType === "activity") {
      const activity = data.activities.find((item) => item.id === report.targetId);
      if (activity && activity.status !== "finished") {
        activity.status = "cancelled";
        activity.cancelReason = "该活动已被演示管理员下架";
        activity.memberIds.forEach((id) => addNotice(data, id, "cancel", `《${activity.title}》已被下架`, activity.id));
      }
    }
    save(data);
  },
  moderateActivity(adminId: string, activityId: string, action: "cancel" | "reopen") {
    const data = load();
    if (!data.users.find((user) => user.id === adminId)?.isAdmin) throw new Error("仅演示管理员可以审核活动");
    const activity = data.activities.find((item) => item.id === activityId);
    if (!activity) throw new Error("活动不存在");
    if (action === "cancel") {
      if (activity.status === "finished") throw new Error("已结束活动不能下架");
      activity.status = "cancelled";
      activity.cancelReason = "该活动已被演示管理员下架";
      activity.memberIds.forEach((id) => addNotice(data, id, "cancel", `《${activity.title}》已被下架`, activity.id));
    } else {
      if (activity.status !== "cancelled") throw new Error("只有已取消活动可以恢复展示");
      activity.cancelReason = undefined;
      syncStatus(activity);
    }
    save(data);
  },
};
