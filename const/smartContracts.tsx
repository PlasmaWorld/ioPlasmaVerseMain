export type ContractInfo  = {
    contractAddress?: string;
    audited: boolean;
    version: string;
    name: string;
    description: string;
    type: string;
    typeBase: string;
    transaction: string;


  }
  
    export const contractData: ContractInfo[] = [
    // ERC721 Contracts
    {
      contractAddress: "0x8bA80068Ba7ba0462c3978eFd01c955064a591F0",
      audited: true,
      version: "v5.0.1",
      name: "NFT Drop",
      description: "Release collection of unique NFTs for a set price",
      type: "DropERC721",
      typeBase:"ERC721",
      transaction: "1",
    },
    {
      contractAddress: "0xfc2d10Fe84fb4d671b2a5c2E69bF8243B3252083",
      audited: true,
      version: "v5.0.1",
      name: "NFT Collection",
      description: "Create a collection of unique NFTs",
      type: "TokenERC721",
      typeBase:"ERC721",
      transaction: "1",
    },
    {
      contractAddress: "0x4f2573f80823b9ac1CD3fD15A7f0d8CeD2837400",
      audited: true,
      version: "v5.0.1",
      name: "Shared Metadata ERC721",
      description: "A shared metadata contract for Open Editions",
      type: "OpenEditionERC721",
      typeBase:"ERC721",
      transaction: "2",
    },
    
    // ERC1155 Contracts
    {
      contractAddress: "0x864281821E0037d5163b694DBFfCD0164d6F8e52",
      audited: true,
      version: "v5.0.1",
      name: "NFT Drop ERC1155",
      description: "A drop contract for ERC1155 NFTs",
      type: "DropERC1155",
      typeBase:"ERC1155",
      transaction: "1",

    },
    {
      contractAddress: "0x3521b7214af07aBA421F7fbAb95a1Bbc8226D0f7",
      audited: true,
      version: "v5.0.1",
      name: "NFT Collection ERC1155",
      description: "A standard ERC1155 contract for multi-token collections",
      type: "TokenERC1155",
      typeBase:"ERC1155",
      transaction: "2",


    },
    
    // ERC20 Contracts
    {
      contractAddress:"0x59E97bf693F05fa0ac4CAB91B01108C2871cF4ec",
      audited: true,
      version: "v5.0.1",
      name: "Token ERC20",
      description: "Deploy a standard ERC20 token contract",
      type: "TokenERC20",
      typeBase:"ERC20",
      transaction: "1",


    },
    {
      contractAddress: "0xdC2FEeDbfA551990bC6C7a6c36c0C7362ccc7909",
      audited: true,
      version: "v5.0.1",
      name: "ERC20 Drop",
      description: "A drop contract for ERC20 tokens",
      type: "DropERC20",
      typeBase:"ERC20",
      transaction: "2",

    },
  ];
  