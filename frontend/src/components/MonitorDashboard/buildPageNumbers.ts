function pageRange(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

/** e.g. total=10 → [1,2,3,4,'…',10] | [1,'…',4,5,6,'…',10] | [1,'…',7,8,9,10] */
export function buildPageNumbers(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return pageRange(1, total);
  }

  // Near the start: keep the first four pages visible.
  if (current <= 3) {
    return [...pageRange(1, 4), 'ellipsis', total];
  }

  // Near the end: keep the last four pages visible.
  if (current >= total - 2) {
    return [1, 'ellipsis', ...pageRange(total - 3, total)];
  }

  // In the middle: show a 3-page window around the current page.
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}
