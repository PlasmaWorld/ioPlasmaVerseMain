import React from 'react';
import { Box, Text } from '@mantine/core';
import { IconSun } from '@tabler/icons-react';
import classes from './ContactUs.module.css';

interface ContactIconProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'title'> {
  icon: typeof IconSun;
  title: React.ReactNode;
  description: React.ReactNode;
}

function ContactIcon({ icon: Icon, title, description, ...others }: ContactIconProps) {
  return (
    <div className={classes.wrapper} {...others}>
      <Box mr="md">
        <Icon style={{ width: '24px', height: '24px' }} />
      </Box>
      <div>
        <Text size="xs" className={classes.title}>
          {title}
        </Text>
        <Text className={classes.description}>{description}</Text>
      </div>
    </div>
  );
}

const MOCKDATA = [
  { title: 'Email', description: 'PlasmaWorld@gmail.com', icon: IconSun },
  { title: 'Phone', description: '+49 (151) 2024 91 99', icon: IconSun },
  
];

export function ContactIconsList() {
  const items = MOCKDATA.map((item, index) => <ContactIcon key={index} {...item} />);
  return <div>{items}</div>;
}
