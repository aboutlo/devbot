import { v4 } from "uuid";

export enum OrderType {
  Bid = "BID",
  Ask = "ASK",
}
export enum OrderStatus {
  Open = "OPEN",
  Filled = "FILLED",
  Closed = "CLOSED",
}

export interface IOrderRepo {
  create(type: OrderType, price: number, amount: number): string;
  update(id: string, order: IOrder | Partial<IOrder>): boolean;
  find(id: string): IOrder | null;
  findAll(): IOrder[];
  findAllByExample(order: Partial<IOrder>): IOrder[];
}

export interface IOrder {
  createdAt: string;
  updatedAt: string;
  type: OrderType;
  price: number;
  amount: number;
  status: OrderStatus;
  id: string;
  [key: string]: any;
}
// in memory implementation
// A proper db like postgres or LevelDb would be better way to serialize and read data
export class OrderRepo implements IOrderRepo {
  private data: any;
  constructor() {
    this.data = {
      [OrderType.Bid]: {},
      [OrderType.Ask]: {},
    };
  }
  create(type: OrderType, price: number, amount: number) {
    const id = v4();
    const order: IOrder = {
      id,
      type,
      price,
      amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: OrderStatus.Open,
    };

    // the data structured partitioned by type doesn't make any sense after I implemented findAllByExample
    this.data = {
      ...this.data,
      [type]: {
        ...this.data[type],
        [order.id]: order,
      },
    };
    console.log(`PLACE ${type} @ ${price} ${amount} ${order.status}`);
    return id;
  }

  update(id: string, order: IOrder | Partial<IOrder>) {
    const oldOrder = this.find(id);
    if (!oldOrder) return false;

    const update: IOrder = {
      ...oldOrder,
      ...order,
      updatedAt: new Date().toISOString(),
      // immutable properties, probably we should allow only status changes
      type: oldOrder.type,
      createdAt: oldOrder.createdAt,
      id: oldOrder.id,
    };

    this.data = {
      ...this.data,
      [oldOrder.type]: {
        ...this.data[oldOrder.type],
        [id]: update,
      },
    };

    const { type, amount, price, status } = update;

    const assets =
      type === OrderType.Bid
        ? `(ETH - ${amount} USD + ${amount * price})`
        : `(ETH + ${-amount} USD - ${Math.abs(amount * price)})`;

    console.log(
      `${status} ${type} @ ${price} ${amount} ${
        status === OrderStatus.Filled ? assets : ""
      }`
    );

    return true;
  }

  findAll() {
    const askOrders = Object.values<IOrder>(this.data[OrderType.Ask]);
    const bidOrders = Object.values<IOrder>(this.data[OrderType.Bid]);
    return askOrders.concat(bidOrders);
  }

  findAllByExample(example: Partial<IOrder>): IOrder[] {
    const props = Object.keys(example);
    return this.findAll().filter((o) => {
      return props.every((eKey) => {
        return example[eKey] === o[eKey];
      });
    });
  }

  find(id: string): IOrder | null {
    const [order] = this.findAll().filter((o) => o.id === id);
    return order ? order : null;
  }
}

export default OrderRepo;
