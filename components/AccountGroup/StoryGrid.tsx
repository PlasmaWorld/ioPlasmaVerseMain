"use client";

import React, { useState } from 'react';
import styles from "../UserInterAction/Social.module.css";

interface UploadedFile {
  file: File | null;
  url: string;
  type?: string;
  description: string;
}

interface StoryGridProps {
  files?: UploadedFile[]; // Make files optional
}

const StoryGrid: React.FC<StoryGridProps> = ({ files }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

  const openModal = (file: UploadedFile) => {
    setSelectedFile(file);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedFile(null);
  };

  // Check if files array is defined and not empty
  if (!files || files.length === 0) {
    return null; // Render nothing if no files
  }

  return (
    <div>
      <div className={styles.storyGrid}>
        {files.map((file, index) => (
          <div key={index} className={styles.storyGridItem} onClick={() => openModal(file)}>
            {file.type && file.type.startsWith('video/') ? (
              <video src={file.url} className={styles.storyGridVideo} />
            ) : (
              <img src={file.url} alt={`Thumbnail ${index}`} className={styles.storyGridImage} />
            )}
          </div>
        ))}
      </div>
      {modalOpen && selectedFile && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {selectedFile.type && selectedFile.type.startsWith('video/') ? (
              <video src={selectedFile.url} controls className={styles.modalVideo} />
            ) : (
              <img src={selectedFile.url} alt="Selected" className={styles.modalImage} />
            )}
            <p className={styles.modalDescription}>{selectedFile.description}</p>
            <button onClick={closeModal} className={styles.closeButton}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryGrid;
