"use client";

import { TrashIcon } from "@/components/icons";

export function DeleteExpenseButton() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm("Supprimer cette dépense ? Cette action est irréversible.")) {
          e.preventDefault();
        }
      }}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-accent-a py-3.5 text-[14.5px] font-bold text-accent-a"
    >
      <TrashIcon className="h-[18px] w-[18px]" />
      Supprimer la dépense
    </button>
  );
}
