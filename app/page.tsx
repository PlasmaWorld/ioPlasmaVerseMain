
"use client";
import Footer from "@/components/homepage/Footer";
import HeroNft from "@/components/homepage/LaunchHero";
import NewsSection2 from "@/components/homepage/LaunchNews";
import Part from "@/components/homepage/Part";
import Roadmap2 from "@/components/homepage/Roadmap";


export default function Home(): JSX.Element {

return (
    <>
      <HeroNft />
      <NewsSection2 />
      <Roadmap2/>
      <Part />
      <Footer />

    </>
  );
}