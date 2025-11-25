export function encryptMessage(text: string): string {
  return btoa(text);
}

export function decryptMessage(encoded: string): string {
  try {
    return atob(encoded);
  } catch {
    return encoded;
  }
}
