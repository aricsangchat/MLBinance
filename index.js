import {NeuralNetwork} from './nn' 
import {matrix} from 'mathjs'
const config = require('./config.json')
const Binance = require('node-binance-api')
const dfd = require("danfojs-node")
let ohlc = [];

const nn = new NeuralNetwork(3, 6, 1);

const binance = new Binance().options({
  APIKEY: config.BINANCE_KEY,
  APISECRET: config.BINANCE_SECRET,
  useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
  test: false // If you want to use sandbox mode where orders are simulated
})

binance.websockets.chart('BNBUSDT', '5m', async (symbol, interval, chart) => {
    let i = 0;
    // let tick = binance.last(chart)
    // let last = chart[tick].close
    // console.info(symbol+" last price: "+last)
    ohlc = await binance.ohlc(chart);
    console.info(symbol, ohlc);
    let targetArray = [];
    let inputArray = [];
    let testArray = [];
    let min = '';
    let max = '';
    let scaler = new dfd.StandardScaler()

    let data = [ohlc.open,ohlc.high,ohlc.low,ohlc.open,ohlc.volume]
    let df = new dfd.DataFrame(data)

    scaler.fit(df)

    let df_enc = scaler.transform(df)

    for (let index = 400; index < ohlc.close.length - 1; index++) {
       
        inputArray.push([df_enc.data[0][index - 1], df_enc.data[3][index - 1], df_enc.data[4][index - 1]])
        console.log(ohlc.high[index] - ohlc.close[index])
        if (ohlc.high[index] - ohlc.close[index - 1] > 0.05) {
            targetArray.push([1])
        } else {
            targetArray.push([0])
        }
    }

    const input = matrix(inputArray);
    const target = matrix(targetArray);
    
    
    nn.train(input, target);
    console.log('Prediction', nn.predict(input));
})

const normalize = (x, min, max) => {
    let y = (x - min) / (max - min)
    return y;
}