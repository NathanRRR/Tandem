import Link from "next/link";
import { markSettled } from "@/lib/actions/settlement";
import { getMonthOverview } from "@/lib/data/balance";
import { getSession } from "@/lib/auth/session";
import { formatCents } from "@/lib/domain/money";
import { formatMonthLabel } from "@/lib/domain/month";
import { personVariant } from "@/lib/domain/variant";
import { Avatar } from "@/components/Avatar";
import { BellIcon, CheckIcon, EqualsIcon, PlusIcon, ArrowRightIcon, RepeatIcon, categoryIcon } from "@/components/icons";

export default async function DashboardPage() {
  const session = await getSession();
  const overview = await getMonthOverview(session.userId!);
  const { currentUser, partner, month, balance, cumulativeDeltaCents, expenses } = overview;

  const meVariant = personVariant(currentUser.id, partner.id);
  const partnerVariant = personVariant(partner.id, currentUser.id);

  // deltaCents positif => currentUser a trop payé => partner lui doit ce montant.
  const owesCurrentUser = cumulativeDeltaCents > 0;
  const debtCents = Math.abs(cumulativeDeltaCents);
  // "Équilibré" n'a de sens qu'en mode equal_rav ; en proportional_income les deux restes
  // ne sont égaux que par coïncidence, donc ce badge/icône ne s'affiche que si c'est vraiment le cas.
  const isRestBalanced = balance.restACents === balance.restBCents;

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-[13px] text-ink-faint">Bonjour {currentUser.name}</p>
          <h1 className="font-serif text-xl font-semibold text-ink">{formatMonthLabel(month)}</h1>
        </div>
        <Link
          href="/profile"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface"
        >
          <BellIcon className="h-[18px] w-[18px] text-ink-soft" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 pt-1 pb-[104px]">
        <div className="flex flex-col gap-4.5 rounded-[20px] border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-bold tracking-wide text-ink-soft">
              RESTE À VIVRE CE MOIS-CI
            </span>
            {isRestBalanced && (
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-sage-ok-soft px-2.5 py-1 text-[11.5px] font-bold text-sage-ok-ink">
                <CheckIcon className="h-3 w-3" />
                Équilibré
              </div>
            )}
          </div>

          <div className="flex items-end justify-center">
            <div className="flex flex-1 flex-col items-center gap-2.5">
              <Avatar name={currentUser.name} variant={meVariant} />
              <div
                className="h-24 w-16 rounded-t-2xl rounded-b-[4px]"
                style={{
                  background: `linear-gradient(180deg, var(--accent-${meVariant}), var(--accent-${meVariant}-soft))`,
                }}
              />
              <div className="text-center">
                <div className="font-serif text-[22px] font-semibold text-ink">
                  {formatCents(balance.restACents)}
                </div>
                <div className="text-xs text-ink-faint">{currentUser.name}</div>
              </div>
            </div>
            <div className="flex w-7 shrink-0 items-center justify-center pb-11 text-ink-faint">
              {isRestBalanced && <EqualsIcon className="h-[18px] w-[18px]" />}
            </div>
            <div className="flex flex-1 flex-col items-center gap-2.5">
              <Avatar name={partner.name} variant={partnerVariant} />
              <div
                className="h-24 w-16 rounded-t-2xl rounded-b-[4px]"
                style={{
                  background: `linear-gradient(180deg, var(--accent-${partnerVariant}), var(--accent-${partnerVariant}-soft))`,
                }}
              />
              <div className="text-center">
                <div className="font-serif text-[22px] font-semibold text-ink">
                  {formatCents(balance.restBCents)}
                </div>
                <div className="text-xs text-ink-faint">{partner.name}</div>
              </div>
            </div>
          </div>

          <p className="text-center text-[12.5px] text-ink-faint">
            Basé sur {formatCents(balance.totalExpensesCents)} de dépenses communes ce mois-ci
          </p>
        </div>

        {debtCents > 0 && (
          <div className="flex flex-col gap-3.5 rounded-[18px] border border-[oklch(85%_0.06_80)] bg-gold-soft p-5">
            <span className="text-[12.5px] font-bold tracking-wide text-gold-ink">
              SOLDE À RÉGLER
            </span>
            <div className="flex items-center gap-2.5">
              <Avatar
                name={owesCurrentUser ? partner.name : currentUser.name}
                variant={owesCurrentUser ? partnerVariant : meVariant}
                size={34}
              />
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-[oklch(45%_0.07_80)]" />
              <Avatar
                name={owesCurrentUser ? currentUser.name : partner.name}
                variant={owesCurrentUser ? meVariant : partnerVariant}
                size={34}
              />
              <div className="ml-auto font-serif text-lg font-semibold text-ink">
                {formatCents(debtCents)}
              </div>
            </div>
            <p className="text-xs leading-snug text-[oklch(42%_0.06_80)]">
              {owesCurrentUser ? partner.name : currentUser.name} doit {formatCents(debtCents)} à{" "}
              {owesCurrentUser ? currentUser.name : partner.name}. Reporté au mois prochain si non
              réglé.
            </p>
            <form action={markSettled.bind(null, month)}>
              <button
                type="submit"
                className="self-start rounded-xl border border-[oklch(60%_0.09_80)] px-4 py-2.5 text-[13px] font-bold text-gold-ink"
              >
                Marquer comme réglé
              </button>
            </form>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-ink">Dépenses communes</h2>
            <span className="text-[12.5px] text-ink-faint">
              {expenses.length} dépense{expenses.length > 1 ? "s" : ""}
            </span>
          </div>

          {expenses.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-ink-faint">
              Aucune dépense commune ce mois-ci pour l&apos;instant.
            </p>
          )}

          {expenses.map((expense) => {
            const CategoryIcon = categoryIcon(expense.categoryId);
            const payerName = expense.payerId === currentUser.id ? currentUser.name : partner.name;
            const payerVariant = expense.payerId === currentUser.id ? meVariant : partnerVariant;

            return (
              <Link
                key={expense.id}
                href={`/expenses/${expense.id}/edit`}
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
              </Link>
            );
          })}
        </div>
      </div>

      <Link
        href="/expenses/new"
        className="absolute right-5 bottom-24 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-bg shadow-[0_8px_20px_oklch(23%_0.02_55_/_0.28)]"
      >
        <PlusIcon className="h-6 w-6" />
      </Link>
    </>
  );
}
