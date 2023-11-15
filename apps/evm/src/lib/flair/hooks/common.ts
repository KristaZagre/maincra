import { UseBaseQueryOptions } from '@tanstack/react-query'

export type QueryParams<TData> = Omit<
  UseBaseQueryOptions<TData, unknown, TData, TData, string[]>,
  'queryKey' | 'queryFn'
>
