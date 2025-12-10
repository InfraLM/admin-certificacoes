import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  title = 'Erro ao carregar dados',
  message = 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function PageError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex h-[50vh] items-center justify-center px-4">
      <ErrorMessage onRetry={onRetry} />
    </div>
  );
}
