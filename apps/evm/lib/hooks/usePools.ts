import {
  SimplePool,
  SimplePoolArgs,
  SimplePoolCount,
  SimplePoolCountArgs,
} from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'

export function parseArgs<T>(args?: Partial<T>) {
  if (!args) return ''
  return Object.entries(args)
    .sort(([key1], [key2]) => key1.localeCompare(key2))
    .reduce((acc, [key, value]) => {
      if (value === undefined || value === null) return acc
      if (Array.isArray(value) && value.length === 0) return acc
      const param = `${key}=${Array.isArray(value) ? value.join(',') : value}`
      if (acc === '?') {
        return `${acc}${param}`
      } else {
        return `${acc}&${param}`
      }
    }, '?')
}

export const getSimplePoolsUrl = (args: SimplePoolArgs) => {
  return `/pool/api/v1/pools${parseArgs(args)}`
}

export const useSimplePools = ({ args }: { args: SimplePoolArgs }) => {
  const url = getSimplePoolsUrl(args)

  return useQuery<SimplePool[]>({
    queryKey: [url],
    queryFn: () => fetch(url).then((data) => data.json()),
    keepPreviousData: true,
    staleTime: 0,
    cacheTime: 86400000, // 24hs
    enabled: true,
  })
}

export const getSimplePoolCountUrl = (args: SimplePoolCountArgs) => {
  return `/pool/api/v1/pools/count${parseArgs(args)}`
}

export const useSimplePoolCount = ({ args }: { args: SimplePoolCountArgs }) => {
  const url = getSimplePoolCountUrl(args)

  return useQuery<SimplePoolCount>({
    queryKey: [url],
    queryFn: () => fetch(url).then((data) => data.json()),
    keepPreviousData: true,
    staleTime: 0,
    cacheTime: 86400000, // 24hs
    enabled: true,
  })
}
