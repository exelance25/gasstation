/** 0x71C...3A90 formatında kısaltılmış adres */
export function truncateAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
}
