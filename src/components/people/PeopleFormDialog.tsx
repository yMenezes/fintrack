"use client";

import { useState, useEffect } from "react";
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

const RELATIONSHIPS = [
  "Cônjuge",
  "Filho(a)",
  "Pai",
  "Mãe",
  "Irmão/Irmã",
  "Amigo(a)",
  "Outro",
];

type Person = {
  id: string;
  name: string;
  relationship: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  person?: Person;
};

export function PeopleFormDialog({ open, onClose, person }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: person?.name ?? "",
    relationship: person?.relationship ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: person?.name ?? "",
        relationship: person?.relationship ?? "",
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

    if (!form.name.trim()) {
      setError("Nome é obrigatório");
      setLoading(false);
      return;
    }

    try {
      const url = person ? `/api/people/${person.id}` : "/api/people";
      const method = person ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          relationship: form.relationship || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar pessoa");
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{person ? "Editar pessoa" : "Nova pessoa"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Maria, João..."
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* Parentesco — botões de seleção rápida */}
          <div className="flex flex-col gap-1.5">
            <Label>Parentesco (opcional)</Label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    set("relationship", form.relationship === r ? "" : r)
                  }
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    form.relationship === r
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {/* Input livre caso nenhuma opção sirva */}
            <Input
              placeholder="Ou digite um parentesco..."
              value={form.relationship}
              onChange={(e) => set("relationship", e.target.value)}
              className="mt-1"
            />
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
