import { z } from 'zod'
import type { GetApiInputFromOutput } from '../misc/GetApiInputFromOutput.js'
import { cz } from '../misc/zodObjects.js'

export const basePoolInputSchema = z.object({
  id: cz.id(),
})

export type BasePoolArgs = GetApiInputFromOutput<
  typeof basePoolInputSchema['_input'],
  typeof basePoolInputSchema['_output']
>
