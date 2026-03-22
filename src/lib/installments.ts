type InstallmentInput = {
  transaction_id:  string
  number:          number
  amount:          number
  reference_month: number
  reference_year:  number
}

type MonthYear = {
  month: number
  year:  number
}

// Avança um mês, tratando a virada de ano
function nextMonth({ month, year }: MonthYear): MonthYear {
  return month === 12
    ? { month: 1, year: year + 1 }
    : { month: month + 1, year }
}

// Determina em qual mês a primeira parcela cai.
// Regra: se a compra foi feita APÓS o dia de fechamento,
// ela entra na fatura do mês seguinte.
// Ex: fechamento dia 5, compra dia 3 → fatura deste mês
//     fechamento dia 5, compra dia 5 → fatura do mês que vem
export function getFirstInstallmentMonth(
  purchaseDate: Date,
  closingDay:   number
): MonthYear {
  const day   = purchaseDate.getDate()
  const month = purchaseDate.getMonth() + 1 // JS é 0-indexed
  const year  = purchaseDate.getFullYear()

  if (day >= closingDay) {
    return month === 12
      ? { month: 1, year: year + 1 }
      : { month: month + 1, year }
  }

  return { month, year }
}

// Gera N parcelas distribuídas mês a mês a partir da data de compra.
// O valor é dividido igualmente — centavos de arredondamento
// ficam na primeira parcela para o total sempre bater.
export function generateInstallments(
  transactionId: string,
  totalAmount:   number,
  count:         number,
  purchaseDate:  Date,
  closingDay:    number
): InstallmentInput[] {
  const base      = parseFloat((totalAmount / count).toFixed(2))
  const remainder = parseFloat((totalAmount - base * count).toFixed(2))

  let current = getFirstInstallmentMonth(purchaseDate, closingDay)

  return Array.from({ length: count }, (_, i) => {
    const amount = i === 0 ? parseFloat((base + remainder).toFixed(2)) : base
    const installment = {
      transaction_id:  transactionId,
      number:          i + 1,
      amount,
      reference_month: current.month,
      reference_year:  current.year,
    }
    current = nextMonth(current)
    return installment
  })
}