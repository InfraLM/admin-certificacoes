import { useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAlunos, useUpdateAlunoField } from '@/hooks/useApi';
import { Aluno } from '@/types/clinic';
import { Hand, Package, Users, CheckCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

// Define the steps using the exact status string from the DB
const etapas: { value: Aluno['status']; label: string; icon: React.ElementType; progresso: number }[] = [
  { value: 'Boas-vindas', label: 'Boas-vindas', icon: Hand, progresso: 25 },
  { value: 'Envio do Livro', label: 'Envio do Livro', icon: Package, progresso: 50 },
  { value: 'Grupo da Turma', label: 'Grupo da Turma', icon: Users, progresso: 75 },
  { value: 'Concluído', label: 'Concluído', icon: CheckCircle, progresso: 100 },
];

// Include 'Em Onboarding' as a starting point if needed, or map it to Boas-vindas
// For now, let's query all relevant statuses
const ONBOARDING_STATUSES = 'Em Onboarding,Boas-vindas,Envio do Livro,Grupo da Turma,Concluído';

export default function Onboarding() {
  const { data: alunos = [], isLoading, isError, refetch } = useAlunos({ status: ONBOARDING_STATUSES });
  const updateFieldMutation = useUpdateAlunoField();

  // Normalize 'Em Onboarding' to 'Boas-vindas' for display if desired, 
  // OR just treat 'Em Onboarding' as 'Boas-vindas' in logic.
  // Let's assume 'Boas-vindas' is the first step.

  const handleUpdateEtapa = (id: string, etapa: string) => {
    updateFieldMutation.mutate({ id, field: 'status', value: etapa }, {
      onSuccess: () => {
        toast.success(`Etapa atualizada para: ${etapa}`);
      },
      onError: () => {
        toast.error('Erro ao atualizar etapa');
      }
    });
  };

  const handleAdvanceEtapa = (aluno: Aluno) => {
    // If status is 'Em Onboarding', usually start at Boas-vindas
    const currentStatus = aluno.status === 'Em Onboarding' ? 'Boas-vindas' : aluno.status;
    const currentIndex = etapas.findIndex((e) => e.value === currentStatus);

    if (currentIndex !== -1 && currentIndex < etapas.length - 1) {
      const nextEtapa = etapas[currentIndex + 1];
      handleUpdateEtapa(aluno.id, nextEtapa.value);
    } else if (aluno.status === 'Em Onboarding') {
      // Start flow
      handleUpdateEtapa(aluno.id, 'Boas-vindas');
    }
  };

  const getEtapaInfo = (status: string) => {
    // Map 'Em Onboarding' to first step visual
    if (status === 'Em Onboarding') return etapas[0];
    return etapas.find((e) => e.value === status) || etapas[0];
  };

  const countByEtapa = etapas.map((etapa) => ({
    ...etapa,
    count: alunos.filter((a) => {
      // Count 'Em Onboarding' as 'Boas-vindas'
      if (etapa.value === 'Boas-vindas') return a.status === 'Boas-vindas' || a.status === 'Em Onboarding';
      return a.status === etapa.value;
    }).length,
  }));

  if (isLoading) {
    return (
      <>
        <Header title="Onboarding" description="Acompanhe o processo de integração dos novos alunos" />
        <PageLoading text="Carregando onboarding..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header title="Onboarding" description="Acompanhe o processo de integração dos novos alunos" />
        <div className="page-container">
          <PageError onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  // Filter out those that might have been fetched but aren't in our visual pipeline (e.g. if we fetched Ativo/Inativo by mistake)
  // But we filtered in API.
  const displayAlunos = alunos;

  return (
    <>
      <Header
        title="Onboarding"
        description="Acompanhe o processo de integração dos novos alunos"
      />

      <div className="page-container">
        {/* Pipeline Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          {countByEtapa.map((etapa) => {
            const Icon = etapa.icon;
            return (
              <div
                key={etapa.value}
                className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{etapa.label}</p>
                    <p className="text-3xl font-bold text-foreground">{etapa.count}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${etapa.value === 'Concluído' ? 'bg-success/10' : 'bg-primary/10'
                    }`}>
                    <Icon className={`h-6 w-6 ${etapa.value === 'Concluído' ? 'text-success' : 'text-primary'
                      }`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pipeline Flow Visual */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Fluxo de Onboarding</h3>
          <div className="flex items-center justify-between">
            {etapas.map((etapa, index) => {
              const Icon = etapa.icon;
              return (
                <div key={etapa.value} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full ${etapa.value === 'Concluído'
                        ? 'bg-success/20 text-success'
                        : 'bg-primary/10 text-primary'
                      }`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{etapa.label}</p>
                    <p className="text-xs text-muted-foreground">{countByEtapa[index].count} aluno(s)</p>
                  </div>
                  {index < etapas.length - 1 && (
                    <ChevronRight className="mx-4 h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Onboarding Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Alunos em Onboarding</h3>

          {displayAlunos.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-success/50" />
              <p className="mt-4 text-lg font-medium text-foreground">
                Nenhum aluno em onboarding
              </p>
              <p className="text-sm text-muted-foreground">
                Todos os alunos já foram integrados
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {displayAlunos.map((aluno) => {
                const etapaInfo = getEtapaInfo(aluno.status);
                const Icon = etapaInfo.icon;
                const isCompleted = aluno.status === 'Concluído';
                // Calculate progress: if Em Onboarding, use Boas-vindas progress
                const progress = etapaInfo.progresso;

                return (
                  <div
                    key={aluno.id}
                    className={`rounded-xl border bg-card p-5 transition-all hover:shadow-md ${isCompleted ? 'border-success/30' : 'border-border'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isCompleted ? 'bg-success/10' : 'bg-primary/10'
                            }`}>
                            <Icon className={`h-5 w-5 ${isCompleted ? 'text-success' : 'text-primary'
                              }`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{aluno.nome}</h4>
                            <p className="text-sm text-muted-foreground">{aluno.email}</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Etapa:</span>
                              <Select
                                value={aluno.status === 'Em Onboarding' ? 'Boas-vindas' : aluno.status}
                                onValueChange={(value) => handleUpdateEtapa(aluno.id, value)}
                              >
                                <SelectTrigger className="h-8 w-[160px]">
                                  <StatusBadge status={aluno.status} />
                                </SelectTrigger>
                                <SelectContent>
                                  {etapas.map((e) => (
                                    <SelectItem key={e.value} value={e.value}>
                                      {e.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {!isCompleted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAdvanceEtapa(aluno)}
                                disabled={updateFieldMutation.isPending}
                              >
                                Avançar
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                            <span>Tel: {aluno.telefone}</span>
                            <span>Matrícula: {aluno.data_matricula}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
