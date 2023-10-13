import { z } from 'zod'


const processArrayKeepErrors = <T, P extends z.SafeParseReturnType<unknown, T>>(
  inputs: unknown[],
  process: (input: unknown) => P,
) => {
  return inputs.map((input) => process(input))
}

const processArrayFilterErrors = <
  T,
  P extends z.SafeParseReturnType<unknown, T>,
>(
  inputs: unknown[],
  process: (input: unknown) => P,
) => {
  return inputs
    .map((input) => process(input))
    .filter((r) => r.success)
    .map((r) => (r as z.SafeParseSuccess<T>).data)
}

export const processArray = {
  keepErrors: processArrayKeepErrors,
  filterErrors: processArrayFilterErrors,
}
