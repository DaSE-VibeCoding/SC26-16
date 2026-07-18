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
  id: string; userId: string; type: "application" | "approved" | "rejected" | "exit" | "cancel" | "invite" | "comment" | "reminder" | "system"; content: string; read: boolean; createdAt: string;
}
export type InvitationStatus = "pending" | "accepted" | "declined";
export interface Comment {
  id: string; activityId: string; authorId: string; content: string; createdAt: string;
}
export interface Favorite {
  id: string; userId: string; activityId: string; createdAt: string;
}
export interface Invitation {
  id: string; activityId: string; inviterId: string; inviteeId: string; message: string; status: InvitationStatus; createdAt: string;
}
export interface Report {
  id: string; reporterId: string; targetType: "activity" | "user"; targetId: string; reason: string; detail: string; createdAt: string;
}
export interface Message {
  id: string; senderId: string; receiverId: string; content: string; createdAt: string;
}
export interface AppData { users: User[]; activities: Activity[]; applications: Application[]; notifications: Notification[]; comments: Comment[]; favorites: Favorite[]; invitations: Invitation[]; reports: Report[]; messages: Message[]; }
export interface CreateActivityInput { title: string; description: string; category: Category; location: string; startTime: string; maxMembers: number; tags: string[]; }
