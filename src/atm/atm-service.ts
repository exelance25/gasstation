export const atmService = {
  createWithdrawalCode(amount: number) {
    return `ATM-${Math.round(amount * 100)}-${Date.now().toString().slice(-6)}`;
  }
};
