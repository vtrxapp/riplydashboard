/** Normalized error shape used across the service/hook layers. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Wraps a Supabase `{ data, error }` style promise, throwing a normalized AppError. */
export async function unwrap<T>(
  promise: PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>,
  fallbackMessage = 'Something went wrong. Please try again.',
): Promise<T> {
  const { data, error } = await promise;
  if (error) {
    throw new AppError(error.message || fallbackMessage, error, error.code);
  }
  return (data ?? (null as unknown as T)) as T;
}

export function toErrorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred.';
}
