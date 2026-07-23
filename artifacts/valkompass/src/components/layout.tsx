import { Link } from 'wouter';
import { CheckCircle2, ChevronRight, X, Minus, ChevronLeft, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
          <Flag className="w-5 h-5" />
          Valkompass
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/sa-fungerar-det" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Så fungerar det
          </Link>
          <Link href="/metod" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Metod & Källor
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t py-12 bg-muted/30">
      <div className="container flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-sm text-muted-foreground">
        <div className="max-w-xs">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary mb-4 text-base">
            <Flag className="w-4 h-4" />
            Valkompass
          </Link>
          <p className="mb-4">
            Valkompass är en oberoende tjänst och är inte en del av Valmyndigheten eller någon mediekoncern.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-foreground mb-1">Information</h4>
            <Link href="/sa-fungerar-det" className="hover:text-foreground transition-colors">Så fungerar det</Link>
            <Link href="/metod" className="hover:text-foreground transition-colors">Vår metod</Link>
            <Link href="/kallor" className="hover:text-foreground transition-colors">Källförteckning</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-foreground mb-1">Juridiskt</h4>
            <Link href="/integritet" className="hover:text-foreground transition-colors">Integritetspolicy</Link>
            <Link href="/villkor" className="hover:text-foreground transition-colors">Användarvillkor</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
