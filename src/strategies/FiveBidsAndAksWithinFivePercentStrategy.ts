import { IStrategy, OrderBook } from "./types";
import { randomAmount, randomPrice } from "../utils";
import { IOrder, IOrderRepo, OrderStatus, OrderType } from "../services/orders";
import { INITIAL_ETH_BALANCE, IWallet } from "../services/wallet";

const NUMBERS_OF_ORDERS = 5;
const TOLERANCE = 0.05; //5%
const AMOUNT = INITIAL_ETH_BALANCE / 50;

export class FiveBidsAndAksWithinFivePercentStrategy implements IStrategy {
  private orderRepo: IOrderRepo;
  private wallet: IWallet;
  constructor(orderRepo: IOrderRepo, wallet: IWallet) {
    this.orderRepo = orderRepo;
    this.wallet = wallet;
  }

  execute({ bids, asks }: OrderBook): boolean {
    if (bids.length === 0 || asks.length === 0) {
      return false;
    }
    const bestBid = bids[bids.length - 1]; // last element
    const [bestAsk] = asks; // fist element
    this.cleanOrders(bestBid, bestAsk);

    const balance = this.wallet.getBalance();
    const requiredETH = AMOUNT * NUMBERS_OF_ORDERS * TOLERANCE;
    const requiredUSD = AMOUNT * bestAsk[1] * NUMBERS_OF_ORDERS * TOLERANCE;
    if (balance.ETH < requiredETH || balance.USD < requiredUSD) {
      // not enough funds to execute the strategy
      console.log("skip strategy because missing funds", { balance });
      return false;
    }

    console.log("execute:");
    Array.from({ length: NUMBERS_OF_ORDERS }).forEach(() => {
      const bidPrice = randomPrice(bestBid, TOLERANCE);
      const bidAmount = randomAmount(AMOUNT, TOLERANCE);
      this.orderRepo.create(OrderType.Bid, bidPrice, bidAmount);

      const askPrice = randomPrice(bestAsk);
      const askAmount = randomAmount(AMOUNT, TOLERANCE);
      this.orderRepo.create(OrderType.Ask, askPrice, askAmount);
    });
    return true;
  }

  private cleanOrders(
    bestBid: [number, number, number],
    bestAsk: [number, number, number]
  ) {
    const bestBidPrice = bestBid[1];
    const bestAskPrice = bestAsk[1];
    const maxBidPrice = bestBidPrice - bestBidPrice * TOLERANCE;
    console.log({ bestBidPrice, maxBidPrice });
    const maxAskPrice = bestAskPrice + bestAskPrice * TOLERANCE;
    console.log({ bestAskPrice, maxAskPrice });

    // keep the nearest 5 bids
    this.orderRepo
      .findAllByExample({ type: OrderType.Bid, status: OrderStatus.Open })
      .sort((a: IOrder, b: IOrder) => b.price - a.price)
      .slice(4)
      .forEach((o) => {
        this.orderRepo.update(o.id, { status: OrderStatus.Closed });
      });
    //

    // keep the nearest 5 asks
    this.orderRepo
      .findAllByExample({ type: OrderType.Ask, status: OrderStatus.Open })
      .sort((a: IOrder, b: IOrder) => a.price - b.price)
      .slice(4)
      .forEach((o) => {
        this.orderRepo.update(o.id, { status: OrderStatus.Closed });
      });
  }
}
