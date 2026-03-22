import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateInstallments } from "@/lib/installments";

const transactionSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  total_amount: z.number().positive("Valor deve ser positivo"),
  installments_count: z.number().int().min(1).max(24),
  purchase_date: z.string(),
  type: z.enum(["credit", "debit", "pix", "cash"]),
  card_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  person_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const parsed = transactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const {
    description,
    total_amount,
    installments_count,
    purchase_date,
    type,
    card_id,
    category_id,
    person_id,
    notes,
  } = parsed.data;

  // 1. Cria a transação
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      description,
      total_amount,
      installments_count,
      purchase_date,
      type,
      card_id: card_id ?? null,
      category_id: category_id ?? null,
      person_id: person_id ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (txError)
    return NextResponse.json({ error: txError.message }, { status: 500 });

  // 2. Busca o closing_day do cartão (necessário para calcular as parcelas)
  let closingDay = 1;
  if (card_id) {
    const { data: card } = await supabase
      .from("cards")
      .select("closing_day")
      .eq("id", card_id)
      .single();
    if (card) closingDay = card.closing_day;
  }

  // 3. Gera e insere as parcelas
  const installments = generateInstallments(
    transaction.id,
    total_amount,
    installments_count,
    new Date(purchase_date),
    closingDay,
  );

  const { error: instError } = await supabase
    .from("installments")
    .insert(installments);

  if (instError)
    return NextResponse.json({ error: instError.message }, { status: 500 });

  return NextResponse.json(transaction, { status: 201 });
}
