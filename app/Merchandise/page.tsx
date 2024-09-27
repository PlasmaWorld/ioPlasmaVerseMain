"use client";
import React from "react";
import HeroSectionMerch from "@/components/Merchandise/MerchHero";
import { NFTCard } from "@/components/Merchandise/NftCard";
import { Merchendise } from "@/const/contracts"; // Ensure you import the contract address correctly

export default function Buy() {
    const currentIds = [0, 1];     

    console.log("Rendering Buy component with currentIds:", currentIds);

    return (
        <div className="">
            <div className="my-8">
                <HeroSectionMerch/>
                <div className="flex flex-wrap items-center justify-center gap-8">
                    {currentIds.map(id => (
                        <NFTCard
                            key={id}
                            tokenId={BigInt(id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
