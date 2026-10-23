import { COPY } from "@/lib/conference";

export default function ApplicationsClosedMessage() {
  return (
    <div className="flex min-h-[calc(100vh-108px)] items-center justify-center px-4 py-20 text-center max-sm:py-12">
      <h1 className="max-w-6xl text-balance text-4xl font-bold leading-tight text-[var(--color-accent)] sm:text-5xl lg:text-6xl">
        <span className="block">{COPY.applicationsClosed.title}</span>
        <span className="mt-4 block text-white sm:mt-6">{COPY.applicationsClosed.message}</span>
      </h1>
    </div>
  );
}
