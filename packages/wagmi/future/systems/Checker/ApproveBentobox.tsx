import React, { FC, Fragment, useState } from 'react'
import { Button, ButtonProps } from '@sushiswap/ui/future/components/button'
import { ApprovalState } from '../../../hooks'
import { Menu, Transition } from '@headlessui/react'
import { ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/solid'
import { ApproveBentoboxController } from '../../components'
import { Address } from 'wagmi'
import { ChainId } from '@sushiswap/chain'
import { NotificationData } from '@sushiswap/ui/future/components/toast'
import { Signature } from '@ethersproject/bytes'

export interface ApproveBentoboxProps extends ButtonProps<'button'> {
  chainId: ChainId
  id: string
  contract: Address
  enabled?: boolean
  onSuccess?: (data: NotificationData) => void
  onSignature?: (data: Signature) => void
}

export const ApproveBentobox: FC<ApproveBentoboxProps> = ({
  chainId,
  id,
  contract,
  children,
  className,
  variant,
  fullWidth,
  as,
  size,
  enabled = true,
  onSuccess,
  onSignature,
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <ApproveBentoboxController
      contract={contract}
      chainId={chainId}
      enabled={enabled}
      onSuccess={onSuccess}
      onSignature={onSignature}
    >
      {({ approvalState, onApprove, signature }) => {
        if (approvalState === ApprovalState.APPROVED || (approvalState === ApprovalState.PENDING && signature)) {
          return <>{children}</>
        }

        return (
          <Button
            as={as}
            loading={approvalState === ApprovalState.LOADING || (approvalState === ApprovalState.PENDING && !signature)}
            testdata-id={id}
            variant={variant}
            size={size}
            className={className}
            fullWidth={fullWidth}
            onClick={onApprove}
          >
            Approve Bentobox
            <Menu
              as="div"
              className="relative flex justify-center"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Menu.Button className="text-center text-xs text-blue cursor-pointer">
                <InformationCircleIcon width={18} height={18} className="text-white" />
              </Menu.Button>
              <Transition
                as={Fragment}
                show={showTooltip}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <div className="z-10 absolute pb-2 w-[max-content] bottom-4">
                  <Menu.Items className="text-left w-[240px] text-gray-700  border-gray-300 dark:border-slate-700 dark:text-slate-200 flex flex-col gap-3 bg-white dark:bg-slate-800 rounded-lg shadow-hover-card shadow-black/30 px-4 py-3 text-xs mt-0.5">
                    <span className="text-gray-500 dark:text-slate-400">BentoBox Approval</span>
                    We need your approval first to access your wallet using BentoBox; you will only have to approve this
                    master contract once.
                    <a
                      target="_blank"
                      className="text-blue dark:text-blue dark:font-semibold flex gap-1 items-center hover:text-blue-700"
                      href="https://www.sushi.com/academy/articles/what-is-bentobox"
                      rel="noreferrer"
                    >
                      Learn more <ChevronRightIcon width={12} height={12} />
                    </a>
                  </Menu.Items>
                </div>
              </Transition>
            </Menu>
          </Button>
        )
      }}
    </ApproveBentoboxController>
  )
}