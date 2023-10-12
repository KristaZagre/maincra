import { type BasePoolArgs, basePoolInputSchema } from '../base.js'

export const simplePoolCountInputSchema = basePoolInputSchema

export type SimplePoolCountArgs = BasePoolArgs

export type SimplePoolCount = { count: number }
