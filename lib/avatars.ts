function svgAvatar(bg: string, fg: string, accent: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="28" fill="${bg}"/><circle cx="48" cy="38" r="18" fill="${fg}"/><path d="M20 86c5-21 19-32 28-32s23 11 28 32" fill="${fg}"/><circle cx="70" cy="24" r="8" fill="${accent}"/></svg>`)}`;
}

export const systemAvatars = [
  { id: "indigo-student", label: "蓝色同学", url: svgAvatar("#e0e7ff", "#4f46e5", "#fbbf24") },
  { id: "emerald-runner", label: "绿色同学", url: svgAvatar("#d1fae5", "#059669", "#38bdf8") },
  { id: "rose-reader", label: "粉色同学", url: svgAvatar("#ffe4e6", "#e11d48", "#a78bfa") },
  { id: "orange-maker", label: "橙色同学", url: svgAvatar("#ffedd5", "#ea580c", "#22c55e") },
];
