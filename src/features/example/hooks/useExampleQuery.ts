'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { ExampleResponseSchema } from '@/features/example/lib/dto';

const fetchExample = async (id: string) => {
  try {
    const { data } = await apiClient.get(`/api/example/${id}`);
    return ExampleResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch example.');
    throw new Error(message);
  }
};

export const useExampleQuery = (id: string) =>
  useQuery({
    queryKey: ['example', id],
    queryFn: () => fetchExample(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
