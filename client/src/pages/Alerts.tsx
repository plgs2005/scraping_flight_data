import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Bell, Plus, Trash2, Edit, BellRing } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Alerts() {
  const utils = trpc.useUtils();
  const { data: alerts, isLoading } = trpc.alerts.list.useQuery();
  const createAlert = trpc.alerts.create.useMutation({
    onSuccess: () => {
      utils.alerts.list.invalidate();
      toast.success("Alerta criado com sucesso!");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar alerta: ${error.message}`);
    },
  });

  const updateAlert = trpc.alerts.update.useMutation({
    onSuccess: () => {
      utils.alerts.list.invalidate();
      toast.success("Alerta atualizado com sucesso!");
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar alerta: ${error.message}`);
    },
  });

  const deleteAlert = trpc.alerts.delete.useMutation({
    onSuccess: () => {
      utils.alerts.list.invalidate();
      toast.success("Alerta excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao excluir alerta: ${error.message}`);
    },
  });

  const toggleAlert = trpc.alerts.toggle.useMutation({
    onSuccess: () => {
      utils.alerts.list.invalidate();
      toast.success("Status do alerta atualizado!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"flight" | "cruise" | "both">("both");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [minDiscount, setMinDiscount] = useState("50");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast.success("Permissão de notificações concedida!");
        // Show test notification
        new Notification("Flight Deals Tracker", {
          body: "Você receberá notificações sobre novas ofertas!",
          icon: "/favicon.ico",
        });
      } else {
        toast.error("Permissão de notificações negada");
      }
    }
  };

  const resetForm = () => {
    setName("");
    setType("both");
    setOrigin("");
    setDestination("");
    setMinDiscount("50");
    setMaxPrice("");
    setEditingAlert(null);
  };

  const handleCreate = () => {
    createAlert.mutate({
      name,
      type,
      origin: origin || undefined,
      destination: destination || undefined,
      minDiscount: Number(minDiscount),
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      isActive: true,
    });
  };

  const handleEdit = (alert: any) => {
    setEditingAlert(alert);
    setName(alert.name);
    setType(alert.type);
    setOrigin(alert.origin || "");
    setDestination(alert.destination || "");
    setMinDiscount(alert.minDiscount.toString());
    setMaxPrice(alert.maxPrice ? alert.maxPrice.toString() : "");
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingAlert) return;
    updateAlert.mutate({
      id: editingAlert.id,
      name,
      type,
      origin: origin || undefined,
      destination: destination || undefined,
      minDiscount: Number(minDiscount),
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este alerta?")) {
      deleteAlert.mutate({ id });
    }
  };

  const handleToggle = (id: number, isActive: boolean) => {
    toggleAlert.mutate({ id, isActive });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Alertas Push</h1>
            <p className="text-muted-foreground mt-1">
              Receba notificações instantâneas sobre ofertas personalizadas
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Alerta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Alerta</DialogTitle>
                <DialogDescription>
                  Configure os critérios para receber notificações sobre ofertas
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Alerta</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Voos para Europa com 60% desconto"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={type} onValueChange={(value: any) => setType(value)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Voos e Cruzeiros</SelectItem>
                      <SelectItem value="flight">Apenas Voos</SelectItem>
                      <SelectItem value="cruise">Apenas Cruzeiros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="origin">Origem (opcional)</Label>
                    <Input
                      id="origin"
                      placeholder="Ex: GRU"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destino (opcional)</Label>
                    <Input
                      id="destination"
                      placeholder="Ex: CDG"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minDiscount">Desconto Mínimo (%)</Label>
                    <Input
                      id="minDiscount"
                      type="number"
                      min="0"
                      max="100"
                      value={minDiscount}
                      onChange={(e) => setMinDiscount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice">Preço Máximo (opcional)</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      placeholder="Ex: 3000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={!name || createAlert.isPending}>
                  {createAlert.isPending ? "Criando..." : "Criar Alerta"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Notification Permission Card */}
        {notificationPermission !== "granted" && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-800">Permissão de Notificações</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-700 mb-4">
                Para receber alertas push, você precisa permitir notificações no navegador.
              </p>
              <Button onClick={requestNotificationPermission} variant="outline">
                <Bell className="mr-2 h-4 w-4" />
                Permitir Notificações
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Alertas</CardTitle>
            <CardDescription>
              {alerts?.length || 0} alerta(s) configurado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Card key={alert.id} className={!alert.isActive ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Bell className={`h-4 w-4 ${alert.isActive ? "text-primary" : "text-muted-foreground"}`} />
                            <CardTitle className="text-base">{alert.name}</CardTitle>
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <p>
                              <strong>Tipo:</strong>{" "}
                              {alert.type === "both" ? "Voos e Cruzeiros" : alert.type === "flight" ? "Voos" : "Cruzeiros"}
                            </p>
                            {(alert.origin || alert.destination) && (
                              <p>
                                <strong>Rota:</strong> {alert.origin || "Qualquer"} → {alert.destination || "Qualquer"}
                              </p>
                            )}
                            <p>
                              <strong>Desconto mínimo:</strong> {alert.minDiscount}%
                            </p>
                            {alert.maxPrice && (
                              <p>
                                <strong>Preço máximo:</strong> USD {Number(alert.maxPrice).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={alert.isActive}
                            onCheckedChange={(checked) => handleToggle(alert.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(alert)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(alert.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Você ainda não tem alertas configurados.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Alerta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Alerta</DialogTitle>
              <DialogDescription>
                Atualize os critérios do seu alerta
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Alerta</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo</Label>
                <Select value={type} onValueChange={(value: any) => setType(value)}>
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Voos e Cruzeiros</SelectItem>
                    <SelectItem value="flight">Apenas Voos</SelectItem>
                    <SelectItem value="cruise">Apenas Cruzeiros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-origin">Origem (opcional)</Label>
                  <Input
                    id="edit-origin"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-destination">Destino (opcional)</Label>
                  <Input
                    id="edit-destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-minDiscount">Desconto Mínimo (%)</Label>
                  <Input
                    id="edit-minDiscount"
                    type="number"
                    min="0"
                    max="100"
                    value={minDiscount}
                    onChange={(e) => setMinDiscount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxPrice">Preço Máximo (opcional)</Label>
                  <Input
                    id="edit-maxPrice"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={!name || updateAlert.isPending}>
                {updateAlert.isPending ? "Atualizando..." : "Atualizar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
