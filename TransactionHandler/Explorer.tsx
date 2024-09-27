import { useState } from "react";
import { resolveMethod, prepareContractCall, defineChain, getContract, ThirdwebContract } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import client from "@/lib/client";

export const useTransactionHandlerExplorer = (
  chainId: number,
  contractAddress: string,
  method: string,
  params: any[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  const [isPending, setIsPending] = useState(false);
  const sendTransaction = useSendTransaction();
  const NETWORK = defineChain(chainId);

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });


  const handleTransaction = async () => {
    try {
      setIsPending(true);
      const resolvedMethod = await resolveMethod(method);
      const transaction = await prepareContractCall({
        contract,
        method: resolvedMethod,
        params,
      });
      const result = await sendTransaction.mutateAsync(transaction);
      await doWaitForReceipt(result);
      onSuccess();
    } catch (error) {
    } finally {
      setIsPending(false);
    }
  };

  return { handleTransaction, isPending };
};

async function doWaitForReceipt(result: { readonly transactionHash: `0x${string}`; client: import("thirdweb").ThirdwebClient; chain: { readonly id: number; readonly name?: string | undefined; readonly rpc: string; readonly icon?: { url: string; width: number; height: number; format: string; } | undefined; readonly nativeCurrency?: { name?: string | undefined; symbol?: string | undefined; decimals?: number | undefined; } | undefined; readonly blockExplorers?: { name: string; url: string; apiUrl?: string | undefined; }[] | undefined; readonly testnet?: true | undefined; readonly experimental?: { increaseZeroByteCount?: boolean | undefined; } | undefined; }; maxBlocksWaitTime?: number | undefined; }) {
  // Implement your logic to wait for the transaction receipt here
}
