import { Activity, AppData, Category, Comment, Favorite, Invitation, Message, Notification, User } from "./types";

const base = "2026-07-";
const categoryData: Array<[Category, string, string, string, string[]]> = [
  ["自习搭子", "期末高数冲刺自习", "图书馆三楼静音区", "一起专注两小时，结束后互相打卡。", ["期末", "安静", "长期"]],
  ["运动搭子", "周五羽毛球新手局", "东区体育馆 2 号场", "新手友好，自带球拍更佳。", ["羽毛球", "新手友好", "晚间"]],
  ["饭搭子", "食堂新品探店", "北苑二食堂", "一起尝尝新开的拌饭窗口。", ["美食", "午餐", "轻松"]],
  ["比赛搭子", "挑战杯产品设计招募", "创新创业中心 204", "寻找一位擅长视觉表达的队友。", ["竞赛", "UI设计", "挑战杯"]],
  ["游戏搭子", "周末桌游阿瓦隆", "学生活动中心 108", "6 到 8 人局，欢迎新手。", ["桌游", "阿瓦隆", "周末"]],
  ["兴趣活动", "校园夜景摄影散步", "南门集合", "带上手机或相机，记录夏夜校园。", ["摄影", "散步", "夜景"]],
];

export async function hashText(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function createSeedData(): Promise<AppData> {
  const passwordHash = await hashText("123456");
  const users: User[] = [
    { id: "u-lin", nickname: "林小羽", college: "信息学院", grade: "大二", interests: ["羽毛球", "摄影", "自习"], passwordHash, createdAt: "2026-07-01T08:00:00" },
    { id: "u-zhou", nickname: "周同学", college: "设计学院", grade: "大三", interests: ["UI设计", "竞赛", "桌游"], passwordHash, createdAt: "2026-07-01T08:00:00" },
    { id: "u-chen", nickname: "陈同学", college: "外国语学院", grade: "大四", interests: ["英语", "跑步", "自习"], passwordHash, createdAt: "2026-07-01T08:00:00" },
    { id: "u-su", nickname: "苏同学", college: "数据学院", grade: "大二", interests: ["羽毛球", "桌游", "摄影"], passwordHash, createdAt: "2026-07-01T08:00:00" },
  ];
  const activities: Activity[] = Array.from({ length: 18 }, (_, index) => {
    const [category, title, location, description, tags] = categoryData[index % categoryData.length];
    const creatorId = users[index % users.length].id;
    const companion = index % 4 === 0 ? [users[(index + 1) % users.length].id] : [];
    const maxMembers = index % 3 === 0 ? 2 : index % 3 === 1 ? 4 : 6;
    return {
      id: `a-${index + 1}`, creatorId, title: index < 6 ? title : `${title} · 第${Math.floor(index / 6) + 1}期`, description,
      category, location, startTime: `${base}${String(18 + (index % 8)).padStart(2, "0")}T${index % 2 ? "19:00" : "14:00"}`,
      maxMembers, memberIds: [creatorId, ...companion], tags, status: "open", createdAt: `${base}12T10:00:00`,
    };
  });
  const comments: Comment[] = [
    { id: "c-1", activityId: "a-1", authorId: "u-zhou", content: "请问带笔记本电脑去可以吗？想顺便整理错题。", createdAt: `${base}13T09:30:00` },
    { id: "c-2", activityId: "a-1", authorId: "u-lin", content: "可以的！静音区有插座，记得戴耳机就好。", createdAt: `${base}13T10:02:00` },
    { id: "c-3", activityId: "a-2", authorId: "u-chen", content: "完全零基础也能来吗？", createdAt: `${base}13T18:20:00` },
    { id: "c-4", activityId: "a-2", authorId: "u-su", content: "楼上放心，上次我也是第一次打，大家都很友好。", createdAt: `${base}13T19:05:00` },
  ];
  const favorites: Favorite[] = [
    { id: "f-1", userId: "u-lin", activityId: "a-5", createdAt: `${base}13T08:00:00` },
    { id: "f-2", userId: "u-lin", activityId: "a-3", createdAt: `${base}13T08:01:00` },
  ];
  const invitations: Invitation[] = [
    { id: "i-1", activityId: "a-2", inviterId: "u-zhou", inviteeId: "u-lin", message: "看到你的兴趣有羽毛球，周五一起来打球呀！", status: "pending", createdAt: `${base}14T12:00:00` },
  ];
  const notifications: Notification[] = users.map((u, i) => (
    { id: `n-w-${u.id}`, userId: u.id, type: "system" as const, content: "欢迎来到搭个伴 CampusMate！完善兴趣标签可以获得更准的搭子推荐。", read: i === 0 ? false : true, createdAt: `${base}12T10:00:00` }
  ));
  notifications.unshift({ id: "n-i-1", userId: "u-lin", type: "invite", content: "周同学邀请你加入《周五羽毛球新手局》，去通知中心处理吧。", read: false, createdAt: `${base}14T12:00:00` });
  const messages: Message[] = [
    { id: "m-1", senderId: "u-zhou", receiverId: "u-lin", content: "你好呀，看到你也喜欢摄影！", createdAt: `${base}14T20:00:00` },
    { id: "m-2", senderId: "u-lin", receiverId: "u-zhou", content: "对呀，周末的夜景摄影散步你去吗？", createdAt: `${base}14T20:03:00` },
    { id: "m-3", senderId: "u-zhou", receiverId: "u-lin", content: "打算去！到时候南门见~", createdAt: `${base}14T20:05:00` },
    { id: "m-4", senderId: "u-chen", receiverId: "u-lin", content: "同学你好，高数自习局还有位置吗？", createdAt: `${base}15T09:00:00` },
  ];
  return { users, activities, applications: [], notifications, comments, favorites, invitations, reports: [], messages };
}
