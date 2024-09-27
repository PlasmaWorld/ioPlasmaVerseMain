import client from '@/lib/client';
import axios from 'axios';
import { defineChain, getContract, resolveMethod, readContract, ThirdwebContract } from "thirdweb";

interface ContractMetadata {
    name: string;
    description: string;
    image: string;
    seller_fee_basis_points: number;
    fee_recipient: string;
    merkle: object;
    symbol: string;
    social_urls: Record<string, string>;
}

export const fetchAndSaveContractDetails = async (contractAddress: string, chainId: number, deployer: string) => {
    const NETWORK = defineChain(chainId);

    const contract: ThirdwebContract = getContract({
        address: contractAddress,
        client: client, // Replace with your actual client instance
        chain: NETWORK,
    });

    // Helper function to read data from the contract
    const handleReadContract = async <T,>(methodName: string, params: any[] = []): Promise<T> => {
        try {
            const resolvedMethod = await resolveMethod(methodName);
            if (!resolvedMethod) {
                throw new Error("Failed to resolve method");
            }
            const result = await readContract({
                contract,
                method: resolvedMethod,
                params,
            });
            return result as T;
        } catch (error) {
            console.error(`Error reading contract for ${methodName}:`, error);
            throw error;
        }
    };

    try {
        // Fetch contract details
        const name = await handleReadContract<string>("name", []);
        const symbol = await handleReadContract<string>("symbol", []);
        const description = await handleReadContract<string>("description", []);
        const contractTypeHex = await handleReadContract<string>("contractType", []);

        const metadataUri = await handleReadContract<string>("contractURI", []);
        let contractMetadata: Partial<ContractMetadata> = {};

        if (metadataUri.startsWith("ipfs://")) {
            const gatewayUrl = metadataUri.replace("ipfs://", "https://ipfs.io/ipfs/");
            const response = await axios.get(gatewayUrl);
            if (response.status === 200) {
                contractMetadata = {
                    ...response.data,
                };
            }
        }

        // Save contract data
        const blockExplorerUrl =  'https://default-explorer.com';
        const contractData = {
            deployerAddress: deployer,
            contractAddress: contractAddress,
            chainId: chainId,
            title: contractMetadata.name || name,
            description: contractMetadata.description || description,
            thumbnailUrl: contractMetadata.image || "",
            explorer: `${blockExplorerUrl}/${contractAddress}`,
            type: determineContractType(contractTypeHex),
            typeBase: determineContractType(contractTypeHex),
            social_urls: contractMetadata.social_urls || {},
        };

        const response = await fetch('/api/saveContract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contractData),
        });

        if (!response.ok) {
            throw new Error(`Failed to save contract. Status code: ${response.status}`);
        }

        console.log("Contract saved successfully");
    } catch (error) {
        console.error("Error fetching and saving contract:", error);
    }
};

const determineContractType = (typeHex: string): string => {
    switch (typeHex) {
        case "0x44726f7045524337323100000000000000000000000000000000000000000000":
            return "DropERC721";
        case "0x546f6b656e455243373231000000000000000000000000000000000000000000":
            return "TokenERC721";
        case "0x546f6b656e455243313135350000000000000000000000000000000000000000":
            return "TokenERC1155";
        case "0x44726f7045524331313535000000000000000000000000000000000000000000":
            return "DropERC1155";
        case "0x546f6b656e455243323000000000000000000000000000000000000000000000":
            return "TokenERC20";
        case "0x44726f7045524332300000000000000000000000000000000000000000000000":
            return "DropERC20";
        default:
            return "Unknown";
    }
};
