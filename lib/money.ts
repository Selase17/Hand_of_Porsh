/** Format an integer pesewas amount (GHS x 100) as a GHS display string, e.g. 4500 -> "GHS 45.00". */
export function formatGHS(pesewas: number): string {
  return `GHS ${(pesewas / 100).toFixed(2)}`;
}
