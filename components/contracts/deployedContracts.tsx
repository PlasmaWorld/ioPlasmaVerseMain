import React, { FC, useState, useEffect } from "react";
import styles from '../Explorer/explorer.module.css';
import ContractCard from "./contractListCard"; 
import ImportContracts from "./importContract"; 

import { useActiveAccount } from "thirdweb/react";

interface Contract {
  deployeraddress: string;
  contractaddress: string;
  chain: {
    id: number;
    rpc: string;
  };
  chainid: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  explorer: string;
  type: string;
  typeBase: string;
  social_urls: Record<string, string>;
}

const DeployedContractList: FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const account = useActiveAccount();
  
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        console.log('Fetching contracts...');
  
        const response = await fetch('/api/Contract');
        console.log('Response status:', response.status);
        if (!response.ok) {
          console.error('Network response was not ok');
          return;
        }
  
        const data = await response.json();
        console.log('Data received from API:', data);
  
        const { contracts } = data;
        console.log('Contracts data:', contracts);
  
        // Filter contracts by deployerAddress if account is defined
        if (account?.address) {
          console.log('Filtering contracts for deployer address:', account.address);
  
          // Use the correct property name from your API response
          const filteredContracts = contracts.filter(
            (contract: Contract) => contract.deployeraddress.toLowerCase() === account.address.toLowerCase()
          );
          console.log('Filtered contracts:', filteredContracts);
  
          setContracts(filteredContracts);
        } else {
          console.log('No account address available, setting all contracts');
          setContracts(contracts); // Optionally, set all contracts if no account is available
        }
      } catch (error) {
        console.error("Failed to fetch contracts:", error);
      }
    };
  
    fetchContracts();
  }, [account]);
  
  
  return (
    <div className={`${styles.flex} ${styles.hScreen}`}>
      <div className={`${styles.wFull} ${styles.p5}`}>
        <ImportContracts />
        <h2 className={`${styles.mb4} ${styles.textXl} ${styles.fontBold}`}>
          CheckOut Contracts you Deployed on ioPlasmaVerse
        </h2>
        <p>Here is a list of all ERC721, ERC1155, and ERC20 contracts you deployed.</p>

        <h3 className={styles.sectionTitle}>Contracts:</h3>
        <div className={styles.contractsGrid}>
          {contracts.map((contract, index) => (
            <ContractCard key={index} contract={contract} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeployedContractList;
