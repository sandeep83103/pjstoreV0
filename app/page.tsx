export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[var(--color-surface-ivory)]">
      <div className="max-w-2xl text-center space-y-4">
        <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] text-sm font-medium tracking-wide">
          Parnika Jewellers • Foundation Initialized
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary-dark)] sm:text-5xl font-display">
          Exquisite Fashion &amp; One Gram Gold Jewellery
        </h1>
        <p className="text-lg text-[var(--color-text-muted)]">
          Welcome to the official online destination of Parnika Jewellers. System foundation (Phase 0) is ready.
        </p>
      </div>
    </main>
  );
}
