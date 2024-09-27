import type { Address } from "abitype";
import type { BaseTransactionOptions } from "thirdweb/src/transaction/types";
import { getClaimParams } from 'thirdweb/src/utils/extensions/drops/get-claim-params';
import { claimBatch } from "./claim";

export type ClaimToParams = {
  to: Address;
  tokenId: bigint;
  quantity: bigint;
  from?: Address;
};

/**
 * Claim ERC1155 NFTs to a specified address
 * @param options - The options for the transaction
 * @extension ERC1155
 * @example
 * ```ts
 * import { claimToBatch } from "thirdweb/extensions/erc1155";
 * import { sendTransaction } from "thirdweb";
 *
 * const transaction = claimToBatch({
 *   contract,
 *   to: "0x...",
 *   tokenId: 0n,
 *   quantity: 1n,
 * });
 *
 * await sendTransaction({ transaction, account });
 * ```
 * @throws If no claim condition is set
 * @returns The prepared transaction
 */
export function claimToBatch(options: BaseTransactionOptions<ClaimToParams>) {
  return claimBatch({
    contract: options.contract,
    async asyncParams() {
      const params = await getClaimParams({
        type: "erc1155",
        contract: options.contract,
        to: options.to,
        quantity: options.quantity,
        from: options.from,
        tokenId: options.tokenId,
      });

      return {
        ...params,
        receiver: options.to,
        tokenId: options.tokenId,
        quantity: options.quantity,
      };
    },
  });
}
