import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
        {/* Hero Image */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/hero-performance.jpg"
            alt="Lionel Yu performing at grand piano with dramatic LED lighting"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>

        <div className="relative z-10">
          <header className="mb-12">
            <h1 className="font-serif text-sm tracking-[0.4em] text-primary md:text-base">
              LIONEL YU
            </h1>
          </header>

          <div className="max-w-3xl">
            <h2 className="mb-6 font-serif text-3xl leading-tight text-foreground md:text-5xl lg:text-6xl">
              <span className="text-balance">The Ultimate Pianist Masterclass is coming.</span>
            </h2>

            <p className="mb-6 font-sans text-lg leading-relaxed text-muted-foreground md:text-xl">
              Learn to play my most popular arrangements — broken down into Easy, Medium, and Full versions — taught by me, the person who wrote them.
            </p>

            <p className="mx-auto max-w-2xl font-sans text-base leading-relaxed text-muted-foreground md:text-lg">
              {"For years, thousands of you have bought my sheet music but never learned it because it's too hard. I'm fixing that. The masterclass opens next week."}
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 z-10 animate-bounce">
          <svg
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* VIP Offer Section */}
      <section className="flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-2xl text-center">
          <h3 className="mb-12 font-serif text-2xl text-foreground md:text-3xl lg:text-4xl">
            Join the VIP Waitlist for $1
          </h3>

          <ul className="mb-12 space-y-6 text-left">
            <li className="flex items-start gap-4">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <p className="font-sans text-base leading-relaxed text-muted-foreground md:text-lg">
                <span className="font-medium text-foreground">DOUBLE</span> your keyboard credits — spend $197 on the masterclass, get $394 toward a DreamPlay keyboard
              </p>
            </li>
            <li className="flex items-start gap-4">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <p className="font-sans text-base leading-relaxed text-muted-foreground md:text-lg">
                <span className="font-medium text-foreground">24-hour early access</span> before the public launch
              </p>
            </li>
            <li className="flex items-start gap-4">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <p className="font-sans text-base leading-relaxed text-muted-foreground md:text-lg">
                <span className="font-medium text-foreground">Instant download:</span> simplified Easy arrangement of Moonlight Sonata Nightmare
              </p>
            </li>
          </ul>

          <Link
            href="#"
            className="inline-block border-2 border-primary bg-transparent px-10 py-4 font-sans text-sm font-medium uppercase tracking-[0.2em] text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
          >
            Join the VIP Waitlist — $1
          </Link>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="border-t border-border px-6 py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-8 text-center md:flex-row md:gap-16">
          <div>
            <p className="font-serif text-2xl text-primary md:text-3xl">10,000+</p>
            <p className="mt-1 font-sans text-sm uppercase tracking-wider text-muted-foreground">
              Sheet music sold
            </p>
          </div>
          <div className="hidden h-8 w-px bg-border md:block" />
          <div>
            <p className="font-serif text-2xl text-primary md:text-3xl">1M+</p>
            <p className="mt-1 font-sans text-sm uppercase tracking-wider text-muted-foreground">
              YouTube subscribers
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16 text-center">
        <p className="font-serif text-lg italic text-muted-foreground">
          More soon. — Lionel
        </p>
      </footer>
    </main>
  )
}
