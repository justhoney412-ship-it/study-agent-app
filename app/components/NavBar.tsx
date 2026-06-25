import Link from 'next/link'

export function NavBar() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-wide text-zinc-100">
          Study Agent
        </Link>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/" className="rounded-full px-3 py-1.5 transition hover:bg-zinc-800 hover:text-zinc-100">
            Chat
          </Link>
          <Link href="/dashboard" className="rounded-full px-3 py-1.5 transition hover:bg-zinc-800 hover:text-zinc-100">
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  )
}
