import client from "@/lib/client";
import { getContract, defineChain } from "thirdweb";

export const NETWORK = defineChain(4689);

export const contracts = {
  WebStreamContract: "0x8aa9271665e480f0866d2F61FC436B96BF9584AD",
  MimoPipiContract: "0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7",
  MimoBimbyContract: "0xaa5314f9ee6a6711e5284508fec7f40e85969ed6",
  MimoGizyContract: "0x0689021f9065b18c710f5204e41b3d20c3b7d362",
  MimoAlbieContract: "0x8cfE8bAeE219514bE529407207fCe9C612E705fD",
  MimoSpaceContract: "0x778E131aA8260C1FF78007cAde5e64820744F320",
  XSumoContract: "0x7d150d3eb3ad7ab752df259c94a8ab98d700fc00",
  SumoContractContract: "0x9756e951dd76e933e34434db4ed38964951e588b",
  LoxodromeContract: "0x7f8cb1d827f26434da652b4e9bd02c698cc2842a",
  BuzzBotsContract: "0xdfbbeba6d17b0d49861ab7f26cda495046314370",
  RobotAiContract: "0xaf1b5063a152550aebc8d6cb0da6936288eab3dc",
  SpunksContract: "0xc52121470851d0cba233c963fcbb23f753eb8709",
  MachinFiContract: "0x0c5AB026d74C451376A4798342a685a0e99a5bEe",
};

export const getContractInstance = (address: string, Chain: number) => {
    const NETWORK = defineChain(Chain); // Use chainIdNumber here

    console.log(`Creating contract instance for address: "${address}"`);
  return getContract({
    address: address,
    client,
    chain: NETWORK,
  });
};