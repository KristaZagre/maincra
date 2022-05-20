import { Token } from "@sushiswap/currency";

import { TokenRepresentation } from "./context/representations";

export function toToken(chainId: number, tokenRepresentation: TokenRepresentation): Token {
 return new Token({
    chainId: chainId,
    address: tokenRepresentation.id,
    decimals: Number(tokenRepresentation.decimals),
    symbol: tokenRepresentation.symbol,
    name: tokenRepresentation.name,
  })
}