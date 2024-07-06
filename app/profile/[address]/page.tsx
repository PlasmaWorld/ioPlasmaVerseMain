"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProfilePageClient from '@/components/Profile/ProfilePageClient';


interface NFTData {
  tokenId: bigint;
  listing: any;
}



const ProfilePage = () => {
  const params = useParams();
  const rawAddress = params?.address as string;


 
  return (
    <ProfilePageClient
      profileAddress={rawAddress}

    />
  );
};

export default ProfilePage;