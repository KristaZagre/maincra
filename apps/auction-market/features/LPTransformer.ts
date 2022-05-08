import { Token } from "@sushiswap/currency";
import { PairRepresentation } from "./context/representations";

export function toTokens(chainId: number,pairs: PairRepresentation[]):Token[] {
    if (!pairs) return []
    return Object.values(pairs).map( pair => new Token( {
        chainId, 
        address: pair.id,
        decimals: 18,
        symbol: pair.token0.symbol.concat("/").concat(pair.token1.symbol),
        name: "SushiSwap LP Token"
    }))
}