import React, { FC, useEffect, useMemo, useState } from "react";
import useDebounce from "@/const/useDebounce";

interface IProps {
  setPage: (page: number) => void; // To communicate the page change.
  totalSupplProfile: number;
}

const PaginationHelperProfile: FC<IProps> = ({ setPage, totalSupplProfile }) => {
  const nftsPerPage = 20;  // Fixed value for items per page.
  const [page, setPageInternal] = useState(1);
  const [pageInput, setPageInput] = useState<string>(page.toString());
  const debouncedSearchTerm = useDebounce(pageInput, 500);
  
  const noOfPages = useMemo(() => {
    return Math.ceil(totalSupplProfile / nftsPerPage);
  }, [totalSupplProfile, nftsPerPage]);

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

export { PaginationHelperProfile };
