"use client";
import Image from "next/image";
import Link from "next/link";
import client from "@/lib/client";
import { useRouter } from "next/navigation";  
import { useState, useEffect } from "react";
import { Burger, Drawer, Modal, Button, createStyles } from "@mantine/core";
import styles from "./SelectWallet.module.css";

import { createThirdwebClient, defineChain, getContract } from "thirdweb";
import { viemAdapter } from "thirdweb/adapters/viem";
import {
  useActiveAccount,
  useSetActiveWallet,
  PayEmbed,
  ConnectButton,
  TransactionButton,
  useActiveWallet,
  MediaRenderer,
  useReadContract,
} from "thirdweb/react";
import { createWalletAdapter, inAppWallet } from "thirdweb/wallets";
import { claimTo, getNFT } from "thirdweb/extensions/erc1155";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { baseSepolia } from "thirdweb/chains";

interface WalletSelectProps {
    isOpen: boolean;
    onClose: () => void;
  }

  const useStyles = createStyles((theme) => ({
    modal: {
      marginTop: '80px',
      overflowY: 'auto',
      maxHeight: '80vh',
    },
    content: {
      paddingTop: '30px',
    },
  }));
  
  
  export const WalletSelect: React.FC<WalletSelectProps> = ({ isOpen, onClose }) => {
    const wagmiAccount = useAccount();
    const { connectors, connect, status, error } = useConnect();
    const { disconnectAsync } = useDisconnect();
    const { classes } = useStyles();
        const { data: walletClient } = useWalletClient();
    const { switchChainAsync } = useSwitchChain();
    const setActiveWallet = useSetActiveWallet();

    const [opened, setOpened] = useState(false);
    const [isPC, setIsPC] = useState(false);
    const [nftDropdownOpen, setNftDropdownOpen] = useState(false);
    const [socialDropdownOpen, setSocialDropdownOpen] = useState(false);
    const account = useActiveAccount(); 

    const connectWallet = async (connectorName: string) => {
      try {
          const connector = connectors.find((c) => c.name === connectorName);
          if (connector) {
              await connect({ connector });
          }
      } catch (error) {
          console.error(`Error connecting to ${connectorName}:`, error);
      }
  };

    useEffect(() => {
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

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    hideAppMetadata();
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    const wallets = [
        inAppWallet({
            auth: {
                options: [
                    "email",
                    "google",
                    "apple",
                    "facebook",
                    "phone",
                ],
            },
        }),
    ];

    useEffect(() => {
        const handleResize = () => {
            setIsPC(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

 

    useEffect(() => {
      const setActive = async () => {
          if (walletClient) {
              const chainId = await walletClient.getChainId();
              const chain = defineChain(chainId);
  
              const adaptedAccount = viemAdapter.walletClient.fromViem({
                  walletClient: walletClient as any,
              });
  
              const w = createWalletAdapter({
                  adaptedAccount,
                  chain,
                  client,
                  onDisconnect: async () => {
                      await disconnectAsync();
                  },
                  switchChain: async (chain) => {
                      await switchChainAsync({ chainId: chain.id as any });
                  },
              });
  
              setActiveWallet(w);
          }
      };
      setActive();
  }, [walletClient, disconnectAsync, switchChainAsync, setActiveWallet]);


    const thirdwebWallet = useActiveWallet();
    useEffect(() => {
        const disconnectIfNeeded = async () => {
            if (thirdwebWallet && wagmiAccount.status === "disconnected") {
                await thirdwebWallet.disconnect();
            }
        };
        disconnectIfNeeded();
    }, [wagmiAccount.status, thirdwebWallet]);

    useEffect(() => {
        if (wagmiAccount.status === "connected") {
          onClose();
        }
      }, [wagmiAccount.status, onClose]);

      const thirdwebWalletAndWagmiConnected = thirdwebWallet && wagmiAccount.status === "connected";
      useEffect(() => {
        if (thirdwebWalletAndWagmiConnected) {
          onClose();
        }
      }, [thirdwebWalletAndWagmiConnected, onClose]);
    
      return (
        <Modal opened={isOpen} onClose={onClose} title="Connect Wallet" classNames={{ modal: classes.modal }}>
          <div className={styles.customConnectButtonContainer}>
            <div className="p-4 bg-gray-100 rounded-md shadow-md">
              <h2 className="text-xl font-bold mb-4">Connect</h2>
              <div className="flex flex-col gap-4">
              <button
                onClick={() => connectWallet("MetaMask")}
                type="button"
                className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center"
            >
                <Image
                    src="/provider-1.png"
                    alt="MetaMask"
                    width={24}
                    height={24}
                    className="mr-2"
                />
                MetaMask
            </button>
                <button
                  onClick={() => {
                    const connector = connectors.find(
                      (c) => c.name === "Coinbase Wallet"
                    );
                    if (connector) {
                      connect({ connector });
                    }
                  }}
                  type="button"
                  className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center"
                >
                  <Image
                    src="/provider-2.png"
                    alt="Coinbase Wallet"
                    width={24}
                    height={24}
                    className="mr-2"
                  />
                  Coinbase Wallet
                </button>
                <button
                  onClick={() => {
                    const connector = connectors.find(
                      (c) => c.name === "Injected"
                    );
                    if (connector) {
                      connect({ connector });
                    }
                  }}
                  type="button"
                  className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center"
                >
                  <Image
                    src="/iopayIcon.png"
                    alt="Injected"
                    width={24}
                    height={24}
                    className="mr-2"
                  />
                  IoPay Wallet
                </button>
                <ConnectButton
                  client={client}
                  wallets={wallets}
                  theme={"dark"}
                  connectButton={{ label: "Social Login" }}
                  connectModal={{
                    size: "wide",
                    showThirdwebBranding: false,
                  }}
                />
                {wagmiAccount.status === "connected" && (
                  <ConnectButton client={client} />
                )}
              </div>
            </div>
          </div>
        </Modal>
      );
    }