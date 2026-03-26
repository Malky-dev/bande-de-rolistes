import { buildQuotesPageWindow } from "@/client/components/quotesPanel.helpers";

type QuotesPaginationProps = {
  page: number;
  totalPages: number;
  loading: boolean;
  rangeLabel: string;
  onChangePage: (page: number) => void;
};

function Pagination({
  page,
  totalPages,
  loading,
  rangeLabel,
  onChangePage,
}: QuotesPaginationProps) {
  const pageWindow = buildQuotesPageWindow(page, totalPages);
  const firstPageInWindow = pageWindow[0];
  const lastPageInWindow = pageWindow[pageWindow.length - 1];

  return (
    <div className="quotes__pagination">
      <div className="quotes__paginationInfo">{rangeLabel}</div>

      <div className="quotes__paginationControls">
        <button
          type="button"
          className="btn-secondary btn-secondary--xs"
          onClick={() => onChangePage(page - 1)}
          disabled={loading || page <= 1}
          aria-label="◀"
        >
          ◀
        </button>

        {firstPageInWindow > 1 && (
          <>
            <button
              type="button"
              className="btn-secondary btn-secondary--xs"
              onClick={() => onChangePage(1)}
              disabled={loading}
            >
              1
            </button>
            {firstPageInWindow > 2 && <span>…</span>}
          </>
        )}

        {pageWindow.map((targetPage) => {
          const isCurrentPage = targetPage === page;

          return (
            <button
              key={targetPage}
              type="button"
              className={
                isCurrentPage
                  ? "btn-primary"
                  : "btn-secondary btn-secondary--xs"
              }
              onClick={() => onChangePage(targetPage)}
              disabled={loading}
              aria-current={isCurrentPage ? "page" : undefined}
            >
              {targetPage}
            </button>
          );
        })}

        {lastPageInWindow < totalPages && (
          <>
            {lastPageInWindow < totalPages - 1 && <span>…</span>}
            <button
              type="button"
              className="btn-secondary btn-secondary--xs"
              onClick={() => onChangePage(totalPages)}
              disabled={loading}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className="btn-secondary btn-secondary--xs"
          onClick={() => onChangePage(page + 1)}
          disabled={loading || page >= totalPages}
          aria-label="▶"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

export default Pagination;
