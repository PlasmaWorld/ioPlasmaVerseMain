
"use client";
import BigNFTSlider from "@/components/BigNFTSilder/BigNFTSilder";
import Footer from "@/components/homepage/Footer";
import HeroSection from "@/components/homepage/hero-Section/HeroSection";
import NewsSection2 from "@/components/homepage/LaunchNews";
import Part from "@/components/homepage/Part";
import Roadmap2 from "@/components/homepage/Roadmap";
import Service from "@/components/Service/Service";
import Stats from "@/components/Stats/Stats";
import { MARKETPLACE } from "@/const/contracts";
import { useEffect, useState } from "react";
import {  EnglishAuction, Offer, getAllValidListings, getAllValidAuctions, getAllValidOffers } from "thirdweb/extensions/marketplace";
import { useReadContract } from "thirdweb/react";


export default function Home(): JSX.Element {
   
return (
    <>
      <HeroSection />
      <Service/>
      <BigNFTSlider
      
      />
      <Stats contractAddress=""/>
      <Roadmap2/>
      <Part />
      <Footer />

    </>
  );
}