export const categories = ["自习搭子", "运动搭子", "饭搭子", "比赛搭子", "游戏搭子", "兴趣活动"] as const;
export type Category = (typeof categories)[number];
export type ActivityStatus = "open" | "full" | "cancelled" | "finished";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface User {
  id: string; nickname: string; college: string; grade: string; interests: string[]; passwordHash: string; createdAt: string;
}
export interface Activity {
  id: string; creatorId: string; title: string; description: string; category: Category; location: string; startTime: string; maxMembers: number; memberIds: string[]; tags: string[]; status: ActivityStatus; createdAt: string;
}
export interface Application {
  id: string; activityId: string; applicantId: string; message: string; status: ApplicationStatus; createdAt: string;
}
export interface Notification {
  id: string; userId: string; type: "application" | "approved" | "rejected" | "exit" | "cancel" | "system"; content: string; read: boolean; createdAt: string;
}
export interface AppData { users: User[]; activities: Activity[]; applications: Application[]; notifications: Notification[]; }
export interface CreateActivityInput { title: string; description: string; category: Category; location: string; startTime: string; maxMembers: number; tags: string[]; }
