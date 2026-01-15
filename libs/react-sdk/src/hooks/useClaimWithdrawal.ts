import { JsonRpcSigner } from '@ethersproject/providers'
import * as sdk from '@futureverse/experience-sdk'
import {
  Bridge__factory,
  EventProofStruct,
} from '@futureverse/identity-contract-bindings'
import { Signer } from 'ethers'
import React from 'react'
import { useFutureverse } from '../providers'
import { useFetchTRNEvent } from './useFetchTRNEvent'

type ClaimProps = {
  signer?: Signer | JsonRpcSigner
  extrinsicId: string
  onClaimSuccess?: (claimTransactionHash: string) => void
}

export function useClaimWithdrawal(props: ClaimProps | null): {
  fee: sdk.TokenAmount | null
  isLoadingFee: boolean
  feeError: Error | null
  isReadyToBeClaimed: boolean
  isSubmittingClaimTransaction: boolean
  submitError: Error | null
  fetchError: Error | null
  claimWithdrawal: () => Promise<string | null>
} {
  const { signer, extrinsicId, onClaimSuccess } = props ?? {}

  const { fetchTRNEvent: fetchRootEvent } = useFetchTRNEvent()

  const { CONSTANTS } = useFutureverse()

  const bridgeContract = React.useMemo(() => {
    if (!signer) return null
    return Bridge__factory.connect(CONSTANTS.CONTRACTS.ETHEREUM.BRIDGE, signer)
  }, [signer, CONSTANTS.CONTRACTS.ETHEREUM.BRIDGE])

  const [fee, setFee] = React.useState<sdk.TokenAmount | null>(null)
  const [feeError, setFeeError] = React.useState<Error | null>(null)
  const [isLoadingFee, setIsLoadingFee] = React.useState<boolean>(false)
  const [fetchError, setFetchError] = React.useState<Error | null>(null)

  const [withdrawArgs, setWithdrawArgs] = React.useState<
    [string, string, string, EventProofStruct] | null
  >(null)

  React.useEffect(() => {
    if (withdrawArgs != null || extrinsicId == null) return

    void (async () => {
      try {
        setFetchError(null)
        const {
          eventId,
          eventInfo: { source, destination, message },
          eventSignature: signature,
          eventAuthSetId: { setId: validatorSetId, setValue: validators },
        } = await fetchRootEvent(extrinsicId)

        setWithdrawArgs([
          source,
          destination,
          message,
          {
            eventId,
            validators,
            validatorSetId,
            ...signature,
          },
        ])
      } catch (e) {
        setFetchError(
          e instanceof Error
            ? e
            : new Error('Failed to fetch root event, unkown reason')
        )
      }
    })()
  }, [fetchRootEvent, extrinsicId, withdrawArgs])

  const estimateFee = React.useCallback(
    async (args: [string, string, string, EventProofStruct]) => {
      try {
        if (bridgeContract == null || signer == null) {
          throw new Error('Bridge contract was null')
        }
        setFeeError(null)
        setIsLoadingFee(true)

        const value = await bridgeContract.bridgeFee()

        const estimatedGas = await bridgeContract.estimateGas.receiveMessage(
          ...args,
          {
            value,
          }
        )

        const gasPrice = await signer.getGasPrice()

        const accountBalance = await signer.getBalance()

        const feeTotal = estimatedGas.mul(gasPrice).add(value)

        if (accountBalance.lt(feeTotal)) {
          throw new Error('Account has insufficient funds for transaction.')
        }

        setFee({
          ...sdk.CHAINS.ETHEREUM.HOMESTEAD.nativeCurrency,
          value: feeTotal,
        })
      } catch (err) {
        setFeeError(
          err instanceof Error
            ? err
            : new Error('Failed to estimate fee; unknown reason.')
        )
      } finally {
        setIsLoadingFee(false)
      }
    },
    [bridgeContract, signer]
  )

  React.useEffect(() => {
    if (fee != null || withdrawArgs == null) return

    void estimateFee(withdrawArgs)
  }, [estimateFee, fee, withdrawArgs])

  const [isSubmittingClaimTransaction, setIsSubmittingClaimTransaction] =
    React.useState<boolean>(false)
  const [submitError, setSubmitError] = React.useState<Error | null>(null)

  const claimWithdrawal = React.useCallback(async () => {
    if (withdrawArgs == null) return null
    try {
      if (!signer || !bridgeContract)
        throw new Error('No signer or bridge contract')

      setSubmitError(null)
      setIsSubmittingClaimTransaction(true)

      const value = await bridgeContract.bridgeFee()

      const gasLimit = await bridgeContract.estimateGas.receiveMessage(
        ...withdrawArgs,
        {
          value,
        }
      )

      const claimTx = await bridgeContract.receiveMessage(...withdrawArgs, {
        value,
        gasLimit,
      })

      const { transactionHash: claimTransactionHash } = await claimTx.wait()

      onClaimSuccess?.(claimTransactionHash)

      return claimTransactionHash
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err : new Error('Failed to submit claim')
      )
      return null
    } finally {
      setIsSubmittingClaimTransaction(false)
    }
  }, [withdrawArgs, signer, bridgeContract, onClaimSuccess])

  return {
    fee,
    feeError,
    isLoadingFee,
    submitError,
    fetchError,
    isSubmittingClaimTransaction,
    claimWithdrawal,
    isReadyToBeClaimed: withdrawArgs != null,
  }
}
