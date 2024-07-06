import { ThirdwebProvider } from "thirdweb/react";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import Image from "next/image";
import "@/globals.css";
import { Metadata } from "next";
import { CurrencyProvider } from "@/Hooks/CurrencyProvider";
import { ContractDataProvider } from "@/Hooks/NftStatsProvider";
import { NftProvider } from "@/Hooks/NftOwnedProvider";
import { UserProvider } from "@/Hooks/UserInteraction";


export const metadata: Metadata = {
  metadataBase: new URL('https://www.ioplasmaverse.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative overflow-x-hidden max-w-screen">
        <div className="fixed top-0 left-0 right-0 w-screen h-screen -z-10">
          <Image
            src="/hero-gradient.png"
            width={1390}
            height={1390}
            alt="Background gradient from red to blue"
            quality={100}
            className="w-full h-full opacity-75 object-cover"
          />
        </div>
        <Toaster />
        <ThirdwebProvider>
          <ContractDataProvider>
            <NftProvider>
            <CurrencyProvider>
              <UserProvider>

                <Navbar />
                <div className="w-screen min-h-screen">
                  <div className="px-8 mx-auto mt-32 max-w-7xl">
                    {children}
                  </div>
                </div>

              </UserProvider>
            </CurrencyProvider>
            </NftProvider>
          </ContractDataProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
