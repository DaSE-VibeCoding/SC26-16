import { User } from "@/lib/types";
export { systemAvatars } from "@/lib/avatars";

const tones = { indigo: "bg-indigo-100 text-indigo-700", emerald: "bg-emerald-100 text-emerald-700", orange: "bg-orange-100 text-orange-700", rose: "bg-rose-100 text-rose-700" };

export function UserAvatar({ user, size = "h-9 w-9" }: { user: User; size?: string }) {
  if (user.avatarUrl) return <img alt={`${user.nickname} 的头像`} className={`${size} rounded-full object-cover`} src={user.avatarUrl} />;
  return <span aria-label={`${user.nickname} 的头像`} className={`grid ${size} place-items-center rounded-full font-black ${tones[user.avatarTone]}`}>{user.nickname.slice(0, 1)}</span>;
}
