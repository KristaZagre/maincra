import prisma from '@sushiswap/database'

/**
 * Get all whitelisted pools including either token, PLUS the top 100 pools sorted by liquidity.
 * @param chainId
 * @param protocol
 * @param version
 * @param poolType
 * @param token0Address
 * @param token1Address
 * @returns
 */
export async function getPools(
  chainId: number,
  protocol: string,
  version: string,
  poolType: string,
  token0Address: string,
  token1Address: string
) {
  const token0Id = chainId.toString().concat(':').concat(token0Address.toLowerCase())
  const token1Id = chainId.toString().concat(':').concat(token1Address.toLowerCase())

  const pools = await Promise.all([
    prisma.pool.findMany({
      select: {
        address: true,
      },
      where: {
        AND: [
          {
            chainId,
            isWhitelisted: true,
            protocol,
            version,
            type: poolType,
            OR: [
              {
                token0Id: {
                  in: [token0Id, token1Id],
                },
              },
              {
                token1Id: {
                  in: [token0Id, token1Id],
                },
              },
            ],
          },
        ],
      },
    }),
    prisma.pool.findMany({
      select: {
        address: true,
      },
      where: {
        AND: [
          {
            chainId,
            isWhitelisted: true,
            protocol,
            version,
            type: poolType,
            token0Id: {
              notIn: [token0Id, token1Id],
            },
            token1Id: {
              notIn: [token0Id, token1Id],
            },
          },
        ],
      },
      take: 100,
      orderBy: {
        liquidityUSD: 'desc',
      },
    }),
  ])

  await prisma.$disconnect()

  return Array.from(new Set(pools.flat().map((pool) => pool.address)))
}
