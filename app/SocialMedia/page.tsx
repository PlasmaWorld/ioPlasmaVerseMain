"use client";

import React, { useState } from 'react';
import { Helmet } from "react-helmet";
import CommuityChat from '@/components/UserInterAction/NftGridSocial';
import ParentComponent from '@/components/UserInterAction/ParentComponent';
import NFTMinter from '@/components/UserInterAction/SocialText';

export default function Plasma() {
  const [isModalVisible, setModalVisible] = useState(false);
  const toggleModal = () => setModalVisible(!isModalVisible);

  return (
    <div>

    <ParentComponent />

      <NFTMinter />
      <CommuityChat />

    </div>
    
);
}