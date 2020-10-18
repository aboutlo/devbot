import { BotService } from "./services/bot";
import { OrderRepo } from "./services/orders";
import { FiveBidsAndAksWithinFivePercentStrategy } from "./strategies/FiveBidsAndAksWithinFivePercentStrategy";
import Wallet from "./services/wallet";

const orderRepo = new OrderRepo();
const wallet = new Wallet(30000, orderRepo);
const strategy = new FiveBidsAndAksWithinFivePercentStrategy(orderRepo, wallet);
const bot = new BotService(5000, orderRepo, strategy, wallet);
bot.start();
