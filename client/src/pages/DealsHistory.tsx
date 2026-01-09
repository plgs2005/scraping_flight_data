import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ExternalLink, Plane, Ship, TrendingDown, Filter, X, Calendar, Percent, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

type SortOption = "discount-desc" | "price-asc" | "date-asc" | "created-desc";

export default function DealsHistory() {
  const { data: deals, isLoading } = trpc.deals.list.useQuery({ limit: 100 });
  
  // Filter states
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedOrigin, setSelectedOrigin] = useState<string>("all");
  const [selectedDestination, setSelectedDestination] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [departureFrom, setDepartureFrom] = useState<string>("");
  const [departureTo, setDepartureTo] = useState<string>("");
  const [minDiscount, setMinDiscount] = useState<string>("");
  
  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>("discount-desc");

  // Extract unique providers from deals
  const providers = useMemo(() => {
    if (!deals) return [];
    const uniqueProviders = new Set(
      deals.map(deal => deal.provider).filter((p): p is string => Boolean(p))
    );
    return Array.from(uniqueProviders).sort();
  }, [deals]);

  // Extract unique origins from deals
  const origins = useMemo(() => {
    if (!deals) return [];
    const uniqueOrigins = new Set(
      deals.map(deal => deal.origin).filter((o): o is string => Boolean(o))
    );
    return Array.from(uniqueOrigins).sort();
  }, [deals]);

  // Extract unique destinations from deals
  const destinations = useMemo(() => {
    if (!deals) return [];
    const uniqueDestinations = new Set(
      deals.map(deal => deal.destination).filter((d): d is string => Boolean(d))
    );
    return Array.from(uniqueDestinations).sort();
  }, [deals]);

  // Filter deals based on selected criteria
  const filteredDeals = useMemo(() => {
    if (!deals) return [];

    return deals.filter(deal => {
      // Filter by provider
      if (selectedProvider !== "all" && deal.provider !== selectedProvider) {
        return false;
      }

      // Filter by origin
      if (selectedOrigin !== "all" && deal.origin !== selectedOrigin) {
        return false;
      }

      // Filter by destination
      if (selectedDestination !== "all" && deal.destination !== selectedDestination) {
        return false;
      }

      // Filter by price range
      const price = Number(deal.currentPrice);
      if (minPrice && price < Number(minPrice)) {
        return false;
      }
      if (maxPrice && price > Number(maxPrice)) {
        return false;
      }

      // Filter by departure date range
      if (deal.departureDate) {
        const departureDate = new Date(deal.departureDate);
        if (departureFrom) {
          const fromDate = new Date(departureFrom);
          if (departureDate < fromDate) {
            return false;
          }
        }
        if (departureTo) {
          const toDate = new Date(departureTo);
          if (departureDate > toDate) {
            return false;
          }
        }
      }

      // Filter by minimum discount
      if (minDiscount && deal.discountPercentage < Number(minDiscount)) {
        return false;
      }

      return true;
    });
  }, [deals, selectedProvider, selectedOrigin, selectedDestination, minPrice, maxPrice, departureFrom, departureTo, minDiscount]);

  // Sort filtered deals
  const sortedDeals = useMemo(() => {
    const dealsCopy = [...filteredDeals];

    switch (sortBy) {
      case "discount-desc":
        return dealsCopy.sort((a, b) => b.discountPercentage - a.discountPercentage);
      
      case "price-asc":
        return dealsCopy.sort((a, b) => Number(a.currentPrice) - Number(b.currentPrice));
      
      case "date-asc":
        return dealsCopy.sort((a, b) => {
          if (!a.departureDate) return 1;
          if (!b.departureDate) return -1;
          return new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
        });
      
      case "created-desc":
        return dealsCopy.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      
      default:
        return dealsCopy;
    }
  }, [filteredDeals, sortBy]);

  // Check if any filters are active
  const hasActiveFilters = 
    selectedProvider !== "all" || 
    selectedOrigin !== "all" || 
    selectedDestination !== "all" || 
    minPrice !== "" || 
    maxPrice !== "" ||
    departureFrom !== "" ||
    departureTo !== "" ||
    minDiscount !== "";

  // Clear all filters
  const clearFilters = () => {
    setSelectedProvider("all");
    setSelectedOrigin("all");
    setSelectedDestination("all");
    setMinPrice("");
    setMaxPrice("");
    setDepartureFrom("");
    setDepartureTo("");
    setMinDiscount("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Ofertas</h1>
          <p className="text-muted-foreground mt-1">
            Todas as ofertas encontradas pelo sistema
          </p>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filtros</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Row 1: Route Filters */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Origin Filter */}
              <div className="space-y-2">
                <Label htmlFor="origin">Origem</Label>
                <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
                  <SelectTrigger id="origin">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {origins.map((origin) => (
                      <SelectItem key={origin} value={origin}>
                        {origin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination Filter */}
              <div className="space-y-2">
                <Label htmlFor="destination">Destino</Label>
                <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                  <SelectTrigger id="destination">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {destinations.map((destination) => (
                      <SelectItem key={destination} value={destination}>
                        {destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Provider Filter */}
              <div className="space-y-2">
                <Label htmlFor="provider">Companhia</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Price and Discount Filters */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Min Price Filter */}
              <div className="space-y-2">
                <Label htmlFor="minPrice">Preço Mínimo</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="Ex: 1000"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                  step="100"
                />
              </div>

              {/* Max Price Filter */}
              <div className="space-y-2">
                <Label htmlFor="maxPrice">Preço Máximo</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="Ex: 5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                  step="100"
                />
              </div>

              {/* Min Discount Filter */}
              <div className="space-y-2">
                <Label htmlFor="minDiscount" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Desconto Mínimo (%)
                </Label>
                <Input
                  id="minDiscount"
                  type="number"
                  placeholder="Ex: 50"
                  value={minDiscount}
                  onChange={(e) => setMinDiscount(e.target.value)}
                  min="0"
                  max="100"
                  step="5"
                />
              </div>
            </div>

            {/* Row 3: Date Filters */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Departure From Filter */}
              <div className="space-y-2">
                <Label htmlFor="departureFrom" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Ida (De)
                </Label>
                <Input
                  id="departureFrom"
                  type="date"
                  value={departureFrom}
                  onChange={(e) => setDepartureFrom(e.target.value)}
                />
              </div>

              {/* Departure To Filter */}
              <div className="space-y-2">
                <Label htmlFor="departureTo" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Ida (Até)
                </Label>
                <Input
                  id="departureTo"
                  type="date"
                  value={departureTo}
                  onChange={(e) => setDepartureTo(e.target.value)}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
                <span className="text-muted-foreground">
                  Mostrando <strong>{filteredDeals.length}</strong> de <strong>{deals?.length || 0}</strong> ofertas
                </span>
                {selectedOrigin !== "all" && selectedDestination !== "all" && (
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                    Rota: {selectedOrigin} → {selectedDestination}
                  </span>
                )}
                {minDiscount && (
                  <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-medium flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Desconto ≥ {minDiscount}%
                  </span>
                )}
                {(departureFrom || departureTo) && (
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {departureFrom && format(new Date(departureFrom), "dd/MM/yy", { locale: ptBR })}
                    {departureFrom && departureTo && " - "}
                    {departureTo && format(new Date(departureTo), "dd/MM/yy", { locale: ptBR })}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deals Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Ofertas Encontradas</CardTitle>
                <CardDescription>
                  {sortedDeals.length} oferta(s) {hasActiveFilters ? "filtrada(s)" : "encontrada(s)"}
                </CardDescription>
              </div>
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount-desc">Maior Desconto</SelectItem>
                    <SelectItem value="price-asc">Menor Preço</SelectItem>
                    <SelectItem value="date-asc">Data Mais Próxima</SelectItem>
                    <SelectItem value="created-desc">Mais Recente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : sortedDeals.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {sortedDeals.map((deal) => (
                  <Card key={deal.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {deal.type === "flight" ? (
                            <Plane className="h-5 w-5 text-primary" />
                          ) : (
                            <Ship className="h-5 w-5 text-primary" />
                          )}
                          <CardTitle className="text-lg">{deal.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-800 text-sm font-bold">
                          <TrendingDown className="h-4 w-4" />
                          {deal.discountPercentage}%
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">
                          {deal.origin} → {deal.destination}
                        </span>
                        {deal.provider && (
                          <span className="text-xs px-2 py-1 rounded bg-secondary">
                            {deal.provider}
                          </span>
                        )}
                      </div>

                      {deal.departureDate && (
                        <div className="text-sm text-muted-foreground">
                          📅 Ida:{" "}
                          {format(new Date(deal.departureDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                          {deal.returnDate &&
                            ` • Volta: ${format(new Date(deal.returnDate), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}`}
                        </div>
                      )}

                      <div className="flex items-end justify-between pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground line-through">
                            De: {deal.currency} {Number(deal.originalPrice).toFixed(2)}
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {deal.currency} {Number(deal.currentPrice).toFixed(2)}
                          </p>
                        </div>
                        <Button size="sm" asChild>
                          <a
                            href={deal.offerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ver Oferta
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Encontrada em{" "}
                        {format(new Date(deal.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : hasActiveFilters ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhuma oferta encontrada com os filtros selecionados.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma oferta encontrada ainda. O sistema está monitorando suas regras.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
