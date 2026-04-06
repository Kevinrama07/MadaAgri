// Tas binaire max-heap + tri pour démonstration (publications récentes/populaires)
function heapify(arr, n, i, scoreFn) {
  let largest = i;
  const l = 2 * i + 1;
  const r = 2 * i + 2;

  if (l < n && scoreFn(arr[l]) > scoreFn(arr[largest])) largest = l;
  if (r < n && scoreFn(arr[r]) > scoreFn(arr[largest])) largest = r;

  if (largest !== i) {
    const tmp = arr[i];
    arr[i] = arr[largest];
    arr[largest] = tmp;
    heapify(arr, n, largest, scoreFn);
  }
}

function heapSortDesc(items, scoreFn) {
  const arr = items.slice();
  const n = arr.length;

  for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) {
    heapify(arr, n, i, scoreFn);
  }

  for (let i = n - 1; i > 0; i -= 1) {
    const tmp = arr[0];
    arr[0] = arr[i];
    arr[i] = tmp;
    heapify(arr, i, 0, scoreFn);
  }

  // le tri classique sort croissant après extraction; on inverse pour desc
  return arr.reverse();
}

module.exports = { heapSortDesc };

