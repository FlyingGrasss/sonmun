import { CONFERENCE } from "@/lib/conference";
import { loginAction } from "@/app/admin/actions";

export const metadata = {
  title: `Admin Login | ${CONFERENCE.shortName}`,
  robots: "noindex",
};

export default async function AdminLogin({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-20">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 rounded-xl border border-white/10 bg-black/25 p-8 shadow-2xl">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)]">
            {CONFERENCE.shortName}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white">Admin Login</h1>
        </div>

        {params?.error && (
          <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            Invalid password.
          </p>
        )}

        <form action={loginAction} className="flex flex-col gap-4">
          <label className="text-sm font-medium text-white" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-[var(--color-accent)]"
          />
          <button className="rounded-lg bg-[var(--color-accent)] px-4 py-3 font-bold text-[var(--background)] transition hover:bg-white">
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
