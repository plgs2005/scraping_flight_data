import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Plus, Plane, Ship, Edit, Trash2, Mail, Webhook } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function RulesList() {
  const utils = trpc.useUtils();
  const { data: rules, isLoading } = trpc.rules.list.useQuery();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const deleteMutation = trpc.rules.delete.useMutation({
    onSuccess: () => {
      toast.success("Regra deletada com sucesso");
      utils.rules.list.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar regra");
    },
  });

  const toggleMutation = trpc.rules.toggleActive.useMutation({
    onMutate: async ({ id, isActive }) => {
      await utils.rules.list.cancel();
      const previous = utils.rules.list.getData();
      
      utils.rules.list.setData(undefined, (old) =>
        old?.map((rule) =>
          rule.id === id ? { ...rule, isActive } : rule
        )
      );
      
      return { previous };
    },
    onError: (error, variables, context) => {
      utils.rules.list.setData(undefined, context?.previous);
      toast.error(error.message || "Erro ao atualizar regra");
    },
    onSuccess: () => {
      toast.success("Regra atualizada com sucesso");
    },
    onSettled: () => {
      utils.rules.list.invalidate();
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const handleToggle = (id: number, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Regras de Monitoramento</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas regras de busca de ofertas
            </p>
          </div>
          <Link href="/rules/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todas as Regras</CardTitle>
            <CardDescription>
              {rules?.length || 0} regra(s) cadastrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : rules && rules.length > 0 ? (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {rule.type === "flight" ? (
                        <Plane className="h-6 w-6 text-primary" />
                      ) : (
                        <Ship className="h-6 w-6 text-primary" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-lg">{rule.name}</p>
                          <span className="text-xs px-2 py-0.5 rounded bg-secondary">
                            {rule.type === "flight" ? "Voo" : "Cruzeiro"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                          {rule.origin && rule.destination && (
                            <span>📍 {rule.origin} → {rule.destination}</span>
                          )}
                          <span>💰 Mín. {rule.minDiscount}% desconto</span>
                          {rule.notificationType === "email" && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              Email
                            </span>
                          )}
                          {rule.notificationType === "webhook" && (
                            <span className="flex items-center gap-1">
                              <Webhook className="h-3 w-3" />
                              Webhook
                            </span>
                          )}
                          {rule.notificationType === "both" && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <Webhook className="h-3 w-3" />
                              Email + Webhook
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {rule.isActive ? "Ativa" : "Inativa"}
                        </span>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                        />
                      </div>
                      <Link href={`/rules/${rule.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
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
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta regra? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
