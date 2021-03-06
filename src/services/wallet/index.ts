import {IOrderRepo, OrderStatus, OrderType} from "../orders";
import {sleep} from "../../utils";

type Balance = { ETH: number; USD: number };

export const INITIAL_ETH_BALANCE = 10;
export const INITIAL_USD_BALANCE = 2000;

export interface IWallet {
  getBalance(): Balance;
  start(): Promise<any>;
}
// performance
// Wallet should be a service listening for order create and update events
// On each event the asset balance should be updated accordingly
export class Wallet implements IWallet {
  private orderRepo: IOrderRepo;
  private interval: number;
  private running: boolean;

  constructor(interval = 30000, orderRepo: IOrderRepo) {
    this.running = false;
    this.interval = interval;
    this.orderRepo = orderRepo;
  }

  async start() {
    console.log("wallet:start");
    this.running = true;
    // A proper scheduler like https://github.com/OptimalBits/bull should be used
    setTimeout(() => this.tick(), 0);
  }

  async tick() {
    console.log("wallet:tick");
    while (this.running) {
      const balance = this.getBalance();
      console.log({ balance });
      await sleep(this.interval);
    }
  }

  getBalance() {
    return this.orderRepo
      .findAll()
      .reduce(
        // it doesn't scale because it's scanning all the orders every time
        (memo, order) => {
          if ([OrderStatus.Filled, OrderStatus.Open].includes(order.status) && order.type === OrderType.Ask) {
            return {
              ETH: memo.ETH - order.amount, // buy
              USD: memo.USD - Math.abs(order.price * order.amount), // sell
            };
          } else if ([OrderStatus.Filled, OrderStatus.Open].includes(order.status) && order.type === OrderType.Bid) {
            return {
              ETH: memo.ETH - order.amount, // sell
              USD: memo.USD + Math.abs(order.price * order.amount), // buy
            };
          }
          if (order.status === OrderStatus.Closed && order.type === OrderType.Ask) {
            return {
              ETH: memo.ETH + order.amount, // didn't buy
              USD: memo.USD + Math.abs(order.price * order.amount), // didn't sell
            };
          } else if (order.status === OrderStatus.Closed && order.type === OrderType.Bid) {
            return {
              ETH: memo.ETH + order.amount, // didn't sell
              USD: memo.USD - Math.abs(order.price * order.amount), // didn't buy
            };
          }
          throw new Error(`Unsupported ${order.type}`);
        },
        { USD: INITIAL_USD_BALANCE, ETH: INITIAL_ETH_BALANCE }
      );
  }
}

export default Wallet;
