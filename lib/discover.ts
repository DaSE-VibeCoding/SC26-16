import { Activity, User } from "./types";

const RECENT_KEY = "campusmate_recent_views_v1";

export function readRecentActivityIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function rememberActivity(activityId: string) {
  if (typeof window === "undefined") return;
  const next = [activityId, ...readRecentActivityIds().filter((id) => id !== activityId)].slice(0, 6);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("campusmate:recent-view"));
}

export function clearRecentActivities() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RECENT_KEY);
  window.dispatchEvent(new CustomEvent("campusmate:recent-view"));
}

export function getInterestScore(activity: Activity, user: User | null) {
  if (!user) return 0;
  const interests = new Set(user.interests.map((item) => item.toLowerCase()));
  return activity.tags.reduce((score, tag) => score + (interests.has(tag.toLowerCase()) ? 1 : 0), 0);
}

export function getActivityPopularity(activity: Activity) {
  return activity.maxMembers ? activity.memberIds.length / activity.maxMembers : 0;
}

export function getTimeBucket(startTime: string) {
  const hour = new Date(startTime).getHours();
  if (hour < 12) return "上午";
  if (hour < 18) return "下午";
  return "晚上";
}
