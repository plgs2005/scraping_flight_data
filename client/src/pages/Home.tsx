import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Plane, Ship, Bell, TrendingDown } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="container py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Flight Deals Tracker</h1>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Entrar</a>
          </Button>
        </div>
      </header>

      <main className="container py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">
              Encontre as Melhores Ofertas de Viagens
            </h2>
            <p className="text-xl text-muted-foreground">
              Monitore automaticamente voos e cruzeiros com descontos de até 90%.
              Receba notificações quando encontrarmos ofertas que atendem seus critérios.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-lg border bg-card">
              <Bell className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Alertas Personalizados</h3>
              <p className="text-sm text-muted-foreground">
                Crie regras customizadas e receba notificações por email ou webhook
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <TrendingDown className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Descontos Reais</h3>
              <p className="text-sm text-muted-foreground">
                Apenas ofertas validadas com descontos de 50% a 90%
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Ship className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Voos e Cruzeiros</h3>
              <p className="text-sm text-muted-foreground">
                Monitore passagens aéreas e cruzeiros em um só lugar
              </p>
            </div>
          </div>

          <div className="pt-8">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>
                Começar Agora
              </a>
            </Button>
          </div>
        </div>
      </main>

      <footer className="container py-8 border-t mt-20">
        <p className="text-center text-sm text-muted-foreground">
          © 2026 Flight Deals Tracker. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
