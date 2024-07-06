import { Chain } from "thirdweb";
import { NETWORK } from "./contracts";

export type NftContract = {
    address: string;
    chain: Chain;
    type: "ERC1155" | "ERC721";
  
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    explorer?: string;
    slug?: string;
    twitter?: string;
    telegram?: string;
    website?: string;
    discord?: string;

  };

export const NFT_CONTRACTS: NftContract[] = [
  {
    address: "0x0c5AB026d74C451376A4798342a685a0e99a5bEe",
    chain: NETWORK,
    title: "MachinFi - NFT",
    description: "MachinFi Nfts was released from the Iotex foundation to eneble there holders to capture the Value from the fast growing machnie econmy.",
    thumbnailUrl: "ipfs://QmdLtnJRPzSFNpeZSfCSbh7YEDyyJniokRYtZwdRvfESak/Schermafbeelding%202024-06-14%20153107.png", 
    explorer: "https://iotexscan.io/token-nft/0x0c5AB026d74C451376A4798342a685a0e99a5bEe#token_transfer", 
    type: "ERC721",
    twitter: "",
    telegram: "",
    website: "https://machinefi.com/",
    discord: "https://discord.gg/y86QzuKK",


    },
    {
      address: "0x8aa9271665e480f0866d2F61FC436B96BF9584AD",
      chain: NETWORK,
      title: "Introducing W3bstream Devnet",
      description: "Introducing W3bstream Devnet, the open, decentralized infrastructure for computing and streaming of device data to power verifiable, dApp-ready cryptographic proofs to tokenize real-world.\n\nWe are excited to celebrate this milestone with the community.",
      thumbnailUrl: "https://nft.iotex.io/tokens/w3bstream/dev_launch/image.gif", 
      explorer: "https://iotexscan.io/token-nft/0x8aa9271665e480f0866d2F61FC436B96BF9584AD#token_transfer", 
      type: "ERC721",
      twitter: "https://twitter.com/w3bstream_com",
      telegram: "",
      website: "https://w3bstream.com/",
      discord: "https://discord.gg/y86QzuKK",

    },
    {
      address: "0xc52121470851d0cba233c963fcbb23f753eb8709",
      chain: NETWORK,
      title: "Spunks",
      description: "The Shibapunks NFT Collection represents our exceptional art collection comprising 777 SPUNKS, each uniquely generated through a combination of 9 traits and 96 variants, including some extremely rare variations. While primarily an art collection, the team constantly explore new avenues to enhance their utility.",
      thumbnailUrl: "https://bafybeidu4jj6oespolm2gkclqbxgg3apvqqdkpmbuoaflov7uo5bztco5y.ipfs.w3s.link/45.png",
      explorer: "https://iotexscan.io/token-nft/0xc52121470851d0cba233c963fcbb23f753eb8709#token_transfer", 
      type: "ERC721",
      twitter: "",
      telegram: "https://t.me/iotexshiba",
      website: "https://www.iotexshiba.io/",
      discord: "https://discord.gg/4aPEgHJ3",
    },
    {
      address: "0xce300b00aa9c066786D609Fc96529DBedAa30B76",
      chain: NETWORK,
      title: "IotexPunks",
      description: "IOTEXPUNKS is a collection of 10,000 amazing $IOTX themed art collectibles with different attributes and styles decentralized on IOTEX Blockchain. You can mint an original NFT until all are collected.",
      thumbnailUrl: "ipfs://QmbEE5iXQ3h1WBdCdgp4ojYj3B4S47Di6ANCcmv9PJFkGB",
      explorer: "https://iotexscan.io/token-nft/0xce300b00aa9c066786D609Fc96529DBedAa30B76#token_transfer", 
      type: "ERC721",
      twitter: "https://x.com/iotexpunks",
      telegram: "",
      website: "https://iotexpunks.com/#/",
      discord:"https://discord.gg/RYDVAWgK", 

    },
    {
      address: "0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7",
      chain: NETWORK,
      title: "Mimo Frenzy Tribe - Pippi",
      description: "The Mimo Frenzy Tribe collection was released from Mimo during there NFT MarketPlace Launch.",
      thumbnailUrl: "https://nft.iotex.io/tokens/mimo/frenzy_tribe_pippi/image.jpg",
      explorer: "https://iotexscan.io/token-nft/0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7#token_transfer", 
      type: "ERC721",
      twitter: "https://twitter.com/mimoprotocol",
      telegram: "https://t.me/s/mimoprotocol?before=24",
      website: "https://mimo.finance/",
      discord: "",

    },
    
    {
      address: "0xaa5314f9ee6a6711e5284508fec7f40e85969ed6",
      chain: NETWORK,
      title: "Mimo Frenzy Tribe - Bimby",
      description: "The Mimo Frenzy Tribe collection was released from Mimo during there NFT MarketPlace Launch",
      thumbnailUrl: "https://nft.iotex.io/tokens/mimo/frenzy_tribe_bimby/image.jpg", 
      explorer: "https://iotexscan.io/token-nft/0xaa5314f9ee6a6711e5284508fec7f40e85969ed6#token_transfer", 
      type: "ERC721",
      twitter: "https://twitter.com/mimoprotocol",
      telegram: "https://t.me/s/mimoprotocol?before=24",
      website: "https://mimo.finance/",
      discord: "",

    },
    {
      address: "0x0689021f9065b18c710f5204e41b3d20c3b7d362",
      chain: NETWORK,
      title: "Mimo Frenzy Tribe - Gizy",
      description: "The Mimo Frenzy Tribe collection was released from Mimo during there NFT MarketPlace Launch",
      thumbnailUrl: "https://nft.iotex.io/tokens/mimo/frenzy_tribe_gizzy/image.jpeg", 
      explorer: "https://iotexscan.io/token-nft/0x0689021f9065b18c710f5204e41b3d20c3b7d362#token_transfer", 
      type: "ERC721",
      twitter: "https://twitter.com/mimoprotocol",
      telegram: "https://t.me/s/mimoprotocol?before=24",
      website: "https://mimo.finance/",
      discord: "",

    },
    {
      address: "0x8cfE8bAeE219514bE529407207fCe9C612E705fD",
      chain: NETWORK,
      title: "Mimo Frenzy Tribe - Albie",
      description: "The Mimo Frenzy Tribe collection was released from Mimo during there NFT MarketPlace Launch",
      thumbnailUrl: "https://nft.iotex.io/tokens/mimo/frenzy_tribe_albie/image.png", 
      explorer: "https://iotexscan.io/token-nft/0x8cfE8bAeE219514bE529407207fCe9C612E705fD#token_transfer", 
      type: "ERC721",
      twitter: "https://twitter.com/mimoprotocol",
      telegram: "https://t.me/s/mimoprotocol?before=24",
      website: "https://mimo.finance/",
      discord: "",

    },
    {
      address: "0x778E131aA8260C1FF78007cAde5e64820744F320",
      chain: NETWORK,
      title: "The Mimo Spaceship NFT",
      description: "The Mimo Spaceship NFT with MgLand",
      thumbnailUrl: "https://dist.mg.land/nft/spaceship/mimo/base.png", 
      explorer: "https://iotexscan.io/token-nft/0x778E131aA8260C1FF78007cAde5e64820744F320#token_transfer", 
      type: "ERC721",
      twitter: "https://twitter.com/mimoprotocol",
      telegram: "https://t.me/s/mimoprotocol?before=24",
      website: "https://mimo.finance/",
      discord: "",

    },
    {
      address: "0x7D150D3eb3aD7aB752dF259c94A8aB98d700FC00",
      chain: NETWORK,
      title: "XSumo",
      description: "Originally a Level 2 Tokenization Platform on the Ethereum blockchain specializing in Real-World Assets (RWA), evolving with cybersecurity expertise to become the future of secure, hybrid blockchain solutions for private asset tokenization and public data transparency.",
      thumbnailUrl: "ipfs://QmcLA9kbjx4uezkYdwMXaCWFiTc76XtqJcWxX2RAyVhjES/5_X-Sumo.png", 
      explorer: "https://iotexscan.io/token-nft/0x7d150d3eb3ad7ab752df259c94a8ab98d700fc00#token_transfer", 
      type: "ERC721",
      twitter: "https://twitter.com/SumoTex/",
      telegram: "https://t.me/SumoTex",
      website: "https://sumotex.co/",

    },
    {           
      address: "0x9756E951dd76e933e34434Db4Ed38964951E588b",
      chain: NETWORK,
      title: "SumoTex",
      description: "Check this out",
      thumbnailUrl: "ipfs://QmXhVqBXvEVr9Ev1E6GyiTDUC78CcMsZx1FVZq1KieQu85/21.png", 
      explorer: "https://iotexscan.io/token-nft/0x9756e951dd76e933e34434db4ed38964951e588b#token_transfer", 
      type: "ERC721",
      twitter: "https://twitter.com/SumoTex/",
      telegram: "https://t.me/SumoTex",
      website: "https://sumotex.co/",

    },
    {
      address: "0x7f8Cb1d827F26434da652b4e9bd02c698cc2842a",
      chain: NETWORK,
      title: "Loxodrome",
      description: "LoxoNFT is your key to Loxodrome’s community, governance, rewards and passive income.",
      thumbnailUrl: "https://bafybeib5mrukb45jhuvnciyz6oxyqfp54bargisv7yoeacrg6xumcoqayi.ipfs.nftstorage.link/", 
      explorer: "https://iotexscan.io/token-nft/0x7f8cb1d827f26434da652b4e9bd02c698cc2842a#token_transfer", 
      type: "ERC721",
      twitter: "https://twitter.com/_Loxodrome",
      telegram: "https://t.me/loxodrome_xyz",
      website: "https://www.loxodrome.xyz/",
      discord: "https://discord.gg/Cm9QMa4y",

    },
    {
      address: "0xDFBbEbA6D17b0d49861aB7f26CdA495046314370",
      chain: NETWORK,
      title: "Buzz Bots",
      description: "Buzz Bots depicts a group of robots from the future trapped in the year 2023.",
      thumbnailUrl: "https://bafybeia6g6wil2nadtcvtbcqddowkzkkynh4uf4mj5caylekto4qsx435u.ipfs.w3s.link/2.png",
      explorer: "https://iotexscan.io/token-nft/0xdfbbeba6d17b0d49861ab7f26cda495046314370#token_transfer", 
      type: "ERC721",
      twitter: "",
      telegram: "",
      website: "",
      discord: "",

    },
    {
      address: "0xAf1B5063A152550aebc8d6cB0dA6936288EAb3dc",
      chain: NETWORK,
      title: "Robot Ai",
      description: "Check this out",
      thumbnailUrl: "https://www.0xrobot.ai/nft/R.jpg", 
      explorer: "https://iotexscan.io/token-nft/0xaf1b5063a152550aebc8d6cb0da6936288eab3dc#token_transfer", 
      type: "ERC721",
      twitter: "",
      telegram: "",
      website: "",
      discord: "",

    },
    

  ];
  