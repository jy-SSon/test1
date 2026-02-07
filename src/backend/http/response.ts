import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppContext } from '@/backend/hono/context';

export type SuccessResult<TData> = {
  ok: true;
  status: ContentfulStatusCode;
  data: TData;
};

export type ErrorResult<TCode extends string, TDetails = unknown> = {
  ok: false;
  status: ContentfulStatusCode;
  error: {
    code: TCode;
    message: string;
    details?: TDetails;
  };
};

export type HandlerResult<TData, TCode extends string, TDetails = unknown> =
  | SuccessResult<TData>
  | ErrorResult<TCode, TDetails>;

export const success = <TData>(
  data: TData,
  status: ContentfulStatusCode = 200,
): SuccessResult<TData> => ({
  ok: true,
  status,
  data,
});

export const failure = <TCode extends string, TDetails = unknown>(
  status: ContentfulStatusCode,
  code: TCode,
  message: string,
  details?: TDetails,
): ErrorResult<TCode, TDetails> => ({
  ok: false,
  status,
  error: {
    code,
    message,
    ...(details === undefined ? {} : { details }),
  },
});

export const respond = <TData, TCode extends string, TDetails = unknown>(
  c: AppContext,
  result: HandlerResult<TData, TCode, TDetails>,
) => {
  if (result.ok) {
    return c.json(result.data, result.status);
  }

  const errorResult = result as ErrorResult<TCode, TDetails>;

  return c.json(
    {
      error: errorResult.error,
    },
    errorResult.status,
  );
};
