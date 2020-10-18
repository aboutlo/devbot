import { FiveBidsAndAksWithinFivePercentStrategy } from "./FiveBidsAndAksWithinFivePercentStrategy";
import { IOrderRepo, OrderRepo, OrderType } from "../services/orders";
import Wallet, {
  INITIAL_ETH_BALANCE,
  INITIAL_USD_BALANCE,
  IWallet,
} from "../services/wallet";
import { IStrategy } from "./types";

jest.mock("../services/orders");
jest.mock("../services/wallet");

const OrderRepoMock = OrderRepo as jest.Mocked<typeof OrderRepo>;
const WalletMock = Wallet as jest.Mocked<typeof Wallet>;

describe("FiveBidsAndAsksWithinFivePercent", () => {
  describe("constructor", () => {
    it("builds a strategy", () => {
      const orderRepo = new OrderRepoMock();
      const wallet = new WalletMock(1000, orderRepo);
      expect(
        new FiveBidsAndAksWithinFivePercentStrategy(orderRepo, wallet)
      ).toBeInstanceOf(FiveBidsAndAksWithinFivePercentStrategy);
    });
  });

  describe("execute", () => {
    let subject: IStrategy;
    let orderRepo: IOrderRepo;
    let wallet: IWallet;
    beforeEach(() => {
      orderRepo = new OrderRepoMock();
      wallet = new WalletMock(1000, orderRepo);
      subject = new FiveBidsAndAksWithinFivePercentStrategy(orderRepo, wallet);
    });

    it("executes the strategy", () => {
      wallet.getBalance = jest.fn().mockImplementation(() => ({
        ETH: INITIAL_ETH_BALANCE,
        USD: INITIAL_USD_BALANCE,
      }));
      orderRepo.findAllByExample = jest.fn().mockImplementation(() => [])
      const bid: [number, number, number] = [50000, 350, 1];
      const ask: [number, number, number] = [50000, 350, -1];
      const orderBook = {
        bids: [bid],
        asks: [ask],
      };

      const result = subject.execute(orderBook);
      expect(result).toBeTruthy();
      expect(orderRepo.create).toHaveBeenCalledTimes(10);
      expect(orderRepo.create).toHaveBeenNthCalledWith(
        1,
        OrderType.Bid,
        expect.any(Number),
        expect.any(Number)
      );
      expect(orderRepo.create).toHaveBeenNthCalledWith(
          2,
          OrderType.Ask,
          expect.any(Number),
          expect.any(Number)
      );

    });

    describe('skip strategy', () => {
      it("skip because invalid orderBook", () => {
        const orderBook = { bids: [], asks: [] };
        orderRepo.findAllByExample = jest.fn().mockImplementation(() => [])
        const result = subject.execute(orderBook);
        expect(result).toBeFalsy();
      });

      it("skip because insufficient funds", () => {
        wallet.getBalance = jest.fn().mockImplementation(() => ({
          ETH: 0,
          USD: INITIAL_USD_BALANCE,
        }));
        orderRepo.findAllByExample = jest.fn().mockImplementation(() => [])
        const bid: [number, number, number] = [50000, 350, 1];
        const ask: [number, number, number] = [50000, 350, -1];
        const orderBook = {
          bids: [bid],
          asks: [ask],
        };
        const result = subject.execute(orderBook);
        expect(result).toBeFalsy();
      });
    })


  });
});
