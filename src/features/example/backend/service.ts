import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ExampleResponseSchema,
  ExampleTableRowSchema,
  type ExampleResponse,
  type ExampleRow,
} from '@/features/example/backend/schema';
import {
  exampleErrorCodes,
  type ExampleServiceError,
} from '@/features/example/backend/error';

const EXAMPLE_TABLE = 'example';

const fallbackAvatar = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/200/200`;

export const getExampleById = async (
  client: SupabaseClient,
  id: string,
): Promise<HandlerResult<ExampleResponse, ExampleServiceError, unknown>> => {
  const { data, error } = await client
    .from(EXAMPLE_TABLE)
    .select('id, full_name, avatar_url, bio, updated_at')
    .eq('id', id)
    .maybeSingle<ExampleRow>();

  if (error) {
    return failure(500, exampleErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(404, exampleErrorCodes.notFound, 'Example not found');
  }

  const rowParse = ExampleTableRowSchema.safeParse(data);

  if (!rowParse.success) {
    return failure(
      500,
      exampleErrorCodes.validationError,
      'Example row failed validation.',
      rowParse.error.format(),
    );
  }

  const mapped = {
    id: rowParse.data.id,
    fullName: rowParse.data.full_name ?? 'Anonymous User',
    avatarUrl:
      rowParse.data.avatar_url ?? fallbackAvatar(rowParse.data.id),
    bio: rowParse.data.bio,
    updatedAt: rowParse.data.updated_at,
  } satisfies ExampleResponse;

  const parsed = ExampleResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      exampleErrorCodes.validationError,
      'Example payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
