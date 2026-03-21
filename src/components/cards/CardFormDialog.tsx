"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const BRANDS = [
  "Visa",
  "Mastercard",
  "Elo",
  "American Express",
  "Hipercard",
  "Outro",
];
const COLORS = [
  { label: "Roxo", value: "#820ad1" },
  { label: "Azul", value: "#003d82" },
  { label: "Verde", value: "#0f6e56" },
  { label: "Cinza", value: "#444441" },
  { label: "Rosa", value: "#993556" },
  { label: "Coral", value: "#993c1d" },
];

type Card = {
  id: string;
  name: string;
  brand: string | null;
  closing_day: number;
  due_day: number;
  limit_amount: number | null;
  color: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  card?: Card; // se vier preenchido, é edição
};

export function CardFormDialog({ open, onClose, card }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: card?.name ?? "",
    brand: card?.brand ?? "",
    closing_day: card?.closing_day ?? "",
    due_day: card?.due_day ?? "",
    limit_amount: card?.limit_amount ?? "",
    color: card?.color ?? "#820ad1",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: card?.name ?? "",
        brand: card?.brand ?? "",
        closing_day: card?.closing_day ?? "",
        due_day: card?.due_day ?? "",
        limit_amount: card?.limit_amount ?? "",
        color: card?.color ?? "#820ad1",
      });
      setError(null);
    }
  }, [open]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    // Validações
    if (!form.name.trim()) {
      setError("Nome é obrigatório");
      setLoading(false);
      return;
    }

    if (!form.closing_day) {
      setError("Dia de fechamento é obrigatório");
      setLoading(false);
      return;
    }

    if (!form.due_day) {
      setError("Dia de vencimento é obrigatório");
      setLoading(false);
      return;
    }

    if (form.limit_amount && Number(form.limit_amount) <= 0) {
      setError("Limite deve ser maior que zero");
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name,
      brand: form.brand || undefined,
      closing_day: Number(form.closing_day),
      due_day: Number(form.due_day),
      limit_amount: form.limit_amount ? Number(form.limit_amount) : null,
      color: form.color,
    };

    try {
      const url = card ? `/api/cards/${card.id}` : "/api/cards";
      const method = card ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar cartão");
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{card ? "Editar cartão" : "Novo cartão"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Nubank, Itaú Visa..."
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* Bandeira */}
          <div className="flex flex-col gap-1.5">
            <Label>Bandeira</Label>
            <Select value={form.brand} onValueChange={(v) => set("brand", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a bandeira" />
              </SelectTrigger>
              <SelectContent>
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
              <Select
                value={String(form.closing_day)}
                onValueChange={(v) => set("closing_day", v)}
              >
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
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Dia de vencimento</Label>
              <Select
                value={String(form.due_day)}
                onValueChange={(v) => set("due_day", v)}
              >
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
            </div>
          </div>

          {/* Limite */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="limit">Limite (opcional)</Label>
            <Input
              id="limit"
              type="number"
              min="0.01"
              placeholder="Ex: 5000"
              value={form.limit_amount}
              onChange={(e) => set("limit_amount", e.target.value)}
            />
          </div>

          {/* Cor */}
          <div className="flex flex-col gap-1.5">
            <Label>Cor do cartão</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => set("color", c.value)}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c.value,
                    outline:
                      form.color === c.value ? `2px solid ${c.value}` : "none",
                    outlineOffset: "2px",
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
