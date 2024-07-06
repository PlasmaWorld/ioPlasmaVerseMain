import React from 'react';
import { Modal } from '@mantine/core';

interface LatestNewsModalProps {
  opened: boolean;
  onClose: () => void;
}

const LatestNewsModal: React.FC<LatestNewsModalProps> = ({ opened, onClose }) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Latest News">
      <div>This is the content for the Latest News.</div>
    </Modal>
  );
};

export default LatestNewsModal;
