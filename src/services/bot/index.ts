import { sleep } from "../../utils";
import axios from "axios";
import OrderRepo, {
  IOrder,
  IOrderRepo,
  OrderStatus,
  OrderType,
} from "../orders";
import { IStrategy, OrderBook } from "../../strategies/types";
import { IWallet } from "../wallet";

export class BotService {
  private running: boolean;
  private interval: number;
  private orderRepo: IOrderRepo;
  private strategy: IStrategy;
  private wallet: IWallet;

  constructor(
    interval = 5000,
    orderRepo: IOrderRepo,
    strategy: IStrategy,
    wallet: IWallet
  ) {
    this.running = false;
    this.interval = interval;
    this.strategy = strategy;
    this.orderRepo = orderRepo;
    this.wallet = wallet;
  }

  async start() {
    console.log("start");
    this.running = true;
    // A proper scheduler like https://github.com/OptimalBits/bull should be used
    setTimeout(() => this.tick(), 0);
    this.wallet.start();
  }

  async stop() {
    console.log("stop");
    this.running = false;
  }

  async tick() {
    while (this.running) {
      try {
        const { bids, asks } = await this.fetchOrderBook({
          symbol: "tETHUSD",
          precision: "R0",
        });
        const bestBid = bids[bids.length - 1]; // last element
        const [bestAsk] = asks; // fist element

        this.strategy.execute({ bids, asks });
        const status = this.getStatus(bestBid, bestAsk);
        const filledOrders = this.matchOrders(bestBid, bestAsk);
        console.log({
          ...status,
          filledOrders: filledOrders.length,
          openOrders: this.orderRepo.findAllByExample({
            status: OrderStatus.Open,
          }).length,
          orders: this.orderRepo.findAll().length,
        });
      } catch (e) {
        console.log("[error] Tick skipped due to an error:", e.message);
      }
      await sleep(this.interval);
    }
  }

  // cosmetic shouldn't be done in the tick
  getStatus(
    bestBid: [number, number, number],
    bestAsk: [number, number, number]
  ) {
    const bidsOpenOrders = this.orderRepo.findAllByExample({
      type: OrderType.Bid,
      status: OrderStatus.Open,
    });
    const aksOpenOrders = this.orderRepo.findAllByExample({
      type: OrderType.Ask,
      status: OrderStatus.Open,
    });

    const sortBidsOpenOrders = [...bidsOpenOrders].sort(
      (a: IOrder, b: IOrder) => a.price - b.price
    );
    const sortAsksOpenOrders = [...aksOpenOrders].sort(
      (a: IOrder, b: IOrder) => a.price - b.price
    );
    const [nearestBid] = sortBidsOpenOrders;
    const [nearestAsk] = sortAsksOpenOrders;

    return {
      bestBid: bestBid[1],
      bestAsk: bestAsk[1],
      nearestBid: {
        type: nearestBid.type,
        price: nearestBid.price,
        // amount: nearestBid.amount,
      },
      botBids: sortBidsOpenOrders.map((o) => o.price).join(", "),
      nearestAsk: {
        type: nearestAsk?.type,
        price: nearestAsk?.price,
        // amount: nearestAsk.amount,
      },
      botAsks: sortAsksOpenOrders.map((o) => o.price).join(", "),
    };
  }

  matchOrders(
    bestBid: [number, number, number],
    bestAsk: [number, number, number]
  ) {
    console.log("matching...");
    const bestBidPrice = bestBid[1]
    const bestAskPrice = bestAsk[1]

    const filledBids = this.orderRepo
      .findAllByExample({ type: OrderType.Bid })
      .filter(
        (o: IOrder) => o.price > bestBidPrice  && o.status === OrderStatus.Open
      );
    const filledAsks = this.orderRepo
      .findAllByExample({ type: OrderType.Ask })
      .filter(
        (o: IOrder) => o.price < bestAskPrice && o.status === OrderStatus.Open
      );

    const filledOrders = filledAsks.concat(filledBids);

    filledOrders.forEach((o) =>
      this.orderRepo.update(o.id, { ...o, status: OrderStatus.Filled })
    );

    return filledOrders;
  }

  async fetchOrderBook({
    symbol,
    precision,
  }: {
    symbol: string;
    precision: string;
  }): Promise<OrderBook> {
    // const url = `https://api.stg.deversifi.com/bfx/v2/book/${symbol}/${precision}`;
    const url = `https://api.deversifi.com/bfx/v2/book/${symbol}/${precision}`;
    const response = await axios.get(url);

    // pick bids and asks
    return response.data.reduce(
      (memo: OrderBook, [id, price, amount]: number[]) => {
        return {
          bids:
            amount > 0 ? memo.bids.concat([[id, price, amount]]) : memo.bids,
          asks:
            amount < 0 ? memo.asks.concat([[id, price, amount]]) : memo.asks,
        };
      },
      { bids: [], asks: [] }
    );
  }
}

export default BotService;
