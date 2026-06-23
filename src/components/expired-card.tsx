/**
 * Full-screen "membership expired" state, shown when the plan status has no
 * `paymentDetail`. Shared across plan types; the message is passed in so the card stays
 * i18n-namespace-agnostic.
 */
export function ExpiredCard({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <p className="text-center text-base text-muted-foreground">{message}</p>
    </main>
  );
}
