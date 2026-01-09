import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Plus, Plane, Ship, Bell, TrendingDown } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: rules, isLoading } = trpc.rules.list.useQuery();
  const { data: deals } = trpc.deals.list.useQuery({ limit: 5 });
  const { data: alerts } = trpc.alerts.list.useQuery();

  const activeRules = rules?.filter(r => r.isActive).length || 0;
  const totalDeals = deals?.length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo, {user?.name || "Usuário"}
            </p>
          </div>
          <Link href="/rules/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regras Ativas</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRules}</div>
              <p className="text-xs text-muted-foreground">
                {rules?.length || 0} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ofertas Encontradas</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeals}</div>
              <p className="text-xs text-muted-foreground">
                Últimas 24 horas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voos</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rules?.filter(r => r.type === "flight").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Regras de voos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Push</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {alerts?.filter(a => a.isActive).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {alerts?.length || 0} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cruzeiros</CardTitle>
              <Ship className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rules?.filter(r => r.type === "cruise").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Regras de cruzeiros
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Regras Recentes</CardTitle>
            <CardDescription>
              Suas regras de monitoramento mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : rules && rules.length > 0 ? (
              <div className="space-y-4">
                {rules.slice(0, 5).map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {rule.type === "flight" ? (
                        <Plane className="h-5 w-5 text-primary" />
                      ) : (
                        <Ship className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {rule.origin && rule.destination
                            ? `${rule.origin} → ${rule.destination}`
                            : "Qualquer destino"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          rule.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {rule.isActive ? "Ativa" : "Inativa"}
                      </span>
                      <Link href={`/rules/${rule.id}`}>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Você ainda não tem regras de monitoramento
                </p>
                <Link href="/rules/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Regra
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deals */}
        {deals && deals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ofertas Recentes</CardTitle>
              <CardDescription>
                Últimas ofertas encontradas pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {deal.origin} → {deal.destination}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {deal.discountPercentage}% OFF
                      </p>
                      <p className="text-sm text-muted-foreground line-through">
                        {deal.currency} {Number(deal.originalPrice).toFixed(2)}
                      </p>
                      <p className="text-sm font-medium">
                        {deal.currency} {Number(deal.currentPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
