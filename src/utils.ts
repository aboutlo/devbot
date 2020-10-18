export const sleep = (ms: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
};

export const randomPrice = (order: number[], range = 0.05) => {
  const [_, price] = order;
  const deltaPrice = price * range;
  const max = price + deltaPrice;
  const min = price - deltaPrice;
  return Math.random() * (max - min) + min;
};

export const randomAmount = (amount: number, range = 0.05) => {
  const delta = amount * range;
  const max = amount + delta;
  const min = amount - delta;
  return Math.random() * (max - min) + min;
};
