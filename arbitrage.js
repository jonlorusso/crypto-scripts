#!/usr/bin/env node

'use strict';

const ccxt = require('ccxt');
const util = require('util');
const log = require ('ololog').configure ({ locate: false })

//var Promise = require("bluebird");
let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms));

process.on('unhandledRejection', error => {
//  console.log('unhandledRejection', error.message);
});

let exchange1name = process.argv[2];
let exchange2name = process.argv[3];

let exchange1 = new ccxt[exchange1name]();
let exchange2 = new ccxt[exchange2name]();

let currency1 = process.argv[4];
let currency2 = process.argv[5];

let arbitrage = async () => {
   var ticker1;
   var ticker2;

   try {
      var symbol = `${currency1}/${currency2}`;
      ticker1 = await exchange1.fetchTicker (symbol)
      ticker2 = await exchange2.fetchTicker (symbol)
   } catch (e) {
      return;
   }

   var ask = ticker1['bid'];
   var bid = ticker2['ask']
   var percentDiff = ((ask -bid)/ask * 100);

   log(`${exchange1name} ask ${ask}`);
   log(`${exchange2name} bid ${bid}`);
   log(exchange2name + ' ' + percentDiff.toFixed(2) + '%');
}

(async () => {
    if (process.argv[6] == '--onetime') {
        arbitrage().then(() => process.exit(0));;
    } else {
        while (true) {
          await arbitrage();
          console.log(' ');
          sleep(2000);
        }
    }
})()

