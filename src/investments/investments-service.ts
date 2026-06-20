export const investmentsService = {
  async listProducts() {
    return [
      { id: "yield-usdc", name: "USDC Yield Vault", apr: "4.2%" },
      { id: "eth-staking", name: "ETH Staking", apr: "3.8%" }
    ];
  }
};
