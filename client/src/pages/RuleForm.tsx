import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useEffect } from "react";

const ruleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["flight", "cruise"]),
  origin: z.string().optional(),
  destination: z.string().optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  minDiscount: z.number().min(0).max(100),
  notificationType: z.enum(["email", "webhook", "both"]),
  notificationEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  notificationWebhook: z.string().url("URL inválida").optional().or(z.literal("")),
  isActive: z.boolean(),
});

type RuleFormData = z.infer<typeof ruleSchema>;

export default function RuleForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isEditing = !!params.id;
  const ruleId = params.id ? parseInt(params.id) : undefined;

  const { data: existingRule, isLoading } = trpc.rules.getById.useQuery(
    { id: ruleId! },
    { enabled: isEditing }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "",
      type: "flight",
      minDiscount: 50,
      notificationType: "email",
      isActive: true,
    },
  });

  const notificationType = watch("notificationType");

  useEffect(() => {
    if (existingRule) {
      reset({
        name: existingRule.name,
        type: existingRule.type,
        origin: existingRule.origin || "",
        destination: existingRule.destination || "",
        departureDate: existingRule.departureDate
          ? new Date(existingRule.departureDate).toISOString().split("T")[0]
          : "",
        returnDate: existingRule.returnDate
          ? new Date(existingRule.returnDate).toISOString().split("T")[0]
          : "",
        minDiscount: existingRule.minDiscount,
        notificationType: existingRule.notificationType,
        notificationEmail: existingRule.notificationEmail || "",
        notificationWebhook: existingRule.notificationWebhook || "",
        isActive: existingRule.isActive,
      });
    }
  }, [existingRule, reset]);

  const createMutation = trpc.rules.create.useMutation({
    onSuccess: () => {
      toast.success("Regra criada com sucesso");
      navigate("/rules");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar regra");
    },
  });

  const updateMutation = trpc.rules.update.useMutation({
    onSuccess: () => {
      toast.success("Regra atualizada com sucesso");
      navigate("/rules");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar regra");
    },
  });

  const onSubmit = (data: RuleFormData) => {
    const payload = {
      ...data,
      departureDate: data.departureDate ? new Date(data.departureDate) : undefined,
      returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
      notificationEmail: data.notificationEmail || undefined,
      notificationWebhook: data.notificationWebhook || undefined,
      origin: data.origin || undefined,
      destination: data.destination || undefined,
    };

    if (isEditing && ruleId) {
      updateMutation.mutate({ id: ruleId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEditing && isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "Editar Regra" : "Nova Regra"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure os critérios de busca e notificação
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Defina o nome e tipo de monitoramento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Regra *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Voos para Europa com desconto"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(value) => setValue("type", value as "flight" | "cruise")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flight">Voo</SelectItem>
                    <SelectItem value="cruise">Cruzeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={watch("isActive")}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
                <Label htmlFor="isActive">Regra ativa</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Critérios de Busca</CardTitle>
              <CardDescription>
                Defina os parâmetros de busca (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origem</Label>
                  <Input
                    id="origin"
                    placeholder="Ex: São Paulo (GRU)"
                    {...register("origin")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destino</Label>
                  <Input
                    id="destination"
                    placeholder="Ex: Paris (CDG)"
                    {...register("destination")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureDate">Data de Ida</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    {...register("departureDate")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Data de Volta</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    {...register("returnDate")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minDiscount">Desconto Mínimo (%) *</Label>
                <Input
                  id="minDiscount"
                  type="number"
                  min="0"
                  max="100"
                  {...register("minDiscount", { valueAsNumber: true })}
                />
                {errors.minDiscount && (
                  <p className="text-sm text-destructive">{errors.minDiscount.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure como deseja receber as ofertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notificationType">Tipo de Notificação *</Label>
                <Select
                  value={notificationType}
                  onValueChange={(value) =>
                    setValue("notificationType", value as "email" | "webhook" | "both")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="both">Email + Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(notificationType === "email" || notificationType === "both") && (
                <div className="space-y-2">
                  <Label htmlFor="notificationEmail">Email para Notificação</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    placeholder="seu@email.com"
                    {...register("notificationEmail")}
                  />
                  {errors.notificationEmail && (
                    <p className="text-sm text-destructive">
                      {errors.notificationEmail.message}
                    </p>
                  )}
                </div>
              )}

              {(notificationType === "webhook" || notificationType === "both") && (
                <div className="space-y-2">
                  <Label htmlFor="notificationWebhook">URL do Webhook</Label>
                  <Input
                    id="notificationWebhook"
                    type="url"
                    placeholder="https://seu-webhook.com/endpoint"
                    {...register("notificationWebhook")}
                  />
                  {errors.notificationWebhook && (
                    <p className="text-sm text-destructive">
                      {errors.notificationWebhook.message}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/rules")}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? "Atualizar Regra" : "Criar Regra"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
