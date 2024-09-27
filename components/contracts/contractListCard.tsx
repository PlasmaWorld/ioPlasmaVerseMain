import React from "react";
import styles from './contractListCard.module.css';
import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "next/navigation";

interface ContractCardProps {
  contract: {
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
  };
}

const ContractCard: React.FC<ContractCardProps> = ({ contract }) => {
  const account = useActiveAccount();
  const router = useRouter();

  const handleClick = () => {
    router.push(`/contracts/${contract.chainid}/${contract.contractaddress}`);
  };

  return (
    <div className={styles.contractCard} onClick={handleClick}>
      <div className={styles.chainIdBadge}>
        {contract.chainid}
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.contractTitle}>{contract.title}</h3>
        <div className={styles.contractDetails}>
          <p><strong>Type:</strong> {contract.type}</p>
          <p><strong>Deployer:</strong> {contract.deployeraddress}</p>
          <p><strong>Contract Address:</strong> {contract.contractaddress}</p>
        </div>
      </div>
    </div>
  );
};

export default ContractCard;
