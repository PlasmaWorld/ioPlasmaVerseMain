import React from 'react';
import { Modal } from '@mantine/core';

interface UpcomingLaunchesModalProps {
  opened: boolean;
  onClose: () => void;
}

const UpcomingLaunchesModal: React.FC<UpcomingLaunchesModalProps> = ({ opened, onClose }) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Upcoming Launches">
      <div>This is the content for the Upcoming Launches.</div>
    </Modal>
  );
};

export default UpcomingLaunchesModal;
