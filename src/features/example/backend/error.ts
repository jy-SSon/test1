export const exampleErrorCodes = {
  notFound: 'EXAMPLE_NOT_FOUND',
  fetchError: 'EXAMPLE_FETCH_ERROR',
  validationError: 'EXAMPLE_VALIDATION_ERROR',
} as const;

type ExampleErrorValue = (typeof exampleErrorCodes)[keyof typeof exampleErrorCodes];

export type ExampleServiceError = ExampleErrorValue;
