"use client";

import React from "react";
import { useReadContract } from "thirdweb/react";
import ProfilePage from './socialProfile';

// Define the type for the data returned by getLast10Addresses
interface Last10AddressesResponse {
  addresses: string[];
}

const ParentComponent = () => {

  


  return (
    <div className="flex justify-start gap-8 p-8 overflow-x-auto">
    </div>
  );
};

export default ParentComponent;
