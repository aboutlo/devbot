import { IOrderRepo, OrderRepo, OrderStatus, OrderType } from "../orders";
import Wallet, { IWallet } from "../wallet";
import BotService from "./index";
import { FiveBidsAndAksWithinFivePercentStrategy } from "../../strategies/FiveBidsAndAksWithinFivePercentStrategy";
import { IStrategy, OrderBook } from "../../strategies/types";

jest.mock("../wallet");
jest.mock("../orders");
jest.mock("../../strategies/FiveBidsAndAksWithinFivePercentStrategy");

const OrderRepoMock = OrderRepo as jest.Mocked<typeof OrderRepo>;
const WalletMock = Wallet as jest.Mocked<typeof Wallet>;
const StrategyMock = FiveBidsAndAksWithinFivePercentStrategy as jest.Mocked<
  typeof FiveBidsAndAksWithinFivePercentStrategy
>;

describe("BotService", () => {
  describe("constructor", () => {
    it("builds an instance", () => {
      const orderRepo = new OrderRepoMock();
      const wallet = new WalletMock(1000, orderRepo);
      const strategy = new StrategyMock(orderRepo, wallet);
      expect(new BotService(0, orderRepo, strategy, wallet)).toBeInstanceOf(
        BotService
      );
    });
  });

  describe("matchOrders", () => {
    let orderRepo: IOrderRepo;
    let wallet: IWallet;
    let strategy: IStrategy;
    let subject: BotService;

    beforeEach(() => {
      orderRepo = new OrderRepoMock();
      wallet = new WalletMock(1000, orderRepo);
      strategy = new StrategyMock(orderRepo, wallet);
      subject = new BotService(0, orderRepo, strategy, wallet);
    });
    it("match bids", () => {
      orderRepo.findAllByExample = jest
        .fn()
        .mockImplementationOnce(() => [
          {
            type: OrderType.Bid,
            status: OrderStatus.Open,
            price: 376.972155725,
          },
          {
            type: OrderType.Bid,
            status: OrderStatus.Open,
            price: 346.972155725,
          },
          {
            type: OrderType.Bid,
            status: OrderStatus.Open,
            price: 356.972155725,
          },
        ])
        .mockImplementationOnce(() => [
          {
            type: OrderType.Ask,
            status: OrderStatus.Open,
            price: 346.172155725,
          },
          {
            type: OrderType.Ask,
            status: OrderStatus.Open,
            price: 386.972155725,
          },
          {
            type: OrderType.Ask,
            status: OrderStatus.Open,
            price: 376.972155725,
          },
        ]);
      const orderBook: OrderBook = {
        bids: [
          [52648214807, 366.85, 15],
          [52648236451, 366.84828504, 6.8155],
          [52648229024, 366.84, 40.7921],
        ],
        asks: [
          [52648237268, 366.98, -1.20136689],
          [52648229021, 367.12, -6.7987],
          [52647623549, 367.124450634, -1.39725],
        ],
      };

      const bestBid = orderBook.bids[orderBook.bids.length - 1]; // last element
      const [bestAsk] = orderBook.asks; // fist element

      expect(subject.matchOrders(bestBid, bestAsk)).toEqual([
        { price: 346.172155725, status: "OPEN", type: "ASK" },
        { price: 376.972155725, status: "OPEN", type: "BID" },
      ]);
    });
  });

  describe("printStatus", () => {
    let orderRepo: IOrderRepo;
    let wallet: IWallet;
    let strategy: IStrategy;
    let subject: BotService;

    beforeEach(() => {
      orderRepo = new OrderRepoMock();
      wallet = new WalletMock(1000, orderRepo);
      strategy = new StrategyMock(orderRepo, wallet);
      subject = new BotService(0, orderRepo, strategy, wallet);
    });
    it("shows the status", () => {
      orderRepo.findAllByExample = jest
        .fn()
        .mockImplementationOnce(() => [
          {
            type: OrderType.Bid,
            status: OrderStatus.Open,
            price: 376.972155725,
          },
          {
            type: OrderType.Bid,
            status: OrderStatus.Open,
            price: 346.972155725,
          },
          {
            type: OrderType.Bid,
            status: OrderStatus.Open,
            price: 356.972155725,
          },
        ])
        .mockImplementationOnce(() => [
          {
            type: OrderType.Ask,
            status: OrderStatus.Open,
            price: 346.172155725,
          },
          {
            type: OrderType.Ask,
            status: OrderStatus.Open,
            price: 386.972155725,
          },
          {
            type: OrderType.Ask,
            status: OrderStatus.Open,
            price: 376.972155725,
          },
        ]);
      const orderBook: OrderBook = {
        bids: [
          [52648214807, 366.85, 15],
          [52648236451, 366.84828504, 6.8155],
          [52648229024, 366.84, 40.7921],
        ],
        asks: [
          [52648237268, 366.98, -1.20136689],
          [52648229021, 367.12, -6.7987],
          [52647623549, 367.124450634, -1.39725],
        ],
      };

      const bestBid = orderBook.bids[orderBook.bids.length - 1]; // last element
      const [bestAsk] = orderBook.asks; // fist element

      const status = subject.getStatus(bestBid, bestAsk);
      expect(status).toEqual({
        bestBid: 366.84,
        bestAsk: 366.98,
        nearestBid: { type: "BID", price: 346.972155725 },
        bids: "346.972155725, 356.972155725, 376.972155725",
        nearestAsk: { type: "ASK", price: 346.172155725 },
        asks: "346.172155725, 376.972155725, 386.972155725",
      });
    });
  });
});
