"use client";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { Button } from "@/components/ui/button";
import { Menu, Plus, TrendingUp } from "lucide-react";
import { useTransactionPanel } from "@/providers/TransactionPanelProvider";
import { useState } from "react";
import Image from 'next/image'

export function Navbar() {
  const { open } = useTransactionPanel();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="flex h-[52px] items-center gap-3 border-b border-border bg-card px-4">
        {/* Hamburger — apenas mobile */}
        <button
          className="md:hidden p-1.5 rounded-md hover:bg-accent transition-colors"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1" />
        <ThemeToggle />
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => open()}
        >
          <Plus className="h-3.5 w-3.5" />
          Novo
        </Button>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-medium text-emerald-600 dark:bg-emerald-600 dark:text-emerald-200 select-none">
          FT
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
