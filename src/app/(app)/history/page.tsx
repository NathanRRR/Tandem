import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { listPastMonths } from "@/lib/data/balance";
import { formatCents } from "@/lib/domain/money";
import { formatMonthLabel } from "@/lib/domain/month";
import { CheckIcon, ChevronRightIcon, ClockIcon } from "@/components/icons";

export default async function HistoryPage() {
  const session = await getSession();
  const months = await listPastMonths(session.userId!);

  return (
    <>
      <div className="px-5 pt-5 pb-2">
        <h1 className="font-serif text-xl font-semibold text-ink">Historique</h1>
        <p className="mt-1 text-[13px] text-ink-faint">Vos mois passés, réglés ou en attente</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pt-2 pb-6">
        {months.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-ink-faint">
            Pas encore de mois passé — l&apos;historique se remplira au fil du temps.
          </p>
        )}

        {months.map((overview) => (
          <Link
            key={overview.month}
            href={`/history/${overview.month}`}
            className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-base font-semibold text-ink">
                {formatMonthLabel(overview.month)}
              </span>
              {overview.isSettled ? (
                <span className="flex items-center gap-1 rounded-full bg-sage-ok-soft px-2.5 py-1 text-[11.5px] font-bold text-sage-ok-ink">
                  <CheckIcon className="h-3 w-3" />
                  Réglé
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-[11.5px] font-bold text-gold-ink">
                  <ClockIcon className="h-3 w-3" />
                  En attente
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] text-ink-faint">
                {overview.cumulativeDeltaCents === 0
                  ? `Dépenses communes · ${formatCents(overview.balance.totalExpensesCents)}`
                  : `${overview.cumulativeDeltaCents > 0 ? overview.partner.name : overview.currentUser.name} doit ${formatCents(Math.abs(overview.cumulativeDeltaCents))} à ${overview.cumulativeDeltaCents > 0 ? overview.currentUser.name : overview.partner.name}`}
              </span>
              <div className="flex items-center gap-1 text-ink-faint">
                <span className="text-[12.5px]">
                  {overview.balance.restACents === overview.balance.restBCents
                    ? `Reste ${formatCents(overview.balance.restACents)} chacun`
                    : `Reste ${formatCents(overview.balance.restACents)} / ${formatCents(overview.balance.restBCents)}`}
                </span>
                <ChevronRightIcon className="h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
