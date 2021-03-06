import {IOrderRepo, OrderRepo, OrderStatus, OrderType} from "./index";

describe("OrderRepo", () => {
  describe("constructor", () => {
    it("creates a repo", () => {
      expect(new OrderRepo()).toBeInstanceOf(OrderRepo);
    });
  });

  describe("save", () => {
    let subject: IOrderRepo;
    beforeEach(() => {
      subject = new OrderRepo();
    });

    it("builds and save an order", () => {
      const type = OrderType.Bid;
      const price = 100;
      const amount = 1;
      const id = subject.create(type, price, amount);
      expect(id).toBeDefined();
      const order = subject.find(id);
      expect(order).toEqual(expect.objectContaining({ type, price, amount }));
    });
  });

  describe("find", () => {
    let subject: IOrderRepo;
    beforeEach(() => {
      subject = new OrderRepo();
    });

    it("finds an order by id", () => {
      const type = OrderType.Bid;
      const price = 100;
      const amount = 1;
      const id = subject.create(type, price, amount);
      expect(id).toBeDefined();
      const order = subject.find(id);
      expect(order).toEqual(expect.objectContaining({ type, price, amount }));
    });

    it("returns null if the order doesn't  exist", () => {
      const order = subject.find("id");
      expect(order).toEqual(null);
    });
  });

  describe("findAllByExample", () => {
    let subject: IOrderRepo;
    beforeEach(() => {
      subject = new OrderRepo();
    });

    it("finds some orders by type", () => {
      const price = 100;
      const amount = 1;
      subject.create(OrderType.Bid, price, amount);
      subject.create(OrderType.Ask, price, amount);
      const orders = subject.findAllByExample({ type: OrderType.Bid });
      expect(orders).toHaveLength(1);
    });

    it("finds some orders by type and amount", () => {
      const price = 100;
      const amount = 1;
      subject.create(OrderType.Bid, price, amount);
      subject.create(OrderType.Bid, price, 3);
      subject.create(OrderType.Ask, price, amount);
      const orders = subject.findAllByExample({ type: OrderType.Bid, amount });
      expect(orders).toHaveLength(1);
    });

    it("finds some orders by status", () => {
      const price = 100;
      const amount = 1;
      subject.create(OrderType.Bid, price, amount);
      subject.create(OrderType.Bid, price, 3);
      const id = subject.create(OrderType.Ask, price, amount);
      subject.update(id, {status: OrderStatus.Closed})
      const orders = subject.findAllByExample({ status: OrderStatus.Closed });
      expect(orders).toHaveLength(1);
    });
  });

  describe("update", () => {
    let subject: IOrderRepo;
    beforeEach(() => {
      subject = new OrderRepo();
    });

    it("updates an order status", () => {
      const type = OrderType.Bid;
      const price = 100;
      const amount = 1;
      const id = subject.create(type, price, amount);
      const updated = subject.update(id, { status: OrderStatus.Closed });
      expect(updated).toBeTruthy();
      expect(subject.find(id)).toEqual(
        expect.objectContaining({
          type,
          price,
          amount,
          id,
          status: OrderStatus.Closed,
        })
      );
    });

  });
});
