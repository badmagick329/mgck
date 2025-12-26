import { useToast } from '@/components/ui/use-toast';

const TOAST_DURATION = 4000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export default function useOperationToast() {
  const { toast } = useToast();

  const showError = (title: string, description: string) => {
    toast({
      variant: 'destructive',
      title,
      description,
      duration: TOAST_DURATION,
    });
  };

  const showSuccess = (title: string, description?: string) => {
    toast({ title, description, duration: TOAST_DURATION });
  };

  const withErrorToast = async <T,>(
    operation: () => Promise<Result<T>>,
    errorTitle: string
  ): Promise<Result<T>> => {
    const result = await operation();
    if (!result.ok) {
      showError(errorTitle, result.error);
    }
    return result;
  };

  return { showError, showSuccess, withErrorToast };
}
