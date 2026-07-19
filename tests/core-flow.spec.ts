import { expect, test, type Page } from "@playwright/test";

async function signedInPage(page: Page, userId = "u-lin") {
  await page.goto("/");
  await page.waitForFunction(() => !!localStorage.getItem("campusmate_data_v1"));
  await page.evaluate((id) => localStorage.setItem("campusmate_session_v1", id), userId);
  await page.reload();
  await page.locator('a[href="/create"]').first().waitFor();
}

test("authenticated user can create an activity and persist it locally", async ({ page }) => {
  await signedInPage(page);
  await page.locator('a[href="/create"]').first().click();
  const title = `自动化测试活动 ${Date.now()}`;
  await page.locator("form input").first().fill(title);
  const future = new Date();
  future.setDate(future.getDate() + 2);
  const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
  await page.locator('input[type="datetime-local"]').first().fill(`${date}T19:00`);
  await page.locator('input[type="datetime-local"]').nth(1).fill(`${date}T21:00`);
  await page.locator("form input").nth(4).fill("自动化测试地点");
  await page.locator("textarea").fill("这是一条由 Playwright 创建的活动说明。");
  await page.getByTestId("activity-create-submit").click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const created = await page.evaluate((expectedTitle) => {
    const data = JSON.parse(localStorage.getItem("campusmate_data_v1") || "{}");
    return data.activities?.some((activity: { title: string; creatorId: string }) => activity.title === expectedTitle && activity.creatorId === "u-lin");
  }, title);
  expect(created).toBe(true);
});

test("settings can save notification, privacy, and preference controls", async ({ page }) => {
  await signedInPage(page);
  await page.locator('a[href="/profile"]').first().click();
  await page.locator('a[href="/settings"]').click();
  await page.locator('input[type="checkbox"]').first().uncheck();
  await page.locator('input[type="checkbox"]').nth(4).uncheck();
  await page.getByText("饭搭子").click();
  await page.getByText("保存设置").click();
  const saved = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("campusmate_data_v1") || "{}");
    const user = data.users?.find((item: { id: string }) => item.id === "u-lin");
    return Boolean(user && !user.notificationPreferences.applications && !user.profileVisible && user.preferredCategories.includes("饭搭子"));
  });
  expect(saved).toBe(true);
});

test("notification center can delete a notification", async ({ page }) => {
  await signedInPage(page);
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("campusmate_data_v1") || "{}");
    data.notifications = [{ id: "n-test-delete", userId: "u-lin", type: "system", content: "这是一条可删除测试通知", read: false, createdAt: new Date().toISOString() }, ...(data.notifications || [])];
    localStorage.setItem("campusmate_data_v1", JSON.stringify(data));
  });
  await page.goto("/notifications");
  await expect(page.getByText("这是一条可删除测试通知")).toBeVisible();
  await page.getByTestId("notice-delete-n-test-delete").dispatchEvent("click");
  await expect(page.getByText("这是一条可删除测试通知")).toHaveCount(0);
  await page.waitForFunction(() => {
    const data = JSON.parse(localStorage.getItem("campusmate_data_v1") || "{}");
    return !data.notifications?.some((notice: { id: string }) => notice.id === "n-test-delete");
  });
});

test("ordinary users cannot access the administrator view", async ({ page }) => {
  await signedInPage(page, "u-zhou");
  await page.goto("/admin");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "今天，找个同学一起完成。" })).toBeVisible();
});

test("cancelling an activity closes its pending applications", async ({ page }) => {
  await signedInPage(page, "u-chen");
  await page.goto("/activity/a-2");
  await page.getByTestId("activity-apply-submit").click();

  await page.evaluate(() => localStorage.setItem("campusmate_session_v1", "u-zhou"));
  await page.reload();
  page.once("dialog", (dialog) => dialog.accept("场地临时关闭"));
  await page.getByTestId("activity-cancel").click();

  const applicationStatus = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("campusmate_data_v1") || "{}");
    return data.applications?.find((item: { activityId: string; applicantId: string; status: string }) => item.activityId === "a-2" && item.applicantId === "u-chen")?.status;
  });
  expect(applicationStatus).toBe("cancelled");
});
