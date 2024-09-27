import React, { FC, useEffect, useMemo, useState } from "react";
import useDebounce from "@/const/useDebounce";
import toastStyle from "@/util/toastConfig";
import toast from "react-hot-toast";

interface IProps {
  setPage: (page: number) => void; // To communicate the page change.
  contractAddress: string;
}

const defaultTotalSupplies: Record<string, number> = {
  '0x8aa9271665e480f0866d2F61FC436B96BF9584AD': 837,
  '0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7': 1000,
  '0xaa5314f9ee6a6711e5284508fec7f40e85969ed6': 1000,
  '0x0689021f9065b18c710f5204e41b3d20c3b7d362': 1000,
  '0x8cfE8bAeE219514bE529407207fCe9C612E705fD': 1000,
  '0x778E131aA8260C1FF78007cAde5e64820744F320': 202,
  '0xc52121470851d0cba233c963fcbb23f753eb8709': 601,
  '0x7D150D3eb3aD7aB752dF259c94A8aB98d700FC00': 10000,
  '0x9756E951dd76e933e34434Db4Ed38964951E588b': 100000,
  '0x7f8Cb1d827F26434da652B4E9Bd02C698cC2842a': 528,
  '0xDFBbEbA6D17b0d49861aB7f26CdA495046314370': 1000,
  '0xAf1B5063A152550aebc8d6cB0dA6936288EAb3dc': 347,
  '0x0c5AB026d74C451376A4798342a685a0e99a5bEe': 10000,
  '0xce300b00aa9c066786D609Fc96529DBedAa30B76': 10000,
};

interface ContractData {
  totalSupply: number;
  validTotalSupply: number;
  uniqueOwners: number;
}

const PaginationHelper: FC<IProps> = ({ setPage, contractAddress }) => {
  const nftsPerPage = 30;  // Fixed value for items per page.
  const [page, setPageInternal] = useState(1);
  const [pageInput, setPageInput] = useState<string>(page.toString());
  const debouncedSearchTerm = useDebounce(pageInput, 500);
  const [contractData, setContractData] = useState<Record<string, ContractData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/fetchData');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setContractData(data);
      } catch (error) {
        console.error('Error fetching contract data:', error);
        setError("Something went wrong while fetching your NFTs!");
        toast.error("Something went wrong while fetching your NFTs!", {
          position: "bottom-center",
          style: toastStyle,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContractData();
  }, []);

  const validTotalSupply = contractData[contractAddress]?.validTotalSupply ?? defaultTotalSupplies[contractAddress] ?? 0;
  
  const noOfPages = useMemo(() => Math.ceil(validTotalSupply / nftsPerPage), [validTotalSupply, nftsPerPage]);

  useEffect(() => {
    const newPage = Number(debouncedSearchTerm);
    if (!isNaN(newPage) && newPage > 0 && newPage <= noOfPages) {
      setPageInternal(newPage);
      setPage(newPage); // This informs the parent component of the page change.
    }
  }, [debouncedSearchTerm, noOfPages, setPage]);

  useEffect(() => {
    setPageInput(page.toString());
  }, [page]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex items-center gap-2 md:ml-auto">
      <button
        className="rounded-lg bg-white/5 px-4 py-2 text-white shadow-2xl disabled:opacity-50"
        onClick={() => {
          const newPage = Math.max(1, page - 1);
          setPageInternal(newPage);
          setPage(newPage);
        }}
        disabled={page === 1}
      >
        {/* Left Arrow Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <input
        type="number"
        className="w-16 rounded-lg bg-white/5 p-2 text-white shadow-2xl focus:border-0 focus:outline-none focus:ring-0 active:border-0 active:outline-none active:ring-0"
        onChange={(e) => setPageInput(e.target.value)} // Set the value directly from event, which is string type
        value={pageInput}
      />
      <button
        className="rounded-lg bg-white/5 px-4 py-2 text-white shadow-2xl"
        onClick={() => {
          const newPage = Math.min(noOfPages, page + 1);
          setPageInternal(newPage);
          setPage(newPage);
        }}
        disabled={page === noOfPages}
      >
        {/* Right Arrow Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
};

export { PaginationHelper };
