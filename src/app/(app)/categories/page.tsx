import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { getCategories } from "@/lib/data/categories";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const categories = await getCategories(user.id);

  return (
    <CategoriesClient
      initialCategories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: c.icon ?? "MoreHorizontal",
        userId: c.userId,
      }))}
    />
  );
}
