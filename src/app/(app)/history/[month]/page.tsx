import Link from "next/link";
import { markSettled } from "@/lib/actions/settlement";
import { getSession } from "@/lib/auth/session";
import { getMonthOverview } from "@/lib/data/balance";
import { formatCents } from "@/lib/domain/money";
import { formatMonthLabel } from "@/lib/domain/month";
import { personVariant } from "@/lib/domain/variant";
import { Avatar } from "@/components/Avatar";
import { ChevronLeftIcon, RepeatIcon, categoryIcon } from "@/components/icons";

export default async function MonthDetailPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const session = await getSession();
  const overview = await getMonthOverview(session.userId!, month);
  const { currentUser, partner, balance, cumulativeDeltaCents, expenses, isSettled } = overview;

  const meVariant = personVariant(currentUser.id, partner.id);
  const partnerVariant = personVariant(partner.id, currentUser.id);
  const debtCents = Math.abs(cumulativeDeltaCents);
  const owesCurrentUser = cumulativeDeltaCents > 0;

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4 py-4.5">
        <Link href="/history" className="flex h-9 w-9 items-center justify-center rounded-lg text-ink">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-serif text-[17px] font-semibold text-ink">{formatMonthLabel(month)}</h1>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-soft">RESTE À VIVRE</span>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="font-serif text-lg font-semibold text-ink">
                {formatCents(balance.restACents)}
              </div>
              <div className="text-xs text-ink-faint">{currentUser.name}</div>
            </div>
            <div className="text-center">
              <div className="font-serif text-lg font-semibold text-ink">
                {formatCents(balance.restBCents)}
              </div>
              <div className="text-xs text-ink-faint">{partner.name}</div>
            </div>
          </div>
          <p className="text-center text-[12.5px] text-ink-faint">
            {formatCents(balance.totalExpensesCents)} de dépenses communes
          </p>
        </div>

        {debtCents > 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-gold-soft p-4">
            <p className="text-sm text-gold-ink">
              {owesCurrentUser ? partner.name : currentUser.name} doit {formatCents(debtCents)} à{" "}
              {owesCurrentUser ? currentUser.name : partner.name}.
            </p>
            {!isSettled && (
              <form action={markSettled.bind(null, month)}>
                <button
                  type="submit"
                  className="self-start rounded-xl border border-[oklch(60%_0.09_80)] px-4 py-2 text-[13px] font-bold text-gold-ink"
                >
                  Marquer comme réglé
                </button>
              </form>
            )}
          </div>
        ) : (
          <p className="rounded-2xl bg-sage-ok-soft p-4 text-center text-sm text-sage-ok-ink">
            Rien à régler pour ce mois.
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          <h2 className="text-base font-semibold text-ink">Dépenses communes</h2>
          {expenses.map((expense) => {
            const CategoryIcon = categoryIcon(expense.categoryId);
            const payerName = expense.payerId === currentUser.id ? currentUser.name : partner.name;
            const payerVariant = expense.payerId === currentUser.id ? meVariant : partnerVariant;
            return (
              <div
                key={expense.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-soft">
                  <CategoryIcon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold text-ink">{expense.label}</div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Avatar name={payerName} variant={payerVariant} size={12} />
                    <span className="text-xs text-ink-faint">{payerName}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-serif text-[15px] font-semibold text-ink">
                    {formatCents(expense.amountCents)}
                  </span>
                  {expense.templateId && (
                    <span className="flex items-center gap-1 rounded-full bg-gold-soft px-1.75 py-0.5 text-[10px] font-bold text-gold-ink">
                      <RepeatIcon className="h-2.5 w-2.5" />
                      Récurrent
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
