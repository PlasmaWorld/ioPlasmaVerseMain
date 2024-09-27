import { Chain } from "thirdweb";
import { NETWORK } from "./contracts";

type SocialUrls = {
  x?: string;
  telegram?: string;
  website?: string;
  discord?: string;
  github?: string;
};

export type NftContract = {
  address: string;
  chain: Chain;
  chainId: number;
  type: "ERC1155" | "ERC721" | "Marketplace"; 
  typeBase: "DefaultNFT";


  title?: string;
  description?: string;
  thumbnailUrl?: string;
  explorer?: string;
  slug?: string;
  blockHeight: any;
  apiSaveData:string;
  apiGetData:string
  social_urls?: SocialUrls;
};

export const NFT_CONTRACTS: NftContract[] = [
  {
    address: "0x0c5AB026d74C451376A4798342a685a0e99a5bEe",
    chain: NETWORK,
    chainId: 4689,
    title: "MachinFi - NFT",
    description: "MachinFi Nfts was released from the Iotex foundation to enable their holders to capture the Value from the fast growing machine economy.",
    thumbnailUrl: "ipfs://QmdLtnJRPzSFNpeZSfCSbh7YEDyyJniokRYtZwdRvfESak/Schermafbeelding%202024-06-14%20153107.png",
    explorer: "https://iotexscan.io/token-nft/0x0c5AB026d74C451376A4798342a685a0e99a5bEe#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 14353090n,
    apiSaveData: "saveMachinFiEvents",
    apiGetData: "getMachinFiEvents",
    social_urls: {
      x: "",
      telegram: "",
      website: "https://machinefi.com/",
      discord: "https://discord.gg/y86QzuKK",
    },
  },
  {
    address: "0x8aa9271665e480f0866d2F61FC436B96BF9584AD",
    chain: NETWORK,
    chainId: 4689,
    title: "Introducing W3bstream Devnet",
    description: "Introducing W3bstream Devnet, the open, decentralized infrastructure for computing and streaming of device data to power verifiable, dApp-ready cryptographic proofs to tokenize real-world.\n\nWe are excited to celebrate this milestone with the community.",
    thumbnailUrl: "https://nft.iotex.io/tokens/w3bstream/dev_launch/image.gif",
    explorer: "https://iotexscan.io/token-nft/0x8aa9271665e480f0866d2F61FC436B96BF9584AD#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 24093201n,
    apiSaveData: "saveWebStreamEvents",
    apiGetData: "getWebStreamEvents",
    social_urls: {
      x: "https://twitter.com/w3bstream_com",
      telegram: "",
      website: "https://w3bstream.com/",
      discord: "https://discord.gg/y86QzuKK",
    },
  },
  {
    address: "0xc52121470851d0cba233c963fcbb23f753eb8709",
    chain: NETWORK,
    chainId: 4689,
    title: "Spunks",
    description: "The Shibapunks NFT Collection represents our exceptional art collection comprising 777 SPUNKS, each uniquely generated through a combination of 9 traits and 96 variants, including some extremely rare variations. While primarily an art collection, the team constantly explore new avenues to enhance their utility.",
    thumbnailUrl: "https://bafybeidu4jj6oespolm2gkclqbxgg3apvqqdkpmbuoaflov7uo5bztco5y.ipfs.w3s.link/45.png",
    explorer: "https://iotexscan.io/token-nft/0xc52121470851d0cba233c963fcbb23f753eb8709#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 24006928n,
    apiSaveData: "saveShibaEvents",
    apiGetData: "getShibaEvents",
    social_urls: {
      x: "",
      telegram: "https://t.me/iotexshiba",
      website: "https://www.iotexshiba.io/",
      discord: "https://discord.gg/4aPEgHJ3",
    },
  },
  {
    address: "0xce300b00aa9c066786D609Fc96529DBedAa30B76",
    chain: NETWORK,
    chainId: 4689,
    title: "IotexPunks",
    description: "IOTEXPUNKS is a collection of 10,000 amazing $IOTX themed art collectibles with different attributes and styles decentralized on IOTEX Blockchain. You can mint an original NFT until all are collected.",
    thumbnailUrl: "ipfs://QmbEE5iXQ3h1WBdCdgp4ojYj3B4S47Di6ANCcmv9PJFkGB",
    explorer: "https://iotexscan.io/token-nft/0xce300b00aa9c066786D609Fc96529DBedAa30B76#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 13499421n,
    apiSaveData: "savePunksEvents",
    apiGetData: "getPunksEvents",


    social_urls: {
      x: "https://x.com/iotexpunks",
      telegram: "",
      website: "https://iotexpunks.com/#/",
      discord: "https://discord.gg/RYDVAWgK",
    },
  },
  {
    address: "0x3acd87176676e9b93f823e5e5e1d3069171c985d",
    chain: NETWORK,
    chainId: 4689,
    title: "PowerPod-Mamotor",
    description: "",
    thumbnailUrl: "ipfs://QmfSUUm2iqQWVvtPApbpbemM9uVx4i1dA5kC9DAAwUvcsv",
    explorer: "https://iotexscan.io/token-nft/0x3acd87176676e9b93f823e5e5e1d3069171c985d#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 13499421n,
    apiSaveData: "savePunksEvents",
    apiGetData: "getPunksEvents",


    social_urls: {
      x: "",
      telegram: "",
      website: "",
      discord: "",
    },
  },
  {
    address: "0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7",
    chain: NETWORK,
    chainId: 4689,
    title: "Mimo Frenzy Tribe - Pippi",
    description: "The Mimo Frenzy Tribe collection was released from Mimo during there NFT MarketPlace Launch.",
    thumbnailUrl: "https://nft.iotex.io/tokens/mimo/frenzy_tribe_pippi/image.jpg",
    explorer: "https://iotexscan.io/token-nft/0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 23224919n,
    apiSaveData: "saveMimoPippiEvents",
    apiGetData: "getMimoPippiEvents",
    social_urls: {
      x: "https://twitter.com/mimoprotocol",
      telegram: "https://t.me/s/mimoprotocol?before=24",
      website: "https://mimo.finance/",
      discord: "",
    },
  },
  {
    address: "0xaa5314f9ee6a6711e5284508fec7f40e85969ed6",
    chain: NETWORK,
    chainId: 4689,
    title: "Mimo Frenzy Tribe - Bimby",
    description: "The Mimo Frenzy Tribe collection was released from Mimo during there NFT MarketPlace Launch",
    thumbnailUrl: "https://nft.iotex.io/tokens/mimo/frenzy_tribe_bimby/image.jpg",
    explorer: "https://iotexscan.io/token-nft/0xaa5314f9ee6a6711e5284508fec7f40e85969ed6#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 23395349n,
    apiSaveData: "saveMimoBimbyEvents",
    apiGetData: "getMimoBimbyEvents",
    social_urls: {
      x: "https://twitter.com/mimoprotocol",
      telegram: "https://t.me/s/mimoprotocol?before=24",
      website: "https://mimo.finance/",
      discord: "",
    },
  },
  {
    address: "0x0689021f9065b18c710f5204e41b3d20c3b7d362",
    chain: NETWORK,
    chainId: 4689,
    title: "Mimo Frenzy Tribe - Gizy",
    description: "The Mimo Frenzy Tribe collection was released from Mimo during there NFT MarketPlace Launch",
    thumbnailUrl: "https://nft.iotex.io/tokens/mimo/frenzy_tribe_gizzy/image.jpeg",
    explorer: "https://iotexscan.io/token-nft/0x0689021f9065b18c710f5204e41b3d20c3b7d362#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 24413148n,
    apiSaveData: "saveMimoGizyEvents",
    apiGetData: "getMimoGizyEvents",

    social_urls: {
      x: "https://twitter.com/mimoprotocol",
      telegram: "https://t.me/s/mimoprotocol?before=24",
      website: "https://mimo.finance/",
      discord: "",
    },
  },
  {
    address: "0x8cfE8bAeE219514bE529407207fCe9C612E705fD",
    chain: NETWORK,
    chainId: 4689,
    title: "Mimo Frenzy Tribe - Albie",
    description: "The Mimo Frenzy Tribe collection was released from Mimo during there NFT MarketPlace Launch",
    thumbnailUrl: "https://nft.iotex.io/tokens/mimo/frenzy_tribe_albie/image.png",
    explorer: "https://iotexscan.io/token-nft/0x8cfE8bAeE219514bE529407207fCe9C612E705fD#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 23757855n, 
    apiSaveData: "saveMimoAlbieEvents",
    apiGetData: "getMimoAlbieEvents",
    social_urls: {
      x: "https://twitter.com/mimoprotocol",
      telegram: "https://t.me/s/mimoprotocol?before=24",
      website: "https://mimo.finance/",
      discord: "",
    },
  },
  {
    address: "0x778E131aA8260C1FF78007cAde5e64820744F320",
    chain: NETWORK,
    chainId: 4689,
    title: "The Mimo Spaceship NFT",
    description: "The Mimo Spaceship NFT with MgLand",
    thumbnailUrl: "https://dist.mg.land/nft/spaceship/mimo/base.png",
    explorer: "https://iotexscan.io/token-nft/0x778E131aA8260C1FF78007cAde5e64820744F320#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 24720908n, 
    apiSaveData: "saveMimoSpaceEvents",
    apiGetData: "getMimoSpaceEvents",

     social_urls: {
      x: "https://twitter.com/mimoprotocol",
      telegram: "https://t.me/s/mimoprotocol?before=24",
      website: "https://mimo.finance/",
      discord: "",
    },
  },
  {
    address: "0x7D150D3eb3aD7aB752dF259c94A8aB98d700FC00",
    chain: NETWORK,
    chainId: 4689,
    title: "XSumo",
    description: "Originally a Level 2 Tokenization Platform on the Ethereum blockchain specializing in Real-World Assets (RWA), evolving with cybersecurity expertise to become the future of secure, hybrid blockchain solutions for private asset tokenization and public data transparency.",
    thumbnailUrl: "ipfs://QmcLA9kbjx4uezkYdwMXaCWFiTc76XtqJcWxX2RAyVhjES/5_X-Sumo.png",
    explorer: "https://iotexscan.io/token-nft/0x7d150d3eb3ad7ab752df259c94a8ab98d700fc00#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 17413593n, 
    apiSaveData: "saveXSumoEvents",
    apiGetData: "getXSumoEvents",

    social_urls: {
      x: "https://twitter.com/SumoTex/",
      telegram: "https://t.me/SumoTex",
      website: "https://sumotex.co/",
    },
  },
  {
    address: "0x9756E951dd76e933e34434Db4Ed38964951E588b",
    chain: NETWORK,
    chainId: 4689,
    title: "SumoTex",
    description: "Check this out",
    thumbnailUrl: "ipfs://QmXhVqBXvEVr9Ev1E6GyiTDUC78CcMsZx1FVZq1KieQu85/21.png",
    explorer: "https://iotexscan.io/token-nft/0x9756e951dd76e933e34434db4ed38964951e588b#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 16039076n,
    apiSaveData: "saveSumoEvents",
    apiGetData: "getSumoEvents",

    social_urls: {
      x: "https://twitter.com/SumoTex/",
      telegram: "https://t.me/SumoTex",
      website: "https://sumotex.co/",
      discord: "",
    },
  },
  {
    address: "0x7f8Cb1d827F26434da652b4e9bd02c698cc2842a",
    chain: NETWORK,
    chainId: 4689,
    title: "Loxodrome",
    description: "LoxoNFT is your key to Loxodrome’s community, governance, rewards and passive income.",
    thumbnailUrl: "https://bafybeib5mrukb45jhuvnciyz6oxyqfp54bargisv7yoeacrg6xumcoqayi.ipfs.nftstorage.link/",
    explorer: "https://iotexscan.io/token-nft/0x7f8cb1d827f26434da652b4e9bd02c698cc2842a#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 28813774n, 
    apiSaveData: "saveLoxodromeEvents",
    apiGetData: "getLoxodromeEvents",
      social_urls: {
      x: "https://twitter.com/_Loxodrome",
      telegram: "https://t.me/loxodrome_xyz",
      website: "https://www.loxodrome.xyz/",
      discord: "https://discord.gg/Cm9QMa4y",
    },
  },
  {
    address: "0xDFBbEbA6D17b0d49861aB7f26CdA495046314370",
    chain: NETWORK,
    chainId: 4689,
    title: "Buzz Bots",
    description: "Buzz Bots depicts a group of robots from the future trapped in the year 2023.",
    thumbnailUrl: "https://bafybeia6g6wil2nadtcvtbcqddowkzkkynh4uf4mj5caylekto4qsx435u.ipfs.w3s.link/2.png",
    explorer: "https://iotexscan.io/token-nft/0xdfbbeba6d17b0d49861ab7f26cda495046314370#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 25526490n, 
    apiSaveData: "saveBuzzBotsEvents",
    apiGetData: "getBuzzBotsEvents",
    social_urls: {
      x: "",
      telegram: "",
      website: "",
      discord: "",
    },
  },
  {
    address: "0xAf1B5063A152550aebc8d6cB0dA6936288EAb3dc",
    chain: NETWORK,
    chainId: 4689,
    title: "Robot Ai",
    description: "Check this out",
    thumbnailUrl: "https://www.0xrobot.ai/nft/R.jpg",
    explorer: "https://iotexscan.io/token-nft/0xaf1b5063a152550aebc8d6cb0da6936288eab3dc#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 29131002n, 
    apiSaveData: "saveRobotAiEvents",
    apiGetData: "getRobotAiEvents",

    social_urls: {
      x: "",
      telegram: "",
      website: "",
      discord: "",
    },
  },
  {
    address: "0x7f37290ea2d4b25dc92869ad127c38db273df8ee",
    chain: NETWORK,
    chainId: 4689,
    title: "Galxe & IoTeX Co-Brand NFT",
    description: "",
    thumbnailUrl: "https://nft.iotex.io/tokens/galxe/image.jpeg",
    explorer: "https://iotexscan.io/token-nft/0x7f37290ea2d4b25dc92869ad127c38db273df8ee#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 13499421n,
    apiSaveData: "savePunksEvents",
    apiGetData: "getPunksEvents",


    social_urls: {
      x: "",
      telegram: "",
      website: "",
      discord: "",
    },
  },
  {
    address: "0x50b39041d55e7a1f24e9013916f894255cdfca8b",
    chain: NETWORK,
    chainId: 4689,
    title: "Galxe - Goat Card - Tier 3",
    description: "",
    thumbnailUrl: "https://cdn.galxe.com/galaxy/iotex/aafbc776-1f4d-42f6-b2ce-76aece967633.jpeg",
    explorer: "https://iotexscan.io/token-nft/0x50b39041d55e7a1f24e9013916f894255cdfca8b#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 13499421n,
    apiSaveData: "savePunksEvents",
    apiGetData: "getPunksEvents",


    social_urls: {
      x: "",
      telegram: "",
      website: "",
      discord: "",
    },
  },
  {
    address: "0xd40171fa36990a81eb528e10a151b492b0df55a4",
    chain: NETWORK,
    chainId: 4689,
    title: "Galxe - Goat Card - Tier 2",
    description: "",
    thumbnailUrl: "https://cdn.galxe.com/galaxy/iotex/3d01d976-168b-4d4e-96fd-d6ef5dfd06f3.jpeg",
    explorer: "https://iotexscan.io/token-nft/0xd40171fa36990a81eb528e10a151b492b0df55a4#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 13499421n,
    apiSaveData: "savePunksEvents",
    apiGetData: "getPunksEvents",


    social_urls: {
      x: "",
      telegram: "",
      website: "",
      discord: "",
    },
  },

  {
    address: "0x8ffcd1b97639d0be0f9ec18e97cec1ab03a8bb10",
    chain: NETWORK,
    chainId: 4689,
    title: "Galxe - Goat Card - Tier 1",
    description: "",
    thumbnailUrl: "https://cdn.galxe.com/galaxy/iotex/ac360ac4-992b-4654-a2d5-43ca39a84484.jpeg",
    explorer: "https://iotexscan.io/token-nft/0x8ffcd1b97639d0be0f9ec18e97cec1ab03a8bb10#token_transfer",
    type: "ERC721",
    typeBase:"DefaultNFT",
    blockHeight: 13499421n,
    apiSaveData: "savePunksEvents",
    apiGetData: "getPunksEvents",


    social_urls: {
      x: "",
      telegram: "",
      website: "",
      discord: "",
    },
  },
];


export const MARKETPLACE_CONTRACTS: NftContract[] = [
  {
    address: "0x8c9413291fc98bf9556d0fb3a9a052164e37aec2",
    chain: NETWORK,
    chainId: 4689,
    title: "IotexPunksMarketplace",
    description: "IOTEXPUNKS is a collection of 10,000 amazing $IOTX themed art collectibles with different attributes and styles decentralized on IOTEX Blockchain. You can mint an original NFT until all are collected.",
    thumbnailUrl: "ipfs://QmbEE5iXQ3h1WBdCdgp4ojYj3B4S47Di6ANCcmv9PJFkGB",
    explorer: "https://iotexscan.io/token-nft/0xce300b00aa9c066786D609Fc96529DBedAa30B76#token_transfer",
    type: "Marketplace",
    typeBase:"DefaultNFT",
    blockHeight: 13499421n,
    apiSaveData: "savePunksMarketplaceEvents",
    apiGetData: "getPunksMarketplaceEventsEvents",
    social_urls: {
      x: "https://x.com/iotexpunks",
      telegram: "",
      website: "https://iotexpunks.com/#/",
      discord: "https://discord.gg/RYDVAWgK",
    },
  },
  {
    address: "0x7499e71ff8a472d1d82aa2e68e868b5b92896b0e",
    chain: NETWORK,
    chainId: 4689,
    title: "Mimo Marketplace",
    description: "The Mimo Frenzy Tribe collection was released from Mimo during there NFT MarketPlace Launch.",
    thumbnailUrl: "https://nft.iotex.io/tokens/mimo/frenzy_tribe_pippi/image.jpg",
    explorer: "https://iotexscan.io/token-nft/0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7#token_transfer",
    type: "Marketplace",
    typeBase:"DefaultNFT",
    blockHeight: 24241062n,
    apiSaveData: "saveMimoMarketPlaceEvents",
    apiGetData: "getMimoMarketPlaceEvents",

    social_urls: {
      x: "https://twitter.com/mimoprotocol",
      telegram: "https://t.me/s/mimoprotocol?before=24",
      website: "https://mimo.finance/",
      discord: "",
    },
  },
  

  
];
