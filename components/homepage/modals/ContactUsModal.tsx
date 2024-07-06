import React from 'react';
import { Modal, TextInput, Textarea, Button } from '@mantine/core';

interface ContactUsModalProps {
  opened: boolean;
  onClose: () => void;
}

const ContactUsModal: React.FC<ContactUsModalProps> = ({ opened, onClose }) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Contact Us">
      <TextInput label="Email" placeholder="Your email" />
      <Textarea label="Message" placeholder="Your message" />
      <Button>Send Message</Button>
    </Modal>
  );
};

export default ContactUsModal;
