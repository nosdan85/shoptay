import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-4">
          {/* Disclaimer */}
          <p className="text-center text-sm text-muted-foreground">
            This website only provides a marketplace for sellers and buyers to
            conduct transactions. We are not responsible for any disputes,
            scams, or issues that may arise from transactions made through this
            platform. Please trade responsibly and verify all transactions.
          </p>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/proofs"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Proof of Delivery
            </Link>
            <a
              href="https://discord.gg/nosmarket"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Discord
            </a>
            <Link
              href="/wallet"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Wallet
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-center text-xs text-muted-foreground">
            &copy; {currentYear} {process.env.NEXT_PUBLIC_SITE_NAME || "Nos Market"}.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
