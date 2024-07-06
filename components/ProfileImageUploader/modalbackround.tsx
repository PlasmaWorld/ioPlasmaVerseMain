import React, { useState } from 'react';
import { MediaRenderer } from "thirdweb/react";
import styles from "./Modal.module.css";
import ImageCropperBackround from "./ImageCopperBackround";
import Image from 'next/image';
import client from '@/lib/client';

// Define the prop types
interface ModalProps {
  onRequestClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ onRequestClose }) => {
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
        <ImageCropperBackround />
        <div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
