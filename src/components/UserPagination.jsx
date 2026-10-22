import { useState } from "react";

const PAGE_SIZE = 10;

export function useUserPagination(users, tab, query) {
  const [selection, setSelection] = useState({ tab, query, page: 1 });
  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const page = selection.tab === tab && selection.query === query
    ? Math.min(selection.page, pageCount) : 1;
  const setPage = (nextPage) => setSelection({ tab, query, page: nextPage });
  const start = (page - 1) * PAGE_SIZE;
  return {
    page, pageCount, setPage,
    rows: users.slice(start, start + PAGE_SIZE),
    range: users.length ? `${start + 1}–${Math.min(start + PAGE_SIZE, users.length)} of ${users.length}` : "0",
  };
}

export default function UserPagination({ pagination, loading }) {
  const { page, pageCount, setPage, range } = pagination;
  return (
    <nav aria-label="User table pages" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: 12, paddingTop: 20 }}>
      <span aria-live="polite">{range} users</span>
      <button className="users-icon-btn users-view-btn" type="button" disabled={loading || page === 1} onClick={() => setPage(page - 1)}>Previous</button>
      <span>Page {page} of {pageCount}</span>
      <button className="users-icon-btn users-view-btn" type="button" disabled={loading || page === pageCount} onClick={() => setPage(page + 1)}>Next</button>
    </nav>
  );
}
