import Link from "next/link";

export default function Unauthorized() {
  return (
    <main className="min-h-screen grid place-items-center bg-surface p-6">
      <div className="card-p max-w-md text-center">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-on-surface-variant mt-2">
          You do not have permission to view this page.
        </p>
        <Link href="/login" className="btn-primary mt-6">Back to sign in</Link>
      </div>
    </main>
  );
}
