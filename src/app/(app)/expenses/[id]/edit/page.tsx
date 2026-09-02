import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteExpense, updateExpense } from "@/lib/actions/expenses";
import { getCategories } from "@/lib/data/categories";
import { currentMonthKey } from "@/lib/data/balance";
import { getExpenseById } from "@/lib/data/expenses";
import { getCurrentAndPartner } from "@/lib/data/users";
import { monthKeyOf } from "@/lib/domain/month";
import { personVariant } from "@/lib/domain/variant";
import { Avatar } from "@/components/Avatar";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";
import { CalendarIcon, ChevronLeftIcon, RepeatIcon, categoryIcon } from "@/components/icons";
import { getSession } from "@/lib/auth/session";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const [expense, { currentUser, partner }, categories] = await Promise.all([
    getExpenseById(id),
    getCurrentAndPartner(session.userId!),
    getCategories(),
  ]);

  if (!expense) notFound();

  const month = monthKeyOf(expense.date);
  const backHref = month === currentMonthKey() ? "/" : `/history/${month}`;

  const meVariant = personVariant(currentUser.id, partner.id);
  const partnerVariant = personVariant(partner.id, currentUser.id);
  const dateValue = expense.date.toISOString().slice(0, 10);
  const amountValue = (expense.amountCents / 100).toFixed(2).replace(".", ",");

  const boundUpdate = updateExpense.bind(null, expense.id);
  const boundDelete = deleteExpense.bind(null, expense.id, month);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4 py-4.5">
        <Link href={backHref} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-serif text-[17px] font-semibold text-ink">Modifier la dépense</h1>
      </div>

      <form action={boundUpdate} className="flex flex-1 flex-col gap-6.5 overflow-y-auto px-5 py-6">
        {expense.templateId && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-surface-2 p-3.5 text-ink-soft">
            <RepeatIcon className="h-4 w-4 shrink-0" />
            <p className="text-xs leading-snug">
              Dépense récurrente — cette modification ne s&apos;applique qu&apos;à ce mois-ci.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 py-2.5">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-faint">MONTANT</span>
          <input
            type="text"
            name="amount"
            inputMode="decimal"
            required
            defaultValue={amountValue}
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
            defaultValue={expense.label}
            placeholder="Ex: Courses Carrefour"
            className="rounded-2xl border border-border bg-surface px-4 py-3.5 text-[14.5px] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-bold tracking-wide text-ink-soft">CATÉGORIE</span>
          <div className="grid grid-cols-3 gap-2.5">
            {categories.map((category) => {
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
                    defaultChecked={category.id === expense.categoryId}
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
              { user: currentUser, variant: meVariant },
              { user: partner, variant: partnerVariant },
            ].map(({ user, variant }) => (
              <label
                key={user.id}
                className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3.5 py-3.5 text-ink-faint has-[:checked]:border-[1.5px] has-[:checked]:border-accent-b has-[:checked]:bg-accent-b-soft has-[:checked]:text-ink has-[:checked]:font-bold"
              >
                <input
                  type="radio"
                  name="payerId"
                  value={user.id}
                  defaultChecked={user.id === expense.payerId}
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
              defaultValue={dateValue}
              required
              className="w-full bg-transparent text-[14.5px] text-ink outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-2xl bg-ink py-4 text-[15px] font-bold text-bg"
        >
          Enregistrer les modifications
        </button>
      </form>

      <form action={boundDelete} className="px-5 pb-6">
        <DeleteExpenseButton />
      </form>
    </>
  );
}
