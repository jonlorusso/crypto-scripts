"use strict";

const ccxt      = require ('ccxt')
const asTable   = require ('as-table')
const log       = require ('ololog').configure ({ locate: false })
const Promise   = require("bluebird")

var argv = require('minimist')(process.argv.slice(2));

process.on('unhandledRejection', error => {
    // console.log('unhandledRejection', error.message);
});

require ('ansicolor').nice;

let proxies = [
    '', // no proxy by default
    'https://crossorigin.me/',
    'https://cors-anywhere.herokuapp.com/',
];

let proxiedRequest = async (exchange, fun) => {
    // basic round-robin proxy scheduler
    let currentProxy = 0
    let maxRetries   = proxies.length
    
    for (let numRetries = 0; numRetries < maxRetries; numRetries++) {

        try { 
            exchange.proxy = proxies[currentProxy]
            return await fun();
        } catch (e) { // rotate proxies in case of connectivity errors, catch all other exceptions
            if (e instanceof ccxt.DDoSProtection || e.message.includes ('ECONNRESET')) {
            } else if (e instanceof ccxt.RequestTimeout) {
            } else if (e instanceof ccxt.AuthenticationError) {
            } else if (e instanceof ccxt.ExchangeNotAvailable) {
            } else if (e instanceof ccxt.ExchangeError) {
            } else {
                throw e; // rethrow all other exceptions
            }

            currentProxy = ++currentProxy % proxies.length 
        }
    }
}

let arbitrage = async (symbol, exchange1, exchange2) => {
    let ticker1 = await proxiedRequest(exchange1, () => exchange1.fetchTicker(symbol))
    let ticker2 = await proxiedRequest(exchange2, () => exchange2.fetchTicker(symbol))

    let ask = ticker1['bid']
    let bid = ticker2['ask']
    let percentDiff = ((bid - ask) / ask * 100)

    return percentDiff
}


(async function main () {

    let ids = argv['_']
    let source_id = argv['_'][0]
    let target_ids = argv['_'].slice(1)
    let include = argv['include']

    let exchanges = {}

    // load all markets from all exchanges 
    for (let id of ids) {
        let exchange = new ccxt[id] ()
        exchanges[id] = exchange

        let markets = await exchange.loadMarkets ()
        proxiedRequest(exchange, () => { exchange.loadMarkets() })
    }

    let sourceExchange = exchanges[source_id]

    // markets available on source
    let sourceSymbols = exchanges[source_id].symbols
        .filter (symbol => !include || include.indexOf (symbol) >= 0 )

    // filter out symbols that are not available on targets
    let arbitrableSymbols = sourceSymbols
        .filter (symbol => 
            target_ids.filter (id => 
                (exchanges[id].symbols.indexOf (symbol) >= 0)).length > 0)


    let rows = Promise.map(arbitrableSymbols, async function(symbol) {
        let row = { symbol }
        for (let id of target_ids)
            if (exchanges[id].symbols.indexOf (symbol) >= 0) {
                let percentDiff = await arbitrage(symbol, sourceExchange, exchanges[id])
                //row[id] = percentDiff.toFixed(2) + '%'
                row[id] = percentDiff
            }

        return row
    })

    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    let values = (row) =>
        Object.keys(row)
            .filter(key => key != 'symbol')
            .map(key => row[key])
            .reduce(reducer)

    Promise.all(rows).then(table => {
        let sortedTable = table.sort((row1, row2) => (values(row1) > values(row2) ? 1 : -1))
        log (asTable.configure ({ print: obj => (typeof obj === 'number' ? obj.toFixed(2) + '%' : obj), delimiter: ' | ' }) (table))
    })

}) ()
