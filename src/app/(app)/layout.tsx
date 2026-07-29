import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { TransactionPanelProvider } from "@/providers/TransactionPanelProvider";
import { TransactionDataProvider } from "@/providers/TransactionDataProvider";
import { TransactionPanel } from "@/components/transactions/TransactionPanel";
import { TransactionProcessor } from "@/components/TransactionProcessor";
import { createClient } from "@/lib/supabase/server";

async function getTransactionData(userId: string) {
  const supabase = await createClient();

  const [cardsRes, categoriesRes, peopleRes] = await Promise.all([
    supabase
      .from("cards")
      .select("id, name")
      .is("deleted_at", null)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("categories")
      .select("id, name, icon")
      .is("deleted_at", null)
      .eq("user_id", userId)
      .order("name", { ascending: true })
      .limit(100),
    supabase
      .from("people")
      .select("id, name")
      .is("deleted_at", null)
      .eq("user_id", userId)
      .order("name", { ascending: true })
      .limit(100),
  ]);

  return {
    cards: cardsRes.data ?? [],
    categories: categoriesRes.data ?? [],
    people: peopleRes.data ?? [],
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { cards, categories, people } = user
    ? await getTransactionData(user.id)
    : { cards: [], categories: [], people: [] };

  return (
    <TransactionDataProvider cards={cards} categories={categories} people={people}>
      <TransactionProcessor />
      <TransactionPanelProvider>
        <div className="flex h-screen bg-background">
          {/* Sidebar — visível apenas em desktop */}
          <div className="hidden md:flex">
            <Sidebar />
          </div>

          {/* Coluna direita: navbar + conteúdo */}
          <div className="flex flex-1 flex-col min-w-0">
            <Navbar />
            <main className="flex-1 overflow-y-auto min-h-0 p-6 pb-12 md:pb-6">{children}</main>
          </div>
        </div>
        <TransactionPanel />
      </TransactionPanelProvider>
    </TransactionDataProvider>
  );
}
