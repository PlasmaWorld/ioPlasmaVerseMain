import React, { useState, useRef } from 'react';
import styles from "./Modal.module.css"; 
import ImageCropper from "./ImageCropper";
import Image from 'next/image';
import { MediaRenderer } from 'thirdweb/react';
import client from '@/lib/client';

interface ModalProps {
  onRequestClose: () => void;
}

const NewModal: React.FC<ModalProps> = ({ onRequestClose }) => {
  const [imageUrl, setImageUrl] = useState("/images/1.png");


 

  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalContainer}>
        <button onClick={onRequestClose} className={styles.closeButton}>&times;</button>
        <MediaRenderer
          client={client}
          src="ipfs://QmdccASYb46uoYKpjyFrTTNY9KBbkJUfx6t2wjMJ6JcqRd/H1.mp4"
          className={styles.nftPreview}
        />
                
        <ImageCropper
        />
        
        <div>
        </div>
      </div>
    </div>
  );
};

export default NewModal;
