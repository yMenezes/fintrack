"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionCreateSchema, type TransactionInput } from "@/lib/validations";
import { useTransactionPanel } from "@/providers/TransactionPanelProvider";
import { useTransactionData } from "@/providers/TransactionDataProvider";
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
import { TransactionFormSkeleton } from "./TransactionFormSkeleton";

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
  const { transaction, mode, close } = useTransactionPanel();
  const contextData = useTransactionData();
  const fetchedRef = useRef(false);
  const [localData, setLocalData] = useState({
    cards: [] as Card[],
    categories: [] as Category[],
    people: [] as Person[]
  });
  const [cents, setCents] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Use context data or local data
  const cards = contextData.cards.length > 0 ? contextData.cards : localData.cards;
  const categories = contextData.categories.length > 0 ? contextData.categories : localData.categories;
  const people = contextData.people.length > 0 ? contextData.people : localData.people;

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionCreateSchema),
    defaultValues: {
      description: "",
      total_amount: 0,
      installments_count: 1,
      purchase_date: new Date().toISOString().split("T")[0],
      type: "credit",
      card_id: null,
      category_id: null,
      person_id: null,
      notes: null,
    },
  });

  const typeValue = form.watch("type");
  const installmentsCountValue = form.watch("installments_count");
  const isCredit = typeValue === "credit";

  // Load data from context or fetch locally (only once)
  useEffect(() => {
    if (contextData.cards.length > 0) {
      setIsLoadingData(false);
      return;
    }

    if (fetchedRef.current) {
      return;
    }

    fetchedRef.current = true;

    async function loadData() {
      try {
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
        setLocalData({
          cards: cardsData,
          categories: catsData,
          people: peopleData
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        fetchedRef.current = false;
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, [contextData.cards.length]);

  // Only reset form to defaults, no pre-fill
  useEffect(() => {
    form.reset({
      description: "",
      total_amount: 0,
      installments_count: 1,
      purchase_date: new Date().toISOString().split("T")[0],
      type: "credit",
      card_id: null,
      category_id: null,
      person_id: null,
      notes: null,
    });
    setCents(0);
  }, [mode]);

  const totalAmount = cents / 100;
  const installmentsCount = installmentsCountValue || 1;
  const amountPerInstallment =
    totalAmount > 0
      ? (totalAmount / installmentsCount).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : null;

  if (isLoadingData) {
    return <TransactionFormSkeleton />;
  }

  async function handleSubmit(data: TransactionInput) {
    try {
      const url = mode === "edit" 
        ? `/api/transactions/${transaction?.id}`
        : "/api/transactions";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          total_amount: totalAmount,
          installments_count: isCredit ? installmentsCount : 1,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();

        if (errorData.error?.fieldErrors) {
          Object.entries(errorData.error.fieldErrors).forEach(([key, msgs]: [string, any]) => {
            form.setError(key as any, { message: msgs[0] });
          });
          return;
        }

        form.setError("root", { message: errorData.error ?? "Erro ao salvar lançamento" });
        return;
      }

      router.refresh();
      onSuccess();
    } catch {
      form.setError("root", { message: "Erro de conexão" });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5 p-5">
      {/* Root error */}
      {form.formState.errors.root && (
        <div className="text-sm text-red-500">
          {form.formState.errors.root.message}
        </div>
      )}

      {/* Type */}
      <div className="flex flex-col gap-1.5">
        <Label>Tipo</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                form.setValue("type", t.value as any);
                if (t.value !== "credit") {
                  form.setValue("installments_count", 1);
                }
              }}
              className={`rounded-lg border py-2 text-xs transition-colors ${
                typeValue === t.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          placeholder="Ex: Mercado, Netflix..."
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <span className="text-sm text-red-500">
            {form.formState.errors.description.message}
          </span>
        )}
      </div>

      {/* Amount + Date */}
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
                form.setValue("total_amount", value / 100);
              }}
            />
          </div>
          {form.formState.errors.total_amount && (
            <span className="text-sm text-red-500">
              {form.formState.errors.total_amount.message}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Data da compra</Label>
          <Input
            id="date"
            type="date"
            {...form.register("purchase_date")}
          />
          {form.formState.errors.purchase_date && (
            <span className="text-sm text-red-500">
              {form.formState.errors.purchase_date.message}
            </span>
          )}
        </div>
      </div>

      {/* Installments + Card */}
      {(isCredit || typeValue === "debit") && (
        <div className="grid grid-cols-2 gap-3">
          {isCredit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="installments">Parcelas</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                max="24"
                {...form.register("installments_count", {
                  valueAsNumber: true,
                })}
              />
              {form.formState.errors.installments_count && (
                <span className="text-sm text-red-500">
                  {form.formState.errors.installments_count.message}
                </span>
              )}
            </div>
          )}
          <div
            className={`flex flex-col gap-1.5 ${!isCredit ? "col-span-2" : ""}`}
          >
            <Label>Cartão</Label>
            <Select
              value={form.watch("card_id") ?? ""}
              onValueChange={(value) => {
                form.setValue("card_id", value === "" ? null : value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.card_id && (
              <span className="text-sm text-red-500">
                {form.formState.errors.card_id.message}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
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

      {/* Category + Person */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Categoria</Label>
          <Select
            value={form.watch("category_id") ?? ""}
            onValueChange={(value) => {
              form.setValue("category_id", value === "" ? null : value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.category_id && (
            <span className="text-sm text-red-500">
              {form.formState.errors.category_id.message}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Pessoa</Label>
          <Select
            value={form.watch("person_id") ?? ""}
            onValueChange={(value) => {
              form.setValue("person_id", value === "" ? null : value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              {people.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.person_id && (
            <span className="text-sm text-red-500">
              {form.formState.errors.person_id.message}
            </span>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Observações</Label>
        <textarea
          id="notes"
          placeholder="Opcional..."
          {...form.register("notes")}
          className="min-h-[72px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {form.formState.errors.notes && (
          <span className="text-sm text-red-500">
            {form.formState.errors.notes.message}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" onClick={close} disabled={form.formState.isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Salvando..."
            : mode === "edit"
            ? "Atualizar"
            : "Salvar lançamento"}
        </Button>
      </div>
    </form>
  );
}
