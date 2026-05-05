"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cardCreateSchema, cardUpdateSchema, type CardInput, type CardUpdateInput } from "@/lib/validations";
import type { Card } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { ColorPicker } from "@/components/ui/color-picker";
import { MoneyInput } from "@/components/ui/money-input";

const BRANDS = [
  "Visa",
  "Mastercard",
  "Elo",
  "American Express",
  "Hipercard",
  "Outro",
];

type Props = {
  open: boolean;
  onClose: () => void;
  card?: Card; // se vier preenchido, é edição
  onSaved?: () => void; // callback após salvar com sucesso
};

export function CardFormDialog({ open, onClose, card, onSaved }: Props) {
  const router = useRouter();
  const isEditing = !!card;
  
  const form = useForm<CardInput>({
    resolver: zodResolver(isEditing ? cardUpdateSchema : cardCreateSchema),
    defaultValues: {
      name: "",
      brand: "",
      closing_day: 1,
      due_day: 1,
      limit_amount: null,
      color: "#820ad1",
    },
  });

  useEffect(() => {
    if (open && card) {
      form.reset({
        name: card.name,
        brand: card.brand ?? "",
        closing_day: card.closing_day,
        due_day: card.due_day,
        limit_amount: card.limit_amount,
        color: card.color,
      });
    } else if (open) {
      form.reset({
        name: "",
        brand: "",
        closing_day: 1,
        due_day: 1,
        limit_amount: null,
        color: "#820ad1",
      });
    }
  }, [open, card, form]);

  async function handleSubmit(data: CardInput | CardUpdateInput) {
    try {
      const url = card ? `/api/cards/${card.id}` : "/api/cards";
      const method = card ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        
        // Handle Zod validation errors from server
        if (errorData.error?.fieldErrors) {
          const validFields = ['name', 'brand', 'closing_day', 'due_day', 'limit_amount', 'color'] as const;
          Object.entries(errorData.error.fieldErrors).forEach(([key, msgs]: [string, any]) => {
            if (validFields.includes(key as any)) {
              form.setError(key as keyof CardInput, { message: msgs[0] });
            }
          });
          return;
        }

        form.setError("root", { message: errorData.error ?? "Erro ao salvar cartão" });
        return;
      }

      router.refresh();
      onSaved?.();
      onClose();
      form.reset();
    } catch (err) {
      form.setError("root", { message: "Erro de conexão" });
    }
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const onSubmit = form.handleSubmit(handleSubmit);
  const isLoading = form.formState.isSubmitting;
  const rootError = form.formState.errors.root?.message;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{card ? "Editar cartão" : "Novo cartão"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 py-2">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Nubank, Itaú Visa..."
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Bandeira */}
          <div className="flex flex-col gap-1.5">
            <Label>Bandeira</Label>
            <Select value={form.watch("brand") ?? "none"} onValueChange={(v) => form.setValue("brand", v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a bandeira (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem bandeira</SelectItem>
                {BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dias — closing + due em linha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Dia de fechamento</Label>
              <Select value={String(form.watch("closing_day") ?? "")} onValueChange={(v) => form.setValue("closing_day", Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Dia {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.closing_day && (
                <p className="text-sm text-destructive">{form.formState.errors.closing_day.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Dia de vencimento</Label>
              <Select value={String(form.watch("due_day") ?? "")} onValueChange={(v) => form.setValue("due_day", Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Dia {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.due_day && (
                <p className="text-sm text-destructive">{form.formState.errors.due_day.message}</p>
              )}
            </div>
          </div>

          {/* Limite */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="limit">Limite (opcional)</Label>
            <MoneyInput control={form.control} name="limit_amount" id="limit" placeholder="5000" />
            {form.formState.errors.limit_amount && (
              <p className="text-sm text-destructive">{form.formState.errors.limit_amount.message}</p>
            )}
          </div>

          {/* Cor */}
          <div className="flex flex-col gap-1.5">
            <ColorPicker
              value={form.watch("color")}
              onChange={(color) => form.setValue("color", color)}
            />
            {form.formState.errors.color && (
              <p className="text-sm text-destructive">{form.formState.errors.color.message}</p>
            )}
          </div>

          {rootError && <p className="text-sm text-destructive">{rootError}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
