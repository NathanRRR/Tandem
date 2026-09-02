import { login } from "@/lib/actions/auth";
import { LockIcon, UserIcon } from "@/components/icons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-bg px-8 py-10">
      <div className="mb-11 flex flex-col items-center gap-2.5">
        <svg width="52" height="36" viewBox="0 0 512 512" className="mb-1.5">
          <path d="M120 180 C220 180 220 332 320 332 C380 332 392 300 392 280" fill="none" stroke="var(--accent-a)" strokeWidth="34" strokeLinecap="round" />
          <path d="M120 332 C180 332 200 300 200 280 C200 200 292 180 392 180" fill="none" stroke="var(--accent-b)" strokeWidth="34" strokeLinecap="round" />
        </svg>
        <h1 className="font-serif text-[28px] font-semibold text-ink">Tandem</h1>
        <p className="max-w-[260px] text-center text-sm leading-snug text-ink-soft">
          Le budget à deux, sans calculs qui grincent.
        </p>
      </div>

      <form action={login} className="flex w-full flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-soft">Identifiant</span>
          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3.5">
            <UserIcon className="h-[18px] w-[18px] text-ink-faint" />
            <input
              type="text"
              name="username"
              required
              autoComplete="username"
              placeholder="alice"
              className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-soft">Mot de passe</span>
          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3.5">
            <LockIcon className="h-[18px] w-[18px] text-ink-faint" />
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full bg-transparent text-[15px] text-ink outline-none"
            />
          </div>
        </label>

        {error && (
          <p className="text-sm font-medium text-accent-a">Identifiant ou mot de passe incorrect.</p>
        )}

        <button
          type="submit"
          className="mt-2 rounded-2xl bg-ink py-4 text-[15px] font-bold text-bg"
        >
          Se connecter
        </button>
      </form>

      <p className="mt-9 max-w-[280px] text-center text-xs leading-relaxed text-ink-faint">
        Compte réservé à vous deux — pas d&apos;inscription publique.
      </p>
    </div>
  );
}
