export function distributeQuizQuestions(total) {
  if (!Number.isInteger(total) || total < 1 || total > 100) return [0, 0, 0];
  const exact = [total * 0.5, total * 0.25, total * 0.25];
  const counts = exact.map(Math.floor);
  const order = exact
    .map((value, index) => ({ index, remainder: value - counts[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  const remaining = total - counts.reduce((sum, count) => sum + count, 0);
  for (let i = 0; i < remaining; i++) counts[order[i].index]++;
  return counts;
}
