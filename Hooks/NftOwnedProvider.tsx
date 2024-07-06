"use client";

import React, { createContext, useContext, useEffect, ReactNode, useState, useCallback, useRef } from 'react';
import {  WebStreamContract, MachinFiContract, MimoAlbieContract, MimoBimbyContract, MimoGizyContract, MimoPipiContract, MimoSpaceContract, LoxodromeContract, SumoContractContract, XSumoContract, RobotAiContract, BuzzBotsContract, SpunksContract, NFT_COLLECTION, AppMint, IotexPunksContract } from '../const/contracts';
import { NFT as NFTType, ThirdwebContract } from "thirdweb";
import { useActiveAccount, MediaRenderer, useReadContract } from "thirdweb/react";
import { tokensOfOwner } from 'thirdweb/extensions/erc721';
import toast from "react-hot-toast";
import toastStyle from "@/util/toastConfig";
import { readContract, resolveMethod } from "thirdweb";
import { getOwnedNFTs } from "thirdweb/extensions/erc721";

type UserContextType = {
  ownedNfts3: { [key: string]: number[] };

    ownedNfts2: { [key: string]: number[] };
    ownedNfts: { [key: string]: string[] };
    UniqueWallets: { [key: string]: { uniqueWallets: string[], totalSupply: number } };
    signerAddress: string | undefined;
};

const contracts = {
    WebStream: "0x8aa9271665e480f0866d2f61fc436b96bf9584ad",
    MimoFrenzyTribePippi: "0xe1bb99ed442ce6c6ad3806c3afcbd8f7733841a7",
    MimoFrenzyTribeBimby: "0xaa5314f9ee6a6711e5284508fec7f40e85969ed6",
    MimoFrenzyTribeGizy: "0x0689021f9065b18c710f5204e41b3d20c3b7d362",
    MimoFrenzyTribeAlbie: "0x8cfe8baee219514be529407207fce9c612e705fd",
    TheMimoSpaceshipNFT: "0x778E131aA8260C1FF78007cAde5e64820744F320",
};

const contracts2 = {
    xSumo: "0x7d150d3eb3ad7ab752df259c94a8ab98d700fc00",
    Sumo: "0x9756e951dd76e933e34434db4ed38964951e588b",
    Loxodrome: "0x7f8cb1d827f26434da652b4e9bd02c698cc2842a",
    BuzzBots: "0xdfbbeba6d17b0d49861ab7f26cda495046314370",
    RobotAi: "0xaf1b5063a152550aebc8d6cb0da6936288eab3dc",
    Spunks: "0xc52121470851d0cba233c963fcbb23f753eb8709",
    MachinFi: "0x0c5AB026d74C451376A4798342a685a0e99a5bEe",
    AppMint: "0x0c5AB026d74C451376A4798342a685a0e99a5bEe",
    IotexPunksContract: "0xce300b00aa9c066786D609Fc96529DBedAa30B76",
};

interface Owner {
    tokenId: number;
    owner: string;
}

// Create a context
const NftContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode;
}

export const NftProvider: React.FC<UserProviderProps> = ({ children }) => {
    const account = useActiveAccount();

    const isMounted = useRef(true);
    const [signerAddress, setSignerAddress] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [ownedTokenIds, setOwnedTokenIds] = useState<readonly bigint[]>([]);
    const [selectedNft, setSelectedNft] = useState<NFTType>();
    const [ownedNfts3, setOwnedNfts3] = useState<{ [key: string]: number[] }>({});

    const [ownedNfts, setOwnedNfts] = useState<{ [key: string]: string[] }>({});
        const [ownedNfts2, setOwnedNfts2] = useState<{ [key: string]: number[] }>({});
    const [UniqueWallets, setUniqueWalletes] = useState<{ [key: string]: { uniqueWallets: string[], totalSupply: number } }>({});

    const fetchOwnedNfts = useCallback(async (contractAddress: string, contract: ThirdwebContract) => {
      if (!account) return;
      setLoading(true);

      try {

          const ownedNFTs = await getOwnedNFTs({
              contract,
              owner: account?.address,
          });


          const ids = ownedNFTs.map(nft => Number(nft.id));

          setOwnedNfts2(prevState => {
              const updatedNfts = { ...prevState, [contractAddress]: ids };
              return updatedNfts;
          });
          setOwnedNfts3(prevState => {
            const updatedNfts = { ...prevState, [contractAddress]: ids };
            return updatedNfts;
        });
      } catch (err) {
          toast.error(
              "Something went wrong while fetching your NFTs!",
              {
                  position: "bottom-center",
                  style: toastStyle,
              }
          );
      } finally {
          setLoading(false);
      }
  }, [account]);
      
    const fetchOwnedNfts2 = useCallback(async (
        signerAddress: string | undefined,
        contract: ThirdwebContract,
        contractAddress: string,
        totalIds: number,
        batchSize: number,
        newFetch: number
      ) => {
        if (!contract || !signerAddress) return;
      
        const ownedIds: number[] = [];
      
        const fetchBatch = async (start: number, end: number) => {
          const promises = [];
          for (let i = start; i < end; i++) {
            const promise = readContract({
              contract,
              method: resolveMethod("ownerOf"),
              params: [i]
            }).catch(error => {
              return null;
            }) as unknown as Promise<string>;
            promises.push(promise);
          }
      
          const results = await Promise.allSettled(promises);
      
          results.forEach((result, index) => {
            const nftId = start + index;
            if (result.status === 'fulfilled' && result.value) {
              const ownerAddress = (result.value as string).toLowerCase();
              if (ownerAddress === signerAddress.toLowerCase()) {
                ownedIds.push(nftId);
              }
            } else if (result.status === 'rejected') {
            }
          });
        };
      
        try {
          for (let i = 0; i < totalIds; i += batchSize) {
            await fetchBatch(i, Math.min(i + batchSize, totalIds));
            if (i + batchSize >= newFetch) {
              break;
            }
          }
        } finally {
          setOwnedNfts2((prevState) => {
            const updatedNfts2 = { ...prevState, [contractAddress]: ownedIds };
            return updatedNfts2;
          });
          setOwnedNfts3((prevState) => {
            const updatedNfts2 = { ...prevState, [contractAddress]: ownedIds };
            return updatedNfts2;
          });
      
        }
      }, []);

      const fetchOwnedNfts3 = useCallback(async (
        signerAddress: string | undefined,
        contract: ThirdwebContract,
        contractAddress: string,
        totalIds: number,
        batchSize: number,
        newFetch: number
      ) => {
        if (!contract || !signerAddress) return;
      
        const ownedIds: number[] = [];
      
        const fetchBatch = async (start: number, end: number) => {
          const promises = [];
          for (let i = start; i < end; i++) {
            const promise = readContract({
              contract,
              method: resolveMethod("ownerOf"),
              params: [i]
            }).catch(error => {
              return null;
            }) as unknown as Promise<string>;
            promises.push(promise);
          }
      
          const results = await Promise.allSettled(promises);
      
          results.forEach((result, index) => {
            const nftId = start + index;
            if (result.status === 'fulfilled' && result.value) {
              const ownerAddress = (result.value as string).toLowerCase();
              if (ownerAddress === signerAddress.toLowerCase()) {
                ownedIds.push(nftId);
              }
            } else if (result.status === 'rejected') {
            }
          });
        };
      
        try {
          for (let i = 0; i < totalIds; i += batchSize) {
            await fetchBatch(i, Math.min(i + batchSize, totalIds));
            if (i + batchSize >= newFetch) {
              break;
            }
          }
        } finally {
          
          setOwnedNfts3((prevState) => {
            const updatedNfts2 = { ...prevState, [contractAddress]: ownedIds };
            return updatedNfts2;
          });
      
        }
      }, []);

  
    useEffect(() => {
        if (account) {
          const signerAddress = account.address;
          fetchOwnedNfts3(signerAddress, AppMint, '0x9C023CD4E58466424B7f60B32004c6B9d5596140', 100, 50, 90)
                             
          fetchOwnedNfts2(signerAddress, WebStreamContract, '0x8aa9271665e480f0866d2F61FC436B96BF9584AD', 838, 150, 830)
          .then(() => fetchOwnedNfts2(signerAddress, MimoPipiContract, '0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7', 1000, 150, 990))
          .then(() => fetchOwnedNfts2(signerAddress, MimoAlbieContract, '0x8cfE8bAeE219514bE529407207fCe9C612E705fD', 946, 150, 930))


          fetchOwnedNfts2(signerAddress, MimoAlbieContract, '0x8cfE8bAeE219514bE529407207fCe9C612E705fD', 946, 150, 930)
         fetchOwnedNfts2(signerAddress, MimoBimbyContract, '0xaa5314f9ee6a6711e5284508fec7f40e85969ed6', 1000, 150, 990)
         .then(() => fetchOwnedNfts2(signerAddress, MimoGizyContract, '0x0689021f9065b18c710f5204e41b3d20c3b7d362', 1000, 150, 990))
         .then(() => fetchOwnedNfts2(signerAddress, MimoSpaceContract, '0x778E131aA8260C1FF78007cAde5e64820744F320', 189, 150, 190))
         
            .catch((error) => {
              toast.error(
                "Something went wrong while fetching your NFTs!",
                {
                  position: "bottom-center",
                  style: toastStyle,
                }
              );
            });
        }
      }, [account]);
   
      
     
      
        useEffect(() => {
          if (account) {
              setSignerAddress(account.address);

              fetchOwnedNfts("0x0c5AB026d74C451376A4798342a685a0e99a5bEe", MachinFiContract);
              fetchOwnedNfts("0x9756e951dd76e933e34434db4ed38964951e588b", SumoContractContract);
              fetchOwnedNfts("0x7d150d3eb3ad7ab752df259c94a8ab98d700fc00", XSumoContract);
              fetchOwnedNfts("0x7f8cb1d827f26434da652b4e9bd02c698cc2842a", LoxodromeContract);
              fetchOwnedNfts("0xdfbbeba6d17b0d49861ab7f26cda495046314370", BuzzBotsContract);
              fetchOwnedNfts("0xaf1b5063a152550aebc8d6cb0da6936288eab3dc", RobotAiContract);             
              fetchOwnedNfts("0xc52121470851d0cba233c963fcbb23f753eb8709", SpunksContract);
              fetchOwnedNfts("0xce300b00aa9c066786D609Fc96529DBedAa30B76", IotexPunksContract);


          }
      }, [account, fetchOwnedNfts]);

     

    useEffect(() => {
        if (account) {
            setSignerAddress(account.address);
        }
    }, [account]);

    return (
        <NftContext.Provider value={{
            ownedNfts3,
            ownedNfts2,

            ownedNfts,
            UniqueWallets,
            signerAddress,
        }}>
            {children}
        </NftContext.Provider>
    );
};

export const useNfts = (): UserContextType => {
    const context = useContext(NftContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
