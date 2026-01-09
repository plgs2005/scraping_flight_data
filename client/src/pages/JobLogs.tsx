import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Clock, Play } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function JobLogs() {
  const { data: logs, isLoading, refetch } = trpc.jobs.logs.useQuery({ limit: 50 });
  
  const runJobMutation = trpc.jobs.runManual.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          `Job executado com sucesso! ${result.dealsFound} ofertas encontradas, ${result.notificationsSent} notificações enviadas.`
        );
      } else {
        toast.error(`Erro ao executar job: ${result.error}`);
      }
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao executar job");
    },
  });

  const handleRunJob = () => {
    if (confirm("Deseja executar a busca de ofertas manualmente agora?")) {
      runJobMutation.mutate();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Logs de Execução</h1>
            <p className="text-muted-foreground mt-1">
              Histórico de execuções do job de busca de ofertas
            </p>
          </div>
          <Button onClick={handleRunJob} disabled={runJobMutation.isPending}>
            {runJobMutation.isPending ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Executar Agora
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Execuções</CardTitle>
            <CardDescription>
              {logs?.length || 0} execução(ões) registrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {log.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : log.status === "error" ? (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5 animate-spin" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{log.jobType}</p>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              log.status === "success"
                                ? "bg-green-100 text-green-800"
                                : log.status === "error"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {log.status === "success"
                              ? "Sucesso"
                              : log.status === "error"
                              ? "Erro"
                              : "Executando"}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            📋 {log.rulesProcessed} regra(s) processada(s) •{" "}
                            🎯 {log.dealsFound} oferta(s) encontrada(s) •{" "}
                            📧 {log.notificationsSent} notificação(ões) enviada(s)
                          </p>
                          {log.executionTime && (
                            <p>⏱️ Tempo de execução: {(log.executionTime / 1000).toFixed(2)}s</p>
                          )}
                          {log.errorMessage && (
                            <p className="text-red-600">❌ Erro: {log.errorMessage}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>
                        {format(new Date(log.startedAt), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      <p>
                        {format(new Date(log.startedAt), "HH:mm:ss", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhuma execução registrada ainda
                </p>
                <Button onClick={handleRunJob}>
                  <Play className="mr-2 h-4 w-4" />
                  Executar Primeira Busca
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
