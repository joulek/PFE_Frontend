"use client";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (!totalPages || totalPages <= 1) return null;

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => canPrev && onPageChange(currentPage - 1)}
        disabled={!canPrev}
        className={`px-4 py-2 rounded-full border text-sm transition
          ${
            canPrev
              ? "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
          }`}
      >
        Précédent
      </button>

      <span className="w-9 h-9 flex items-center justify-center rounded-full border border-[#6CB33F] text-[#4E8F2F] font-bold">
        {currentPage}
      </span>

      <button
        onClick={() => canNext && onPageChange(currentPage + 1)}
        disabled={!canNext}
        className={`px-4 py-2 rounded-full border text-sm transition
          ${
            canNext
              ? "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
          }`}
      >
        Suivant
      </button>
    </div>
  );
}
