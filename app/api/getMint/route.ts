import { NextRequest, NextResponse } from "next/server";

// Allow self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const {
    ENGINE_URL,
    TW_SECRET_KEY,
    BACKEND_WALLET_ADDRESS,
    CHAIN_ID,
} = process.env;

export async function POST(req: NextRequest) {
    console.log('Minting NFT');
    if(!ENGINE_URL || !TW_SECRET_KEY || !BACKEND_WALLET_ADDRESS || !CHAIN_ID) {
        return new NextResponse(
            JSON.stringify({ error: "Missing required environment variables" }),
            { status: 500 }
        );
    }
    const { name, description, image, animation_url, vrm_url, attributes, address } = await req.json();

    try {
        const mintResponse = await fetch(
            `https://localhost:3005/contract/4689/0xfc2d10Fe84fb4d671b2a5c2E69bF8243B3252083/erc721/mint-to?simulateTx=false`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TW_SECRET_KEY}`,
                    "x-backend-wallet-address": BACKEND_WALLET_ADDRESS,
                },
                body: JSON.stringify({
                    receiver: address,
                    metadata: {
                        name: name,
                        description: description,
                        image: image,
                        animation_url: animation_url,
                        vrm_url: vrm_url,
                        attributes:attributes
                    }
                })
            }
        );

        if (!mintResponse.ok) {
            const error = await mintResponse.text();
            throw new Error(`Failed to mint NFT: ${error}`);
        }

        return new NextResponse(JSON.stringify({ message: "NFT minted successfully" }), { status: 200 });
    } catch (error) {
        console.error('Minting error:', error);
        return new NextResponse(
            JSON.stringify({ error: "Failed to mint NFT" }),
            { status: 500 }
        );
    }
};
