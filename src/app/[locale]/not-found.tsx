import Link from "next/link";

// Self-contained: a not-found can render without the i18n provider (e.g. when the
// layout calls notFound() for an invalid locale), so keep the copy provider-free.
export default function NotFound() {
  return (
    <main className="container mx-auto max-w-md space-y-4 p-8 text-center">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-sm text-muted-foreground">
        页面不存在 · Page not found
      </p>
      <Link href="/" className="text-primary underline underline-offset-4">
        返回首页 · Home
      </Link>
    </main>
  );
}
