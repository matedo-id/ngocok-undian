export function cryptoShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  const randomValues = new Uint32Array(arr.length);
  crypto.getRandomValues(randomValues);

  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export function cryptoPickN<T>(array: T[], n: number): T[] {
  return cryptoShuffle(array).slice(0, n);
}

export function cryptoPickOne<T>(array: T[]): T {
  const randomValue = new Uint32Array(1);
  crypto.getRandomValues(randomValue);
  return array[randomValue[0] % array.length];
}
