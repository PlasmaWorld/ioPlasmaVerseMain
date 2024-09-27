import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './contractCard.module.css'; // Assuming you're using CSS Modules
import { ContractInfo } from '@/const/smartContracts';
import DeployContract from './ContractDeployModa';

interface ContractCardProps {
  contract: ContractInfo;
}

const ContractCard: React.FC<ContractCardProps> = ({ contract }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCheckOut = () => {
    router.push(`/contracts/${contract.type}`);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3>{contract.name}</h3>
        {contract.audited && <span className={styles.checkmark}>✔️</span>}
      </div>
      <p>{contract.version}</p>
      <p>{contract.description}</p>
      <p>Type: {contract.type}</p>

      <div className={styles.buttonsContainer}>
        <button className={styles.openModalButton} onClick={handleOpenModal}>
          Deploy Contract
        </button>
        <button className={styles.checkOutButton} onClick={handleCheckOut}>
          Check Out
        </button>
      </div>

      {isModalOpen && <DeployContract name={contract.type} onClose={handleCloseModal} version={''} />}
    </div>
  );
};

export default ContractCard;