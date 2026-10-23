// The message a wallet signs to log in. Shared so client and server build the exact same text.
export const loginMessage = (address: string, nonce: string) =>
  `Sign in to Chog Verse\n\nThis proves you own this wallet. It costs nothing and sends no transaction.\n\nWallet: ${address}\nNonce: ${nonce}`;
