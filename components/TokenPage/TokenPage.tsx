'use client';

import React, { useEffect, useState } from "react";
import { MediaRenderer } from "thirdweb/react";
import randomColor from "@/util/randomColor";
import client from "@/lib/client";
import VrmViewer from "@/components/AccountGroup/VrmViewer";

const [randomColor1, randomColor2] = [randomColor(), randomColor()];

const TokenPage = ({ nft, directListing, auctionListing, vrmFileUrl }: any) => {
  const [vrmFile, setVrmFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchVrmFile = async () => {
      if (vrmFileUrl) {
        try {
          const response = await fetch(vrmFileUrl);
          const blob = await response.blob();
          const file = new File([blob], "vrmModel.vrm", { type: "application/octet-stream" });
          setVrmFile(file);
        } catch (error) {
          console.error("Failed to fetch VRM file:", error);
        }
      }
    };

    fetchVrmFile();
  }, [vrmFileUrl]);

  return (
    <div className="flex flex-col max-w-2xl gap-16 mx-auto mt-32 lg:max-w-full lg:flex-row">
      <div className="flex flex-col flex-1">
        
                  {vrmFile && <VrmViewer vrmFile={vrmFile} />}

        <div className="flex items-center justify-between my-4">
          <div>
            <h1 className="mx-4 text-3xl font-semibold break-words hyphens-auto">
              {nft.metadata.name}
            </h1>
            <p className="mx-4 overflow-hidden text-ellipsis whitespace-nowrap">
              #{nft.id.toString()}
            </p>
          </div>
          <div className="flex items-center gap-4 transition-all cursor-pointer hover:opacity-80">
            <div
              className="w-12 h-12 overflow-hidden border-2 rounded-full opacity-90 border-white/20"
              style={{
                background: `linear-gradient(90deg, ${randomColor1}, ${randomColor2})`,
              }}
            />
            {nft.owner && (
              <div className="flex flex-col">
                <p className="text-white/60">Current Owner</p>
                <p className="font-medium text-white/90">
                  {nft.owner.slice(0, 8)}...
                  {nft.owner.slice(-4)}
                </p>
              </div>
            )}
          </div>
        </div>
       
      </div>

     
    </div>
  );
}

export default TokenPage;
