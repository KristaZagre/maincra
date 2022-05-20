import { Amount, Token } from "@sushiswap/currency";
import { JSBI } from "@sushiswap/math";

const MIN_BID_THRESHOLD = JSBI.BigInt(1e15)
const MIN_BID_THRESHOLD_PRECISION = JSBI.BigInt(1e18)

export function calculateMinimumBid(amount: Amount<Token>): Amount<Token> {
    return amount.multiply(MIN_BID_THRESHOLD).divide(MIN_BID_THRESHOLD_PRECISION).add(amount)
}