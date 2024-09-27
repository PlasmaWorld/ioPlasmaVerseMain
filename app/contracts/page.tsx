"use client";

import React, { useEffect, useState } from "react";
import styles from '../../Style/explorer.module.css';
import DeployContract from "@/components/contracts/ERC721DepoyContract";
import DeployedContractList from "@/components/contracts/deployedContracts";
import { useActiveWalletChain } from "thirdweb/react";

const TestFile2: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'deploy' | 'list'>('deploy');
  const activeChain = useActiveWalletChain();
  
  useEffect(() => {
    if (activeChain) {
      console.log('Active Chain:', activeChain);
    }
  }, [activeChain]);
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Contracts</h1>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button
          className={activeTab === 'deploy' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('deploy')}
        >
          Deploy Contract
        </button>
        <button
          className={activeTab === 'list' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('list')}
        >
          Deployed Contracts
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'deploy' && <DeployContract />}
        {activeTab === 'list' && <DeployedContractList />}
      </div>
    </div>
  );
};

export default TestFile2;
