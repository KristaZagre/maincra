import { z } from 'zod'
import { cz } from '../../misc/zodObjects.js'

export const v2PositionsInputSchema = z.object({
  user: cz.address(),
})
