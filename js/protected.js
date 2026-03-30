import { getCurrentUser } from "./auth.js";

export async function checkAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.replace('../index.html');
    return;
  }
  return user;
}