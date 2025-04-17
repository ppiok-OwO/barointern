export class Customers {
  customerList = new Map();
  eventActive = false;

  addCustomer(email) {
    this.customerList.set(email, {
      lastClicks: [],
      disqualified: false,
      lastActive: Date.now(),
    });
  }

  getCustomers() {
    return this.customerList;
  }

  eventStart() {
    this.eventActive = true;
    for (const customer of this.customerList.values()) {
      customer.lastClicks = [];
      customer.disqualified = false;
    }
    console.log("이벤트 시작");
  }

  eventEnd() {
    this.eventActive = false;
    console.log("이벤트 종료");
    // TODO: 클릭 수 수집/보고
  }
}
