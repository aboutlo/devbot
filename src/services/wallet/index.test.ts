import {
  INITIAL_ETH_BALANCE,
  INITIAL_USD_BALANCE,
  IWallet,
  Wallet,
} from "./index";
import { IOrderRepo, OrderRepo, OrderStatus, OrderType } from "../orders";
jest.mock("../orders");

const OrderRepoMock = OrderRepo as jest.Mocked<typeof OrderRepo>;

describe("Wallet", () => {
  describe("constructor", () => {
    it("builds a Wallet", () => {
      expect(new Wallet(1000, new OrderRepoMock())).toBeInstanceOf(Wallet);
    });
  });

  describe("getBalance", () => {
    let subject: IWallet;
    let repo: IOrderRepo;
    beforeEach(() => {
      repo = new OrderRepoMock();
      subject = new Wallet(1000, repo);
    });

    it("fills a ask", () => {
      const amount = 1;
      const price = 300;
      repo.findAllByExample = jest.fn().mockImplementation(() => [
        {
          type: OrderType.Ask,
          status: OrderStatus.Filled,
          amount: -amount,
          price,
        },
      ]);

      const balance = subject.getBalance();
      //e.g. FILLED ASK @ PRICE AMOUNT (ETH + x.xxx USD - yyyy)
      expect(balance.ETH).toEqual(INITIAL_ETH_BALANCE + amount);
      expect(balance.USD).toEqual(INITIAL_USD_BALANCE - amount * price);
    });

    it("fills a bid", () => {
      const amount = 1;
      const price = 300;
      repo.findAllByExample = jest.fn().mockImplementation(() => [
        {
          type: OrderType.Bid,
          status: OrderStatus.Filled,
          amount: amount,
          price,
        },
      ]);

      const balance = subject.getBalance();
      //e.g. FILLED BID @ PRICE AMOUNT (ETH - x.xxx USD + yyyy)
      expect(balance.ETH).toEqual(INITIAL_ETH_BALANCE - amount); //BUG!!!
      expect(balance.USD).toEqual(INITIAL_USD_BALANCE + amount * price);
    });
  });
});
