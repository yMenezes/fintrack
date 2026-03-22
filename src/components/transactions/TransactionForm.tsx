"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPES = [
  { value: "credit", label: "Crédito" },
  { value: "debit", label: "Débito" },
  { value: "pix", label: "Pix" },
  { value: "cash", label: "Dinheiro" },
];

type Card = { id: string; name: string; closing_day: number };
type Category = { id: string; name: string; icon: string };
type Person = { id: string; name: string };

type Props = {
  onSuccess: () => void;
};

export function TransactionForm({ onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [cents, setCents] = useState(0);

  const [form, setForm] = useState({
    description: "",
    installments_count: "1",
    purchase_date: new Date().toISOString().split("T")[0],
    type: "credit",
    card_id: "",
    category_id: "",
    person_id: "",
    notes: "",
  });

  // Reset ao montar o componente (toda vez que o painel abre)
  useEffect(() => {
    setCents(0);
    setForm({
      description: "",
      installments_count: "1",
      purchase_date: new Date().toISOString().split("T")[0],
      type: "credit",
      card_id: "",
      category_id: "",
      person_id: "",
      notes: "",
    });
  }, []);

  // Carrega os dados de apoio ao abrir o painel
  useEffect(() => {
    async function load() {
      const [cardsRes, catsRes, peopleRes] = await Promise.all([
        fetch("/api/cards"),
        fetch("/api/categories"),
        fetch("/api/people"),
      ]);
      const [cardsData, catsData, peopleData] = await Promise.all([
        cardsRes.json(),
        catsRes.json(),
        peopleRes.json(),
      ]);
      setCards(cardsData);
      setCategories(catsData);
      setPeople(peopleData);
    }
    load();
  }, []);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const isCredit = form.type === "credit";
  const installmentsCount = parseInt(form.installments_count) || 1;
  const totalAmount = cents / 100;
  const amountPerInstallment =
    totalAmount > 0
      ? (totalAmount / installmentsCount).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : null;

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    if (!form.description.trim()) {
      setError("Descrição é obrigatória");
      setLoading(false);
      return;
    }
    if (cents <= 0) {
      setError("Valor deve ser maior que zero");
      setLoading(false);
      return;
    }
    if (!form.purchase_date) {
      setError("Data da compra é obrigatória");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          total_amount: totalAmount,
          installments_count: isCredit ? installmentsCount : 1,
          purchase_date: form.purchase_date,
          type: form.type,
          card_id: form.card_id || null,
          category_id: form.category_id || null,
          person_id: form.person_id || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar lançamento");
        return;
      }

      router.refresh();
      onSuccess();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Tipo */}
      <div className="flex flex-col gap-1.5">
        <Label>Tipo</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                set("type", t.value);
                if (t.value !== "credit") set("installments_count", "1");
                if (t.value === "pix" || t.value === "cash") set("card_id", "");
              }}
              className={`rounded-lg border py-2 text-xs transition-colors ${
                form.type === t.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Descrição */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          placeholder="Ex: Mercado, Netflix..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      {/* Valor + Data */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Valor total</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              id="amount"
              inputMode="numeric"
              placeholder="0,00"
              className="pl-9"
              value={
                cents === 0
                  ? ""
                  : (cents / 100).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
              }
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const value = parseInt(digits || "0", 10);
                setCents(value);
                set("total_amount", (value / 100).toString());
              }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Data da compra</Label>
          <Input
            id="date"
            type="date"
            value={form.purchase_date}
            onChange={(e) => set("purchase_date", e.target.value)}
          />
        </div>
      </div>

      {/* Parcelas + Cartão — só aparece no crédito */}
      {(isCredit || form.type === "debit") && (
        <div className="grid grid-cols-2 gap-3">
          {isCredit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="installments">Parcelas</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                max="24"
                value={form.installments_count}
                onChange={(e) => set("installments_count", e.target.value)}
              />
            </div>
          )}
          <div
            className={`flex flex-col gap-1.5 ${!isCredit ? "col-span-2" : ""}`}
          >
            <Label>Cartão</Label>
            <Select
              value={form.card_id}
              onValueChange={(v) => set("card_id", v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Nenhum</span>
                </SelectItem>
                {cards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Preview do valor por parcela */}
      {isCredit && amountPerInstallment && installmentsCount > 1 && (
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
          <span className="text-xs text-muted-foreground">
            Valor por parcela
          </span>
          <span className="text-sm font-medium">
            {installmentsCount}x de {amountPerInstallment}
          </span>
        </div>
      )}

      {/* Categoria + Pessoa */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Categoria</Label>
          <Select
            value={form.category_id}
            onValueChange={(v) => set("category_id", v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">Nenhuma</span>
              </SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Pessoa</Label>
          <Select
            value={form.person_id}
            onValueChange={(v) => set("person_id", v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">Nenhuma</span>
              </SelectItem>
              {people.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Observações */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Observações</Label>
        <textarea
          id="notes"
          placeholder="Opcional..."
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="min-h-[72px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Ações */}
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" onClick={onSuccess} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Salvando..." : "Salvar lançamento"}
        </Button>
      </div>
    </div>
  );
}
