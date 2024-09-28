"use client";
import Image from "next/image";
import Link from "next/link";
import client from "@/lib/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Burger, Button, Drawer } from "@mantine/core";
import styles from "./Navbar.module.css";
import { NETWORK } from "@/const/contracts";
import { createThirdwebClient, defineChain, getContract } from "thirdweb";
import {
  useActiveAccount,
  useSetActiveWallet,
  PayEmbed,
  ConnectButton,
  TransactionButton,
  useActiveWallet,
  MediaRenderer,
  useReadContract,
  useActiveWalletChain,
} from "thirdweb/react";


export function Navbar() {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [isPC, setIsPC] = useState(false);
  const [nftDropdownOpen, setNftDropdownOpen] = useState(false);
  const [socialDropdownOpen, setSocialDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isBasketModalOpen, setBasketModalOpen] = useState(false); // State to control basket modal
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const NETWORK = defineChain(activeChain?.id|| 4689);


  useEffect(() => {
    const handleResize = () => {
      setIsPC(window.innerWidth >= 768); // Adjust the breakpoint as needed
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initialize the state based on the initial window size

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDropdown = (type: string) => {
    if (type === 'nft') {
      setNftDropdownOpen(!nftDropdownOpen);
      setSocialDropdownOpen(false); // Close other dropdown
    } else if (type === 'social') {
      setSocialDropdownOpen(!socialDropdownOpen);
      setNftDropdownOpen(false); // Close other dropdown
    }
  };

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <div className={styles.navContainer}>
      <nav className="flex items-center justify-between w-full px-8 py-5 mx-auto max-w-7xl">
        <Link href="/" className={`${styles.homeLink} ${styles.navLeft}`}>
          <Image
            src="/ioPlasmaVerse.png"
            width={48}
            height={48}
            alt="NFT marketplace sample logo"
          />
        </Link>

        <div className={`${styles.navMiddle} ${!isPC ? styles.hideOnMobile : ''}`}>
          <div className={styles.dropdown} onMouseEnter={() => toggleDropdown('nft')} onMouseLeave={() => toggleDropdown('nft')}>
            <a className={styles.link}>NFT Section</a>
            {nftDropdownOpen && (
              <div className={styles.dropdownContent}>
                 <Link href="/buy" className={styles.link}>
                  NftMarket
                </Link>
                <Link href="/NftGalerie" className={styles.link}>
                  NftGalerie
                </Link>
                <Link href="/NftMint" className={styles.link}>
                  NftLaunchpad
                </Link>
              </div>
            )}
          </div>

          <div className={styles.dropdown} onMouseEnter={() => toggleDropdown('social')} onMouseLeave={() => toggleDropdown('social')}>
            <a className={styles.link}>Social Media Section</a>
            {socialDropdownOpen && (
              <div className={styles.dropdownContent}>
                <Link href="/SocialMedia" className={styles.link}>
                  SocialPost
                </Link>
              </div>
            )}
          </div>
          <div className={styles.link}><Link href="/contracts" className={styles.link}>
                  Contracts
                </Link>
                </div>
        </div>

        

        <div className={styles.navRight}>
          <div className={styles.connectProfile}>
            {account ? (
              <div className={styles.connectProfileWrapper}>
                <ConnectButton client={client} chain={NETWORK}/>
                <Link href={`/profile/${account?.address}`} passHref className={styles.profileLink}>
                  <div className={styles.profileImageContainer}>
                    <Image src="/user-icon.png" width={42} height={42} alt="Profile" />
                  </div>
                </Link>
              </div>
            ) : (
              <ConnectButton client={client} chain={NETWORK} />
            )}
          </div>
          <button onClick={() => setBasketModalOpen(true)} className={styles.basketButton}>
            <Image src="/Basket.png" width={42} height={42} alt="Basket" />
          </button>
          {!isPC && (
            <div className={styles.burgerMenu}>
              <Burger opened={opened} onClick={() => setOpened(!opened)} />
            </div>
          )}
          <Drawer opened={opened} onClose={() => setOpened(false)} title="Menu" padding="xl" size="sm">
            <div style={{ paddingTop: '75px' }}>
              ioPlasmaVerse
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Link href="/" className={styles.link}>Home</Link>
                <Link href="/contracts" className={styles.link}>contracts</Link> 

                <Link href="/SocialMedia" className={styles.link}>SocialPost</Link> 
                 <Link href="/buy" className={styles.link}>Marketplace</Link>

                <Link href="/NftMint" className={styles.link}>Nft LaunchPad</Link>
                <Link href="/NftGalerie" className={styles.link}>Nft Collection</Link>
                
          </div>
            </div>
          </Drawer>
        </div>
      </nav>
    </div>
  );
}
