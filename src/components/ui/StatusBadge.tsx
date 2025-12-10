import { cn } from '@/lib/utils';

type StatusType = 
  | 'Ativo' | 'Inativo' | 'Em Onboarding'
  | 'Aberta' | 'Em Andamento' | 'Finalizada' | 'Cancelada'
  | 'Inscrito' | 'Concluído' | 'Desistente'
  | 'Entrada' | 'Saída'
  | 'Boas-vindas' | 'Envio do Livro' | 'Grupo da Turma';

const statusStyles: Record<StatusType, string> = {
  // Aluno status
  'Ativo': 'bg-success/10 text-success border-success/20',
  'Inativo': 'bg-muted text-muted-foreground border-muted',
  'Em Onboarding': 'bg-warning/10 text-warning border-warning/20',
  
  // Turma status
  'Aberta': 'bg-info/10 text-info border-info/20',
  'Em Andamento': 'bg-success/10 text-success border-success/20',
  'Finalizada': 'bg-muted text-muted-foreground border-muted',
  'Cancelada': 'bg-destructive/10 text-destructive border-destructive/20',
  
  // Inscrição status
  'Inscrito': 'bg-success/10 text-success border-success/20',
  'Concluído': 'bg-primary/10 text-primary border-primary/20',
  'Desistente': 'bg-destructive/10 text-destructive border-destructive/20',
  
  // Financeiro tipo
  'Entrada': 'bg-success/10 text-success border-success/20',
  'Saída': 'bg-destructive/10 text-destructive border-destructive/20',
  
  // Onboarding etapas (new)
  'Boas-vindas': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  'Envio do Livro': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  'Grupo da Turma': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
};

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status as StatusType] || 'bg-muted text-muted-foreground border-muted';
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        style,
        className
      )}
    >
      {status}
    </span>
  );
}
