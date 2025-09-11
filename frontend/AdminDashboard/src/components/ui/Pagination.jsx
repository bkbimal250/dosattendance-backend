import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './Button';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 25, 50, 100],
  onItemsPerPageChange,
  className = ""
}) => {
  // Don't render if there's only one page or no items
  if (totalPages <= 1 && !showItemsPerPage) {
    return null;
  }

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis for large totals
      if (currentPage <= 4) {
        // Near start: show first 5 pages + ellipsis + last page
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end: show first page + ellipsis + last 5 pages
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: show first page + ellipsis + current ± 2 + ellipsis + last page
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Items per page selector */}
      {showItemsPerPage && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span>items per page</span>
        </div>
      )}

      {/* Page info */}
      <div className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Previous</span>
          </Button>

          {/* Page numbers */}
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === 'ellipsis' ? (
                <span className="px-3 py-2 text-gray-400">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              ) : (
                <Button
                  variant={page === currentPage ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="px-3 py-2 min-w-[40px]"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
