import { logout } from "@/lib/actions/auth";
import { updateIncome } from "@/lib/actions/income";
import { updateName, updatePassword } from "@/lib/actions/profile";
import { updateSplitMode } from "@/lib/actions/settings";
import { getSession } from "@/lib/auth/session";
import { currentMonthKey } from "@/lib/data/balance";
import { getIncomeAt } from "@/lib/data/income";
import { getSplitModeAt } from "@/lib/data/settings";
import { getCurrentAndPartner } from "@/lib/data/users";
import { formatCents } from "@/lib/domain/money";
import { Avatar } from "@/components/Avatar";
import { LockIcon, LogOutIcon, PencilIcon } from "@/components/icons";
import { personVariant } from "@/lib/domain/variant";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ passwordError?: string; passwordUpdated?: string }>;
}) {
  const { passwordError, passwordUpdated } = await searchParams;
  const session = await getSession();
  const { currentUser, partner } = await getCurrentAndPartner(session.userId!);
  const month = currentMonthKey();
  const [myIncome, partnerIncome, splitMode] = await Promise.all([
    getIncomeAt(currentUser.id, month),
    getIncomeAt(partner.id, month),
    getSplitModeAt(month),
  ]);

  const meVariant = personVariant(currentUser.id, partner.id);
  const partnerVariant = personVariant(partner.id, currentUser.id);

  return (
    <>
      <div className="px-5 pt-5 pb-2">
        <h1 className="font-serif text-xl font-semibold text-ink">Profil</h1>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pt-2 pb-6">
        <div className="flex flex-col items-center gap-2.5 py-3">
          <Avatar name={currentUser.name} variant={meVariant} size={72} />
          <details className="group w-full">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-2">
              <div className="text-center">
                <div className="font-serif text-lg font-semibold text-ink">{currentUser.name}</div>
                <div className="mt-0.5 text-[12.5px] text-ink-faint">@{currentUser.username}</div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-soft">
                <PencilIcon className="h-3.5 w-3.5" />
              </div>
            </summary>
            <form action={updateName} className="mt-3 flex items-center gap-2 px-2">
              <input
                type="text"
                name="name"
                required
                defaultValue={currentUser.name}
                className="flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-bg"
              >
                OK
              </button>
            </form>
          </details>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-soft">
            REVENU MENSUEL NET
          </span>
          <details className="group rounded-2xl border border-border bg-surface open:pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4">
              <span className="font-serif text-[22px] font-semibold text-ink">
                {myIncome !== null ? formatCents(myIncome) : "Non renseigné"}
              </span>
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-surface-2 text-ink-soft">
                <PencilIcon className="h-4 w-4" />
              </div>
            </summary>
            <form action={updateIncome} className="flex items-center gap-2 px-4">
              <input
                type="text"
                name="amount"
                inputMode="decimal"
                required
                defaultValue={myIncome !== null ? (myIncome / 100).toFixed(2).replace(".", ",") : ""}
                placeholder="0,00"
                className="flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-bg"
              >
                OK
              </button>
            </form>
          </details>
          <p className="text-xs leading-snug text-ink-faint">
            Utilisé pour calculer votre part des dépenses communes. Un changement s&apos;applique
            dès le mois en cours (les mois passés gardent leur montant d&apos;origine).
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-soft">
            MODE DE RÉPARTITION
          </span>
          <details className="group rounded-2xl border border-border bg-surface open:pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4">
              <span className="text-sm font-semibold text-ink">
                {splitMode === "proportional_income"
                  ? "Proportionnel aux revenus"
                  : "Reste à vivre égal"}
              </span>
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-surface-2 text-ink-soft">
                <PencilIcon className="h-4 w-4" />
              </div>
            </summary>
            <form action={updateSplitMode} className="flex flex-col gap-2.5 px-4">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-bg px-3.5 py-3 text-ink-faint has-[:checked]:border-[1.5px] has-[:checked]:border-accent-b has-[:checked]:bg-accent-b-soft has-[:checked]:text-ink has-[:checked]:font-bold">
                <input
                  type="radio"
                  name="splitMode"
                  value="equal_rav"
                  defaultChecked={splitMode === "equal_rav"}
                  className="sr-only"
                />
                <span className="text-sm">Reste à vivre égal</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-bg px-3.5 py-3 text-ink-faint has-[:checked]:border-[1.5px] has-[:checked]:border-accent-b has-[:checked]:bg-accent-b-soft has-[:checked]:text-ink has-[:checked]:font-bold">
                <input
                  type="radio"
                  name="splitMode"
                  value="proportional_income"
                  defaultChecked={splitMode === "proportional_income"}
                  className="sr-only"
                />
                <span className="text-sm">Proportionnel aux revenus</span>
              </label>
              <button
                type="submit"
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-bg"
              >
                OK
              </button>
            </form>
          </details>
          <p className="text-xs leading-snug text-ink-faint">
            « Reste à vivre égal » ajuste la part de chacun pour qu&apos;il reste le même montant
            net après les dépenses communes. « Proportionnel aux revenus » répartit les dépenses
            au prorata de chaque revenu, sans viser un reste-à-vivre identique. Réglage commun aux
            deux comptes.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-soft">
            MOT DE PASSE
          </span>
          <details className="group rounded-2xl border border-border bg-surface open:pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4">
              <span className="text-sm font-semibold text-ink">••••••••</span>
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-surface-2 text-ink-soft">
                <LockIcon className="h-4 w-4" />
              </div>
            </summary>
            <form action={updatePassword} className="flex flex-col gap-2 px-4">
              <input
                type="password"
                name="currentPassword"
                required
                autoComplete="current-password"
                placeholder="Mot de passe actuel"
                className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none"
              />
              <input
                type="password"
                name="newPassword"
                required
                autoComplete="new-password"
                placeholder="Nouveau mot de passe"
                className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none"
              />
              <input
                type="password"
                name="confirmPassword"
                required
                autoComplete="new-password"
                placeholder="Confirmer le nouveau mot de passe"
                className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-bg"
              >
                Changer le mot de passe
              </button>
            </form>
          </details>
          {passwordError && (
            <p className="text-xs font-medium text-accent-a">
              Mot de passe actuel incorrect, ou la confirmation ne correspond pas.
            </p>
          )}
          {passwordUpdated && (
            <p className="text-xs font-medium text-sage-ok-ink">Mot de passe mis à jour.</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-soft">FOYER</span>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5">
            <Avatar name={partner.name} variant={partnerVariant} size={34} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink">{partner.name}</div>
              <div className="text-xs text-ink-faint">
                Revenu déclaré :{" "}
                {partnerIncome !== null ? `${formatCents(partnerIncome)} / mois` : "non renseigné"}
              </div>
            </div>
          </div>
        </div>

        <form action={logout} className="mt-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3.5 text-sm font-bold text-ink"
          >
            <LogOutIcon className="h-[18px] w-[18px]" />
            Se déconnecter
          </button>
        </form>
      </div>
    </>
  );
}
