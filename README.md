# crypto-scripts

Scripts for doing crypto things.

note: both of these scripts are based heavily on scripts found in the examples
section of the [ccxt](https://github.com/ccxt/ccxt) project.

### arbitrage.js

1. npm install
2. node arbitrage.js gdax bittrex ETH BTC [--onetime]

### arbitrage-pairs.js

1. npm install
2. node arbitrage-pairs.js bittrex poloniex hitbtc [--include ETH/BTC]

```
$ node arbitrage-pairs.js gdax bittrex poloniex
symbol  | bittrex | poloniex
----------------------------
ETH/BTC | -0.60%  | -0.58%
LTC/BTC | -0.48%  | -0.69%
```
