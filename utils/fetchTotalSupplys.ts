import client from '@/lib/client';
import { ThirdwebContract, defineChain, getContract, readContract, resolveMethod } from 'thirdweb';
import { totalSupply } from 'thirdweb/extensions/erc721';

export const fetchTotalSupplys = async (contractAddress: string, chainId: number,) => {

  const NETWORK = defineChain(chainId);

  const contract = getContract({
    address: contractAddress || "",
    client,
    chain: NETWORK,
  });
  const supply = await totalSupply({ contract });

  let totalIds: number = 1000;

  if (contractAddress.toLowerCase() === "0xce300b00aa9c066786D609Fc96529DBedAa30B76".toLowerCase()) {
              
    totalIds = 10000;
  } else if (contractAddress.toLowerCase() === "0xAf1B5063A152550aebc8d6cB0dA6936288EAb3dc".toLowerCase()) {
    totalIds = 1000;

  } else  {
     totalIds = Number(supply) +1 || 1001;

  }

  if (!contract || !totalIds) return null;

  const ownedIds: number[] = [];
  const uniqueOwnersSet = new Set<string>();
  let nonexistentCount = 0;

  const batchSize = 50; // Adjust batch size as needed

  const fetchBatch = async (start: number, end: number) => {
    const promises = [];
    for (let i = start; i < end; i++) {
      const promise = readContract({
        contract: contract,
        method: resolveMethod("ownerOf"),
        params: [i]
      }).catch((err) => {
        if (err.message.includes('nonexistent token')) {
          nonexistentCount++;
        } else {
          console.error(`Error fetching owner of token ${i}:`, err);
        }
        return null;
      });
      promises.push(promise);
    }
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      const nftId = start + index;
      if (
        result.status === "fulfilled" &&
        typeof result.value === "string" &&
        result.value !== "0x000000000000000000000000000000000000dEaD"
      ) {
        ownedIds.push(nftId);
        uniqueOwnersSet.add(result.value);
      }
    });
  };

  for (let i = 0; i < totalIds; i += batchSize) {
    await fetchBatch(i, Math.min(i + batchSize, totalIds));
  }

  console.log(`Fetched data for contract: ${contract.address}, ownedIds: ${ownedIds.length}, uniqueOwners: ${uniqueOwnersSet.size}`);

  return {
    totalSupply: totalIds,
    validTotalSupply: ownedIds.length,
    uniqueOwners: uniqueOwnersSet.size,
    chainId: 4689,
  };
};
