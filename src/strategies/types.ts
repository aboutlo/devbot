export type OrderBook = { bids: [number, number, number][]; asks: [number, number, number][] };
export interface IStrategy {
  execute: ({ bids, asks }: OrderBook) => boolean;
}
