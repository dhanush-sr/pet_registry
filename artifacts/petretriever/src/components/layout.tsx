import { Link, useLocation } from "wouter";
import { PawPrint, Menu, X, ShieldCheck, Stethoscope, ChartBar, Heart, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useVetAuth } from "@/hooks/use-vet-auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, vet, logout } = useVetAuth();

  const navLinks = [
    { href: "/verify", label: "Verify Pet", icon: ShieldCheck },
    { href: "/my-pets", label: "My Pets", icon: Heart },
    { href: "/vet", label: "Vet Dashboard", icon: Stethoscope },
    { href: "/admin", label: "Admin", icon: ChartBar },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />

      <header className="sticky top-0 z-50 w-full glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <PawPrint className="w-6 h-6 text-primary" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                PetRegistry
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.href || location.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 text-sm font-semibold transition-colors duration-200",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="h-6 w-px bg-border mx-2" />
              {isAuthenticated && vet ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{vet.name}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2"
                    onClick={logout}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/register">
                  <Button className="rounded-full px-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                    Register Pet
                  </Button>
                </Link>
              )}
            </nav>

            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-border shadow-xl py-4 px-4 flex flex-col gap-4 z-50">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-foreground font-medium"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  {link.label}
                </Link>
              );
            })}
            {isAuthenticated && vet ? (
              <button
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-foreground font-medium"
              >
                <LogOut className="w-5 h-5 text-destructive" />
                Sign Out ({vet.name})
              </button>
            ) : (
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full mt-2">Register a Pet</Button>
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 w-full relative z-10">
        {children}
      </main>

      <footer className="border-t border-border bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <PawPrint className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-lg">PetRegistry</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} PetRegistry Identity Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
