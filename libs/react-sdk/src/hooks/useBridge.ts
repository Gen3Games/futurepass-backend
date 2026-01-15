import { JsonRpcSigner } from '@ethersproject/providers'
import { CHAINS, TokenAmount } from '@futureverse/experience-sdk'
import {
  Bridge,
  Bridge__factory,
  Erc721,
  Erc721Peg,
  Erc721Peg__factory,
  Erc721__factory,
} from '@futureverse/identity-contract-bindings'
import { BigNumber, Signer, utils as ethers } from 'ethers'
import * as React from 'react'
import { useFutureverse } from '../providers'

export type BridgeProps = {
  tokenId: string
  contractAddress: string
  signer: Signer | JsonRpcSigner
  toAddress: string
  onBridgeConfirmation?: (
    transactionHash: string,
    tokenId: string,
    contractAddress: string,
    ownerAddress: string
  ) => void
}

/**
 * We can't estimate this before the user approves the token. However as we're always passing
 * the same sized params it should always be close to this number. We'll need to revist this
 * approach when users have the option of bridging multiple tokens at once.
 */
const DEPOSIT_GAS_LIMIT = BigNumber.from('0x019195')

export function useBridge(
  props: BridgeProps | null /* allow null to avoid conditonal hooks */
): {
  fee: TokenAmount | null
  isLoadingFee: boolean
  feeError: Error | null
  isSubmittingBridgeTransaction: boolean
  error: null | Error
  submitBridgeTransaction: () => Promise<string | null>
} {
  const { signer, contractAddress, tokenId, toAddress, onBridgeConfirmation } =
    props ?? {}

  const [error, setError] = React.useState<Error | null>(null)

  const { CONSTANTS } = useFutureverse()

  const contracts = React.useMemo<{
    erc721Peg: Erc721Peg
    bridge: Bridge
    token: Erc721
  } | null>(() => {
    if (signer == null || contractAddress == null) return null

    return {
      erc721Peg: Erc721Peg__factory.connect(
        CONSTANTS.CONTRACTS.ETHEREUM.ERC721_PEG,
        signer
      ),
      bridge: Bridge__factory.connect(
        CONSTANTS.CONTRACTS.ETHEREUM.BRIDGE,
        signer
      ),
      token: Erc721__factory.connect(contractAddress, signer),
    }
  }, [
    signer,
    contractAddress,
    CONSTANTS.CONTRACTS.ETHEREUM.ERC721_PEG,
    CONSTANTS.CONTRACTS.ETHEREUM.BRIDGE,
  ])

  const requestContractApproval = React.useCallback(
    async (tokenId: string) => {
      if (contracts == null) {
        throw new Error('Contracts were undefined, unable to approve token.')
      }

      const alreadyApprovedAddress = await contracts.token.getApproved(tokenId)
      // TODO: swap isAddress call with Address codec when available
      if (
        ethers.isAddress(alreadyApprovedAddress) &&
        alreadyApprovedAddress.toLowerCase() ===
          contracts.erc721Peg.address.toLowerCase()
      ) {
        return
      } else {
        const approveTx = await contracts.token.approve(
          contracts.erc721Peg.address,
          tokenId
        )
        await approveTx.wait()
      }
    },
    [contracts]
  )

  // Fee handling
  const [depositFee, setDepositFee] = React.useState<BigNumber | null>(null)
  const [totalFee, setTotalFee] = React.useState<TokenAmount | null>(null)
  const [isLoadingFee, setIsLoadingFee] = React.useState<boolean>(false)
  const [feeError, setFeeError] = React.useState<Error | null>(null)

  const estimateFee = React.useCallback(async () => {
    if (contracts == null || tokenId == null || signer == null) return
    try {
      setIsLoadingFee(true)
      if (contracts.token.estimateGas.approve == null) {
        throw new Error('Unable to estimate gas for approval.')
      }
      // Approval fee
      const approveGasLimit = await contracts.token.estimateGas.approve(
        contracts.erc721Peg.address,
        tokenId
      )

      // Deposit fee
      const sendMessageFee = await contracts.bridge.sendMessageFee()

      const gasPrice = await signer.getGasPrice()

      const feeTotal = approveGasLimit
        .add(DEPOSIT_GAS_LIMIT)
        .mul(gasPrice)
        .add(sendMessageFee)

      const accountBalance = await signer.getBalance()

      if (accountBalance.lt(feeTotal)) {
        throw new Error('Account has insufficient funds for transaction.')
      }

      setFeeError(null)
      setDepositFee(sendMessageFee)
      setTotalFee({
        value: feeTotal,
        symbol: CHAINS.ETHEREUM.HOMESTEAD.nativeCurrency.symbol,
        decimals: CHAINS.ETHEREUM.HOMESTEAD.nativeCurrency.decimals,
      })
    } catch (e) {
      if (e instanceof Error) {
        setFeeError(e)
      } else {
        setFeeError(new Error('Failed to estimate fee.'))
      }
    } finally {
      setIsLoadingFee(false)
    }
  }, [contracts, signer, tokenId])

  React.useEffect(() => {
    if (isLoadingFee || depositFee != null) return

    void estimateFee()
  }, [estimateFee, depositFee, isLoadingFee])

  const [isSubmittingBridgeTransaction, setIsSubmittingBridgeTransaction] =
    React.useState<boolean>(false)

  const submitBridgeTransaction = React.useCallback(async () => {
    try {
      setIsSubmittingBridgeTransaction(true)
      setError(null)

      if (
        tokenId == null ||
        contractAddress == null ||
        signer == null ||
        contracts == null ||
        toAddress == null
      ) {
        throw new Error('Props were null, unable to submit bridge transaction.')
      }

      if (depositFee == null) {
        throw new Error('Fee was null, unable to submit bridge transaction.')
      }

      await requestContractApproval(tokenId)

      const args: [string[], [BigNumber][], string] = [
        [contractAddress],
        [[BigNumber.from(tokenId)]],
        toAddress,
      ]

      const gasLimit = await contracts.erc721Peg.estimateGas.deposit(...args, {
        value: depositFee,
      })

      const tx = await contracts.erc721Peg.deposit(...args, {
        value: depositFee,
        gasLimit,
      })

      const transactionReceipt = await tx.wait()
      setIsSubmittingBridgeTransaction(false)
      onBridgeConfirmation?.(
        transactionReceipt.transactionHash,
        tokenId,
        contractAddress,
        toAddress
      )

      return transactionReceipt.transactionHash
    } catch (e) {
      setError(
        e instanceof Error
          ? e
          : new Error(
              'Something went wrong, unable to submit bridge transaction.'
            )
      )
      return null
    } finally {
      setIsSubmittingBridgeTransaction(false)
    }
  }, [
    tokenId,
    contractAddress,
    signer,
    contracts,
    depositFee,
    toAddress,
    onBridgeConfirmation,
    requestContractApproval,
  ])

  return {
    fee: totalFee,
    isLoadingFee,
    feeError,
    isSubmittingBridgeTransaction,
    error,
    submitBridgeTransaction,
  }
}
