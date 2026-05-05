import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { TransactionPanelProvider } from "@/providers/TransactionPanelProvider";
import { TransactionDataProvider } from "@/providers/TransactionDataProvider";
import { TransactionPanel } from "@/components/transactions/TransactionPanel";
import { TransactionProcessor } from "@/components/TransactionProcessor";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TransactionDataProvider cards={[]} categories={[]} people={[]}>
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
