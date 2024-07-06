
import React, { Suspense } from "react";
import { NFTGridLoading } from "@/components/NFT/NFTGrid";
import ListingGrid from "@/components/ListingGrid/ListingGrid";
import { MARKETPLACE, NFT_COLLECTION } from "@/const/contracts";

export default function Buy() {
	return (
		<div className="">
			<h1 className="text-4xl">Buy NFTs</h1>

			<div className="my-8">
				<Suspense fallback={<NFTGridLoading />}>
					<ListingGrid
						marketplace={MARKETPLACE} emptyText={""} collection={NFT_COLLECTION}						/>
				</Suspense>
			</div>
		</div>
	);
}