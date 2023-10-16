import { z } from 'zod'
import type { GetApiInputFromOutput } from '../../misc/GetApiInputFromOutput.js'
import { cz } from '../../misc/zodObjects.js'

export const v2PositionsInputSchema = z.object({
  user: cz.address(),
})

export type V2PositionsArgs = GetApiInputFromOutput<
  typeof v2PositionsInputSchema['_input'],
  typeof v2PositionsInputSchema['_output']
>
