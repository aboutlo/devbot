# Deversifi Bot

# prerequisites
Use Node 14. 
If nvm is installed just `nvm use` the `.nvmrc` will be used to fetch the right node version  

# Launch the bot 
- Install by running `yarn`.
- Run `yarn build` to compile
- Run `yarn start` to start the bot

# Performance

Given this was an assignment to finish in 4 hours I kept everything in memory. 
To improve the performance I would move everything to an event based architecture. 
Then rather than use a REST endpoint I will subscribe to a socket to listen the events in real time. 
OrderRepo should read and write from a proper db. 
On every create, update order and event should be triggered so that the Wallet and the Strategy can update what is required.
The strategy is the consumer of the socket to decide on every tick how to adapt to the changed conditions.             
