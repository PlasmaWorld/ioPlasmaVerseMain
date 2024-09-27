import React from "react";
import Image from "next/image";

// INTERNAL IMPORT
import Style from "./Service.module.css";
import { FaTelegram, FaGlobe, FaGithub } from "react-icons/fa";

const Service = () => {
  return (
    <div className={Style.service}>
      <div className={Style.service_box}>

        <div className={Style.service_box_item}>
          <Image
            src="/service-1.png"
            alt="Create Account & Discover"
            width={100}
            height={100}
          />
          <p className={Style.service_box_item_step}>
            <span>Step 1</span>
          </p>
          <h3>Create an Account & Discover</h3>
          <p>
            Connect your wallet, then click on the Profile button that appears next to the Connect Wallet button. Create your digital identity on the IoTeX Network.
          </p>
        </div>

        <div className={Style.service_box_item}>
          <Image
            src="/service-2.png"
            alt="Join Us on Social Media"
            width={100}
            height={100}
          />
          <p className={Style.service_box_item_step}>
            <span>Step 2</span>
          </p>
          <h3>Join Us on Social Media</h3>

          <div className={Style.social_links}>
            <a href="https://github.com/PlasmaWorld/ioPlasmaVerseMain.git" target="_blank" rel="noopener noreferrer">
              <FaGithub />
            </a>
            <a href="https://t.me/ioPlasmaWorld" target="_blank" rel="noopener noreferrer">
              <FaTelegram />
            </a>
            <a href="https://www.ioPlasmaWorld.com" target="_blank" rel="noopener noreferrer">
              <FaGlobe />
            </a>
          </div>

          <p>
            Join our Telegram channel and share your blockchain experience. Provide us with tipps on how we can improve.
          </p>
        </div>

        <div className={Style.service_box_item}>
          <Image
            src="/service-3.png"
            alt="Mint NFT"
            width={100}
            height={100}
          />
          <p className={Style.service_box_item_step}>
            <span>Step 3</span>
          </p>
          <h3>Mint an NFT</h3>
          <p>
            Visit the NFT Launchpad page to mint an ioPlasmaWorld NFT and become an active member of our ecosystem.
          </p>
        </div>

        <div className={Style.service_box_item}>
          <Image
            src="/service-4.png"
            alt="Start Interacting"
            width={100}
            height={100}
          />
          <p className={Style.service_box_item_step}>
            <span>Step 4</span>
          </p>
          <h3>Start Interacting</h3>
          <p>
            Buy, sell, and mint your NFTs on ioPlasmaVerse. Explore the Merchandise section and create your own merchandise from your NFTs.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Service;
