"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// INTERNAL IMPORT
import Style from "./HeroSection.module.css";
import ContactUs from "../homepage/ContactUs";

const HeroSectionMerch = () => {
  const [showModal, setShowModal] = useState<boolean>(false);

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const titleData = "Discover, collect, and Create Merchandise";

  return (
    <div className={Style.heroSectionContainer}>
      <div className={Style.heroSection}>
        <div className={Style.heroSectionContent}>
          <div className={Style.heroSectionContentText}>
            <h1>{titleData} 🖼️</h1>
            <p>It is Time Merchandise is here on the Iotex Network.</p>
            <p>Option 1: Buy Merchandise from the Marketplace</p>
            <p>Option 2: Create Merchandise from your Favorite NFT</p>
            <p>Option 3: Contact us to build a Unique Merchandise collection for Your community.</p>
            <button
              onClick={toggleModal}
              className="bg-sky-500 hover:bg-gray-300 hover:text-gray-800 transition duration-200 text-white py-4 px-10 rounded-full"
            >
              Contact Us
            </button>
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
                <div className="bg-white p-8 max-w-md mx-auto rounded-lg flex flex-col items-center">
                  <ContactUs onClose={toggleModal} />
                  <button
                    onClick={toggleModal}
                    className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={Style.heroSectionContentImage}>
            <Image
              src="/ioPlasmaHero.png"
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

export default HeroSectionMerch;
