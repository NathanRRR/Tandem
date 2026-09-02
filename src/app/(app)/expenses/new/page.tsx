import Link from "next/link";
import { addExpense } from "@/lib/actions/expenses";
import { getCategories } from "@/lib/data/categories";
import { getCurrentAndPartner } from "@/lib/data/users";
import { getSession } from "@/lib/auth/session";
import { personVariant } from "@/lib/domain/variant";
import { Avatar } from "@/components/Avatar";
import { CalendarIcon, ChevronLeftIcon, RepeatIcon, categoryIcon } from "@/components/icons";

export default async function NewExpensePage() {
  const session = await getSession();
  const [{ currentUser, partner }, categories] = await Promise.all([
    getCurrentAndPartner(session.userId!),
    getCategories(),
  ]);

  const meVariant = personVariant(currentUser.id, partner.id);
  const partnerVariant = personVariant(partner.id, currentUser.id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4 py-4.5">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg text-ink">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-serif text-[17px] font-semibold text-ink">Nouvelle dépense</h1>
      </div>

      <form action={addExpense} className="flex flex-1 flex-col gap-6.5 overflow-y-auto px-5 py-6">
        <div className="flex flex-col items-center gap-2 py-2.5">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-faint">MONTANT</span>
          <input
            type="text"
            name="amount"
            inputMode="decimal"
            required
            placeholder="0,00"
            className="w-40 bg-transparent text-center font-serif text-[40px] font-semibold text-ink outline-none placeholder:text-ink-faint"
          />
          <div className="h-[3px] w-16 rounded-full bg-accent-b" />
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-soft">
            LIBELLÉ (facultatif)
          </span>
          <input
            type="text"
            name="label"
            placeholder="Ex: Courses Carrefour"
            className="rounded-2xl border border-border bg-surface px-4 py-3.5 text-[14.5px] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-soft">CATÉGORIE</span>
          <div className="grid grid-cols-3 gap-2.5">
            {categories.map((category, index) => {
              const CategoryIcon = categoryIcon(category.id);
              return (
                <label
                  key={category.id}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-2 py-3.5 text-ink-soft has-[:checked]:border-[1.5px] has-[:checked]:border-accent-b has-[:checked]:bg-accent-b-soft has-[:checked]:text-ink"
                >
                  <input
                    type="radio"
                    name="categoryId"
                    value={category.id}
                    defaultChecked={index === 0}
                    required
                    className="sr-only"
                  />
                  <CategoryIcon className="h-5 w-5" />
                  <span className="text-xs font-semibold">{category.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-soft">PAYÉ PAR</span>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { user: currentUser, variant: meVariant, defaultChecked: true },
              { user: partner, variant: partnerVariant, defaultChecked: false },
            ].map(({ user, variant, defaultChecked }) => (
              <label
                key={user.id}
                className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3.5 py-3.5 text-ink-faint has-[:checked]:border-[1.5px] has-[:checked]:border-accent-b has-[:checked]:bg-accent-b-soft has-[:checked]:text-ink has-[:checked]:font-bold"
              >
                <input
                  type="radio"
                  name="payerId"
                  value={user.id}
                  defaultChecked={defaultChecked}
                  required
                  className="sr-only"
                />
                <Avatar name={user.name} variant={variant} size={28} />
                <span className="text-sm font-semibold">{user.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-soft">DATE</span>
          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3.5">
            <CalendarIcon className="h-[18px] w-[18px] text-ink-soft" />
            <input
              type="date"
              name="date"
              defaultValue={today}
              required
              className="w-full bg-transparent text-[14.5px] text-ink outline-none"
            />
          </div>
        </div>

        <label className="flex items-center gap-3.5 rounded-2xl bg-surface-2 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface text-ink-soft">
            <RepeatIcon className="h-[18px] w-[18px]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink">Dépense récurrente</div>
            <div className="mt-0.5 text-xs text-ink-faint">Se répète chaque mois, ex : loyer</div>
          </div>
          <span className="relative inline-flex h-[26px] w-11 shrink-0 items-center rounded-full bg-border transition-colors has-[:checked]:bg-accent-b">
            <input type="checkbox" name="isRecurring" className="peer sr-only" />
            <span className="absolute left-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-[18px]" />
          </span>
        </label>

        <button
          type="submit"
          className="mt-2 w-full rounded-2xl bg-ink py-4 text-[15px] font-bold text-bg"
        >
          Ajouter la dépense
        </button>
      </form>
    </>
  );
}
