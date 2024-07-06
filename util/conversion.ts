/**
 * Converts a string representation of a number with decimal places to a BigInt representation with 9 decimals.
 * @param tokens - The string representation of the number, including the integer and fraction parts.
 * @returns The BigInt representation of the number.
 */
export function toUnits9(tokens: string): bigint {
  let [integerPart, fractionPart = ""] = tokens.split(".");
  fractionPart = (fractionPart + "").substring(0, 0); // Ensure fraction part is exactly 9 characters long.
  return BigInt(integerPart );
}

/**
 * Converts a given number of units to a string representation with 9 decimal places.
 * @param units - The number of units to convert.
 * @returns The string representation of the converted units with 9 decimals.
 */
export function toTokens9(units: bigint): string {
  const unitsStr = units.toString().padStart(10, "0");
  const integerPart = unitsStr.slice(0, -9);
  const fractionPart = unitsStr.slice(-9).replace(/0+$/, ""); // Trim trailing zeros
  return fractionPart ? `${integerPart}.${fractionPart}` : integerPart;
}
