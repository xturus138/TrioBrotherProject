// components/PaginationControls.tsx
"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import * as React from "react";

interface PaginationControlsProps {
  totalCount: number;
  perPage: number;
  page: number;
}

const MAX_PAGES_TO_SHOW = 5;

export function PaginationControls({
  totalCount,
  perPage,
  page,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalCount / perPage);

  if (totalPages <= 1) {
    return null;
  }

  const getPageLink = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(pageNumber));
    return `${pathname}?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const startPage = Math.max(1, page - Math.floor(MAX_PAGES_TO_SHOW / 2));
    const endPage = Math.min(totalPages, startPage + MAX_PAGES_TO_SHOW - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={getPageLink(page - 1)}
            aria-disabled={page === 1}
            onClick={(e) => {
              if (page === 1) e.preventDefault();
            }}
          />
        </PaginationItem>
        {getPageNumbers().map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href={getPageLink(pageNumber)}
              isActive={pageNumber === page}
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}
        {totalPages > MAX_PAGES_TO_SHOW && page < totalPages - 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            href={getPageLink(page + 1)}
            aria-disabled={page >= totalPages}
            onClick={(e) => {
              if (page >= totalPages) e.preventDefault();
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
