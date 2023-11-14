'use client'

<<<<<<<< HEAD:apps/evm/src/ui/pool/AddSectionV2.tsx
import { useIsMounted } from '@sushiswap/hooks'
import { Pool } from '@sushiswap/rockset-client'
import { Button } from '@sushiswap/ui/components/button'
========
import { Pool } from '@sushiswap/client'
import { useIsMounted } from '@sushiswap/hooks'
import { Button } from '@sushiswap/ui'
>>>>>>>> master:apps/evm/src/ui/pool/AddSectionLegacy.tsx
import { SushiSwapV2ChainId } from '@sushiswap/v2-sdk'
import {
  Address,
  SushiSwapV2PoolState,
  getSushiSwapRouterContractConfig,
  useSushiSwapV2Pool,
} from '@sushiswap/wagmi'
<<<<<<<< HEAD:apps/evm/src/ui/pool/AddSectionV2.tsx
import { Checker } from '@sushiswap/wagmi/future/systems'
import { CheckerProvider } from '@sushiswap/wagmi/future/systems/Checker/Provider'
import { APPROVE_TAG_ADD_V2 } from 'lib/constants'
import { useTokensFromPool } from 'lib/hooks'
import { FC, useCallback, useMemo, useState } from 'react'
import { ChainId } from 'sushi/chain'
import { tryParseAmount } from 'sushi/currency'
========
import { Checker } from '@sushiswap/wagmi/systems'
import { CheckerProvider } from '@sushiswap/wagmi/systems/Checker/Provider'
import { FC, useCallback, useMemo, useState } from 'react'
import { APPROVE_TAG_ADD_LEGACY } from 'src/lib/constants'
import { ChainId } from 'sushi/chain'
import { tryParseAmount } from 'sushi/currency'
import { useTokensFromPool } from '../../lib/hooks'
>>>>>>>> master:apps/evm/src/ui/pool/AddSectionLegacy.tsx

import { AddSectionReviewModalV2 } from './AddSectionReviewModalV2'
import { AddSectionWidget } from './AddSectionWidget'

export const AddSectionV2: FC<{ pool: Pool }> = ({ pool: _pool }) => {
  const chainId = _pool.chainId as SushiSwapV2ChainId
  const isMounted = useIsMounted()
  const { token0, token1 } = useTokensFromPool(_pool)
  const [{ input0, input1 }, setTypedAmounts] = useState<{
    input0: string
    input1: string
  }>({ input0: '', input1: '' })
  const {
    data: [poolState, pool],
  } = useSushiSwapV2Pool(_pool.chainId as SushiSwapV2ChainId, token0, token1)

  const [parsedInput0, parsedInput1] = useMemo(() => {
    return [tryParseAmount(input0, token0), tryParseAmount(input1, token1)]
  }, [input0, input1, token0, token1])

  const onChangeToken0TypedAmount = useCallback(
    (value: string) => {
      if (poolState === SushiSwapV2PoolState.NOT_EXISTS) {
        setTypedAmounts((prev) => ({
          ...prev,
          input0: value,
        }))
      } else if (token0 && pool) {
        const parsedAmount = tryParseAmount(value, token0)
        setTypedAmounts({
          input0: value,
          input1: parsedAmount
            ? pool.priceOf(token0.wrapped).quote(parsedAmount.wrapped).toExact()
            : '',
        })
      }
    },
    [pool, poolState, token0],
  )

  const onChangeToken1TypedAmount = useCallback(
    (value: string) => {
      if (poolState === SushiSwapV2PoolState.NOT_EXISTS) {
        setTypedAmounts((prev) => ({
          ...prev,
          input1: value,
        }))
      } else if (token1 && pool) {
        const parsedAmount = tryParseAmount(value, token1)
        setTypedAmounts({
          input0: parsedAmount
            ? pool.priceOf(token1.wrapped).quote(parsedAmount.wrapped).toExact()
            : '',
          input1: value,
        })
      }
    },
    [pool, poolState, token1],
  )

  const amounts = useMemo(
    () => [parsedInput0, parsedInput1],
    [parsedInput1, parsedInput0],
  )

  return (
    <CheckerProvider>
      <AddSectionWidget
        isFarm={!!_pool.incentives && _pool.incentives.length > 0}
        chainId={_pool.chainId as ChainId}
        input0={input0}
        input1={input1}
        token0={token0}
        token1={token1}
        onInput0={onChangeToken0TypedAmount}
        onInput1={onChangeToken1TypedAmount}
      >
        <Checker.Connect size="default" variant="outline" fullWidth>
          <Checker.Guard
            size="default"
            variant="outline"
            guardWhen={
              isMounted &&
              [
                SushiSwapV2PoolState.NOT_EXISTS,
                SushiSwapV2PoolState.INVALID,
              ].includes(poolState)
            }
            guardText="Pool not found"
          >
            <Checker.Network
              size="default"
              variant="outline"
              fullWidth
              chainId={_pool.chainId}
            >
              <Checker.Amounts
                size="default"
                variant="outline"
                fullWidth
                chainId={_pool.chainId as ChainId}
                amounts={amounts}
              >
                <Checker.ApproveERC20
                  size="default"
                  variant="outline"
                  id="approve-token-0"
                  className="whitespace-nowrap"
                  fullWidth
                  amount={parsedInput0}
                  contract={
                    getSushiSwapRouterContractConfig(chainId).address as Address
                  }
                >
                  <Checker.ApproveERC20
                    size="default"
                    variant="outline"
                    id="approve-token-1"
                    className="whitespace-nowrap"
                    fullWidth
                    amount={parsedInput1}
                    contract={
                      getSushiSwapRouterContractConfig(chainId)
                        .address as Address
                    }
                  >
                    <Checker.Success tag={APPROVE_TAG_ADD_V2}>
                      <AddSectionReviewModalV2
                        poolAddress={pool?.liquidityToken.address}
                        poolState={poolState}
                        chainId={_pool.chainId as SushiSwapV2ChainId}
                        token0={token0}
                        token1={token1}
                        input0={parsedInput0}
                        input1={parsedInput1}
                        onSuccess={() => {
                          setTypedAmounts({ input0: '', input1: '' })
                        }}
                      >
                        <Button size="default" fullWidth>
                          Add Liquidity
                        </Button>
                      </AddSectionReviewModalV2>
                    </Checker.Success>
                  </Checker.ApproveERC20>
                </Checker.ApproveERC20>
              </Checker.Amounts>
            </Checker.Network>
          </Checker.Guard>
        </Checker.Connect>
      </AddSectionWidget>
    </CheckerProvider>
  )
}
