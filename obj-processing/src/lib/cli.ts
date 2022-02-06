export function strictParseInt(str: string): number {
  const num = Number.parseInt(str, 10);
  if (Number.isNaN(num) || !Number.isInteger(num) || num.toString() !== str) {
    throw new Error('Invalid precision');
  }

  return num;
}
