import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settingsResult = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "cs_whatsapp"))
    .limit(1);
  const csWhatsapp = settingsResult[0]?.value || "6289513679939";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer csWhatsapp={csWhatsapp} />
    </div>
  );
}
