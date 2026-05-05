"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoryCreateSchema, categoryUpdateSchema, type CategoryInput, type CategoryUpdateInput } from "@/lib/validations";
import type { Category } from "@/types/database";
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
import { ColorPicker } from "@/components/ui/color-picker";

const ICONS = [
  "📦",
  "🍔",
  "💊",
  "🚗",
  "🎮",
  "✈️",
  "🏠",
  "👗",
  "📚",
  "💡",
  "🐾",
  "🎵",
];

type Props = {
  open: boolean;
  onClose: () => void;
  category?: Category;
  onSaved?: () => void;
};

export function CategoryFormDialog({ open, onClose, category, onSaved }: Props) {
  const router = useRouter();
  const isEditing = !!category;

  const form = useForm<CategoryInput>({
    resolver: zodResolver(isEditing ? categoryUpdateSchema : categoryCreateSchema),
    defaultValues: {
      name: "",
      icon: "📦",
      color: "#6366f1",
    },
  });

  useEffect(() => {
    if (open && category) {
      form.reset({
        name: category.name,
        icon: category.icon,
        color: category.color,
      });
    } else if (open) {
      form.reset({
        name: "",
        icon: "📦",
        color: "#6366f1",
      });
    }
  }, [open, category, form]);

  async function handleSubmit(data: CategoryInput | CategoryUpdateInput) {
    try {
      const url = category
        ? `/api/categories/${category.id}`
        : "/api/categories";
      const method = category ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        
        if (errorData.error?.fieldErrors) {
          const validFields = ['name', 'icon', 'color'] as const;
          Object.entries(errorData.error.fieldErrors).forEach(([key, msgs]: [string, any]) => {
            if (validFields.includes(key as any)) {
              form.setError(key as keyof CategoryInput, { message: msgs[0] });
            }
          });
          return;
        }

        form.setError("root", { message: errorData.error ?? "Erro ao salvar categoria" });
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
          <DialogTitle>
            {category ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 py-2">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Alimentação, Saúde..."
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Ícone */}
          <div className="flex flex-col gap-1.5">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => form.setValue("icon", icon)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors ${
                    form.watch("icon") === icon
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
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
