"use client";
import { AppData, CreateActivityInput, Report, SubmitEvaluationInput, UpdateActivityInput, UpdateProfileInput, UpdateSettingsInput, User } from "@/lib/types";
import { storage } from "@/lib/storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AppContextValue = {
  data: AppData | null;
  currentUser: User | null;
  loading: boolean;
  refresh: () => void;
  logout: () => void;
  login: (nickname: string, password: string) => Promise<void>;
  register: (input: { nickname: string; college: string; grade: string; interests: string[]; password: string }) => Promise<void>;
  reset: () => Promise<void>;
  createActivity: (input: CreateActivityInput) => string;
  updateActivity: (activityId: string, input: UpdateActivityInput) => void;
  apply: (activityId: string, message: string) => void;
  review: (applicationId: string, approved: boolean) => void;
  exitActivity: (activityId: string) => void;
  withdrawApplication: (applicationId: string) => void;
  cancelActivity: (activityId: string, reason?: string) => void;
  markNoticesRead: () => void;
  deleteNotice: (noticeId: string) => void;
  updateProfile: (input: UpdateProfileInput) => void;
  updateSettings: (input: UpdateSettingsInput) => void;
  addComment: (activityId: string, content: string) => void;
  deleteComment: (commentId: string) => void;
  toggleFavorite: (activityId: string) => boolean;
  invite: (activityId: string, inviteeId: string, message?: string) => void;
  respondInvitation: (invitationId: string, accept: boolean) => void;
  report: (targetType: Report["targetType"], targetId: string, reason: string, detail: string) => void;
  sendMessage: (receiverId: string, content: string) => void;
  submitEvaluation: (input: SubmitEvaluationInput) => void;
  importData: (serialized: string) => void;
  resolveReport: (reportId: string, action: "resolved" | "dismissed") => void;
  moderateActivity: (activityId: string, action: "cancel" | "reopen") => void;
};
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(() => {
    const next = storage.read();
    const sessionId = storage.session();
    setData(next);
    setCurrentUser(next.users.find((u) => u.id === sessionId) ?? null);
  }, []);
  useEffect(() => {
    storage.init().then(refresh).finally(() => setLoading(false));
  }, [refresh]);
  const requireUser = () => {
    if (!currentUser) throw new Error("请先登录后再操作");
    return currentUser;
  };
  const requireAdmin = () => {
    const user = requireUser();
    if (!user.isAdmin) throw new Error("仅演示管理员可以执行此操作");
    return user;
  };
  const value = useMemo<AppContextValue>(
    () => ({
      data,
      currentUser,
      loading,
      refresh,
      logout: () => {
        storage.logout();
        refresh();
      },
      login: async (nickname, password) => {
        await storage.login(nickname, password);
        refresh();
      },
      register: async (input) => {
        await storage.register(input);
        refresh();
      },
      reset: async () => {
        await storage.reset();
        refresh();
      },
      createActivity: (input) => {
        const activity = storage.createActivity(requireUser().id, input);
        refresh();
        return activity.id;
      },
      updateActivity: (activityId, input) => {
        storage.updateActivity(requireUser().id, activityId, input);
        refresh();
      },
      apply: (activityId, message) => {
        storage.apply(requireUser().id, activityId, message);
        refresh();
      },
      review: (applicationId, approved) => {
        storage.review(requireUser().id, applicationId, approved);
        refresh();
      },
      exitActivity: (activityId) => {
        storage.exitActivity(requireUser().id, activityId);
        refresh();
      },
      withdrawApplication: (applicationId) => {
        storage.withdrawApplication(requireUser().id, applicationId);
        refresh();
      },
      cancelActivity: (activityId, reason) => {
        storage.cancelActivity(requireUser().id, activityId, reason);
        refresh();
      },
      markNoticesRead: () => {
        storage.markNoticesRead(requireUser().id);
        refresh();
      },
      deleteNotice: (noticeId) => {
        storage.deleteNotice(requireUser().id, noticeId);
        refresh();
      },
      updateProfile: (input) => {
        storage.updateProfile(requireUser().id, input);
        refresh();
      },
      updateSettings: (input) => {
        storage.updateSettings(requireUser().id, input);
        refresh();
      },
      addComment: (activityId, content) => {
        storage.addComment(requireUser().id, activityId, content);
        refresh();
      },
      deleteComment: (commentId) => {
        storage.deleteComment(requireUser().id, commentId);
        refresh();
      },
      toggleFavorite: (activityId) => {
        const added = storage.toggleFavorite(requireUser().id, activityId);
        refresh();
        return added;
      },
      invite: (activityId, inviteeId, message = "") => {
        storage.invite(requireUser().id, activityId, inviteeId, message);
        refresh();
      },
      respondInvitation: (invitationId, accept) => {
        storage.respondInvitation(requireUser().id, invitationId, accept);
        refresh();
      },
      report: (targetType, targetId, reason, detail) => {
        storage.report(requireUser().id, targetType, targetId, reason, detail);
        refresh();
      },
      sendMessage: (receiverId, content) => {
        storage.sendMessage(requireUser().id, receiverId, content);
        refresh();
      },
      submitEvaluation: (input) => {
        storage.submitEvaluation(requireUser().id, input);
        refresh();
      },
      importData: (serialized) => {
        storage.importData(serialized);
        refresh();
      },
      resolveReport: (reportId, action) => {
        storage.resolveReport(requireAdmin().id, reportId, action);
        refresh();
      },
      moderateActivity: (activityId, action) => {
        storage.moderateActivity(requireAdmin().id, activityId, action);
        refresh();
      },
    }),
    [data, currentUser, loading, refresh],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
