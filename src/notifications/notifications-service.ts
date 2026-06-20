export const notificationsService = {
  async fetchInbox() {
    return [
      { id: "1", title: "Payment settled", level: "info" },
      { id: "2", title: "Approval risk detected", level: "warning" }
    ];
  }
};
