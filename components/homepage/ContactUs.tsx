import React, { useState, useRef, FormEvent } from 'react';
import emailjs from '@emailjs/browser';
import { TextInput, Textarea, Button, Group, ActionIcon, Title, Text } from '@mantine/core';
import { IconBrandTwitter, IconBrandYoutube, IconBrandInstagram, IconX } from '@tabler/icons-react';
import { ContactIconsList } from './ContactIcons';
import classes from './ContactUs.module.css';

interface ContactUsProps {
  onClose: () => void;
}

const ContactUs: React.FC<ContactUsProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  const form = useRef<HTMLFormElement>(null);

  const sendEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.current) return;
    setStatus('pending');

    emailjs.sendForm('service_1jiz9i6', 'template_r4u347l', form.current, 'VsLVOvhz5fGcJloza')
      .then(
        (response) => {
          setStatus('success');
          console.log('SUCCESS!', response.status, response.text);
          setTimeout(() => {
            onClose();
          }, 2000);
        },
        (error) => {
          setStatus('error');
          console.log('FAILED...', error);
        }
      );
  };

  return (
    <div className={classes.modalBackground}>
      <div className={classes.container}>
        <div className={classes.closeButtonContainer}>
          <ActionIcon size={28} className={classes.closeButton} variant="transparent" onClick={onClose}>
            <IconX size="1.4rem" stroke={1.5} />
          </ActionIcon>
        </div>
        <div className={classes.contactInfo}>
          <Title className={classes.title}>Contact us</Title>
          <Text className={classes.description}>
            Leave your email and we will get back to you within 24 hours
          </Text>
          <ContactIconsList />
          <Group mt="xl">
            {[IconBrandTwitter, IconBrandYoutube, IconBrandInstagram].map((Icon, index) => (
              <ActionIcon key={index} size={28} className={classes.social} variant="transparent">
                <Icon size="1.4rem" stroke={1.5} />
              </ActionIcon>
            ))}
          </Group>
        </div>
        <div className={classes.contactForm}>
          <form ref={form} onSubmit={sendEmail}>
            <TextInput label="Name" name="user_name" placeholder="Your Name" required />
            <TextInput label="Email" type="email" name="user_email" placeholder="Your Email" required />
            <Textarea label="Message" name="message" placeholder="Your Message" required />
            <div style={{ position: 'relative' }}>
              <Button type="submit" variant="filled" disabled={status === 'pending'} className={classes.control}>
                {status === 'pending' ? 'Sending...' : 'Send'}
              </Button>
            </div>
            {status === 'success' && <p className="text-green-500">Message sent successfully!</p>}
            {status === 'error' && <p className="text-red-500">Failed to send message. Please try again later.</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
