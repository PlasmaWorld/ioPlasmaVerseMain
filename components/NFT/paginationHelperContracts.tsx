import React, { FC, useEffect, useMemo, useState } from "react";
import useDebounce from "@/const/useDebounce";
import toastStyle from "@/util/toastConfig";
import toast from "react-hot-toast";

interface IProps {
  setPage: (page: number) => void; // To communicate the page change.
  contractAddress: string;
  totalItems: number; // Total number of items for pagination
  itemsPerPage: number; // Number of items per page
  onPageChange?: (newPage: number) => void; // Optional callback for when the page changes
}

const PaginationHelperContracts: FC<IProps> = ({ setPage, contractAddress, totalItems, itemsPerPage, onPageChange }) => {
  const [page, setPageInternal] = useState(1);
  const [pageInput, setPageInput] = useState<string>(page.toString());
  const debouncedSearchTerm = useDebounce(pageInput, 500);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const noOfPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);

  useEffect(() => {
    const newPage = Number(debouncedSearchTerm);
    if (!isNaN(newPage) && newPage > 0 && newPage <= noOfPages) {
      handlePageChange(newPage); // Handle page change when input is debounced
    }
  }, [debouncedSearchTerm, noOfPages]);

  useEffect(() => {
    setPageInput(page.toString());
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setPageInternal(newPage);
    setPage(newPage); // This informs the parent component of the page change.
    if (onPageChange) {
      onPageChange(newPage); // Call the optional onPageChange callback
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex items-center gap-2 md:ml-auto">
      <button
        className="rounded-lg bg-white/5 px-4 py-2 text-white shadow-2xl disabled:opacity-50"
        onClick={() => handlePageChange(Math.max(1, page - 1))}
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
        onClick={() => handlePageChange(Math.min(noOfPages, page + 1))}
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

export { PaginationHelperContracts };
