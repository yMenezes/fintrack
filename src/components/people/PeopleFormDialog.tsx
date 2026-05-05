"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personCreateSchema, personUpdateSchema, type PersonInput, type PersonUpdateInput } from "@/lib/validations";
import type { Person } from "@/types/database";
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

type Props = {
  open: boolean;
  onClose: () => void;
  person?: Person;
  onSaved?: () => void;
};

export function PeopleFormDialog({ open, onClose, person, onSaved }: Props) {
  const router = useRouter();
  const isEditing = !!person;

  const form = useForm<PersonInput>({
    resolver: zodResolver(isEditing ? personUpdateSchema : personCreateSchema),
    defaultValues: {
      name: "",
      relationship: "",
    },
  });

  useEffect(() => {
    if (open && person) {
      form.reset({
        name: person.name,
        relationship: person.relationship ?? "",
      });
    } else if (open) {
      form.reset({
        name: "",
        relationship: "",
      });
    }
  }, [open, person, form]);

  async function handleSubmit(data: PersonInput | PersonUpdateInput) {
    try {
      const url = person ? `/api/people/${person.id}` : "/api/people";
      const method = person ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        
        if (errorData.error?.fieldErrors) {
          const validFields = ['name', 'relationship'] as const;
          Object.entries(errorData.error.fieldErrors).forEach(([key, msgs]: [string, any]) => {
            if (validFields.includes(key as any)) {
              form.setError(key as keyof PersonInput, { message: msgs[0] });
            }
          });
          return;
        }

        form.setError("root", { message: errorData.error ?? "Erro ao salvar pessoa" });
        return;
      }

      router.refresh();
      onSaved?.();
      onClose();
      form.reset();
    } catch {
      form.setError("root", { message: "Erro de conexão" });
    }
  }

  const onSubmit = form.handleSubmit(handleSubmit);
  const isLoading = form.formState.isSubmitting;
  const rootError = form.formState.errors.root?.message;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{person ? "Editar pessoa" : "Nova pessoa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 py-2">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Maria, João..."
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Parentesco — botões de seleção rápida */}
          <div className="flex flex-col gap-1.5">
            <Label>Parentesco (opcional)</Label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => form.setValue("relationship", form.watch("relationship") === r ? "" : r)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    form.watch("relationship") === r
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
              {...form.register("relationship")}
              className="mt-1"
            />
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
