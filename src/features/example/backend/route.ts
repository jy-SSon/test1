import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { ExampleParamsSchema } from '@/features/example/backend/schema';
import { getExampleById } from './service';
import {
  exampleErrorCodes,
  type ExampleServiceError,
} from './error';

export const registerExampleRoutes = (app: Hono<AppEnv>) => {
  app.get('/example/:id', async (c) => {
    const parsedParams = ExampleParamsSchema.safeParse({ id: c.req.param('id') });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_EXAMPLE_PARAMS',
          'The provided example id is invalid.',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getExampleById(supabase, parsedParams.data.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ExampleServiceError, unknown>;

      if (errorResult.error.code === exampleErrorCodes.fetchError) {
        logger.error('Failed to fetch example', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
