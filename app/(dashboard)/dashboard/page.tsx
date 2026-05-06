import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/src/lib/auth";
import { getRoleHomePath } from "@/src/lib/roleRoutes";

export default async function DashboardEntryPage() {
  const user = await getUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  redirect(getRoleHomePath(user.role));
}
