import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

//INTERNAL IMPORT
import Style from "./HeroSection.module.css";

const HeroSection = () => {
  const router = useRouter();

  const titleData = "Discover, collect, and sell NFTs";

  return (
    <div className={Style.heroSectionContainer}>
      <div className={Style.heroSection}>
        <div className={Style.heroSection_box}>
          <div className={Style.heroSection_box_left}>
            <h1>{titleData} 🖼️</h1>
            <p>
              Discover the most outstanding Dapp in all topics of life. Buy, Sell & make Merchandise NFTs from your favorite Nfts on the Blockchain.
              Post your Story on ioPlasmaVerse and connect with other People.
            </p>
            <button
              className={Style.button}
              onClick={() => router.push("/NftGalerie")}
            >
              Start your search
            </button>
          </div>
          <div className={Style.heroSection_box_right}>
            <Image
              src="/hero.png"
              alt="Hero section"
              width={600}
              height={700}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
