"use client";
import Image from "next/image";
import Link from "next/link";
import client from "@/lib/client";
import { useRouter } from "next/navigation";  
import { useState, useEffect } from "react";
import { Burger, Drawer } from "@mantine/core";
import styles from "./Navbar.module.css";
import { NETWORK } from "@/const/contracts";
import styled from "@emotion/styled";
import { ConnectButton, useActiveAccount } from "thirdweb/react";


export function Navbar() {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [isPC, setIsPC] = useState(false);
  const [nftDropdownOpen, setNftDropdownOpen] = useState(false);
  const [socialDropdownOpen, setSocialDropdownOpen] = useState(false);
  const account = useActiveAccount(); 

  useEffect(() => {
    // Function to hide the appMetadata elements
    const hideAppMetadata = () => {
      const metadataElements = document.querySelectorAll(
        ".tw-connect-modal .tw-app-metadata-name, .tw-connect-modal .tw-app-metadata-url, .tw-connect-modal .tw-app-metadata-description, .tw-connect-modal .tw-app-metadata-logo"
      );
      metadataElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.display = "none";
        }
      });
    };

    // Wait for the modal to be rendered, then hide the elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          hideAppMetadata();
        }
      });
    });

    // Observe changes in the body to detect modal rendering
    observer.observe(document.body, { childList: true, subtree: true });

    // Clean up the observer on component unmount
    return () => observer.disconnect();
  }, []);
  

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

  return (
    <div className={styles.navContainer}>
      <nav className="flex items-center justify-between w-full px-8 py-5 mx-auto max-w-7xl">
        <Link href="/" className={`${styles.homeLink} ${styles.navLeft}`}>
          <Image
            src="/logo.png"
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
                  Buy
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
        </div>

        <div className={styles.navRight}>
          <div className={styles.connectProfile}>
          <div className={styles.customConnectButtonContainer}>
          <ConnectButton
      client={client}
     
      connectModal={{
        size: 'compact', // Use 'compact' to reduce modal size
      }}
      detailsModal={{
        hideDisconnect: true, // Hide the disconnect button
      }}
      connectButton={{
        label: 'Connect Wallet',
        className: 'my-custom-class',
        style: {
          borderRadius: '10px',
          padding: '0.5rem 1rem',
        },
      }}
    />
            </div>           
            {account?.address && (
              <Link href={`/profile/${account.address}`} passHref className={styles.profileLink}>
                <div className={styles.profileImageContainer}>
                  <Image src="/user-icon.png" width={42} height={42} alt="Profile" />
                </div>
              </Link>
            )}
          </div>

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
                <Link href="/SocialMedia" className={styles.link}>SocialMedia</Link>
                <Link href="/NftMint" className={styles.link}>Nft LaunchPad</Link>
                <Link href="/NftGalerie" className={styles.link}>Nft Collection</Link>
                <Link href="/buy" className={styles.link}>MarketPlace</Link>
              </div>
              
            </div>
          </Drawer>
        </div>
      </nav>
    </div>
  );
}
