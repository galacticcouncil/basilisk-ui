import BN from "bignumber.js"

export const BN_0 = new BN(0)
export const BN_1 = new BN(1)
export const BN_2 = new BN(2)
export const BN_10 = new BN(10)
export const BN_12 = new BN(12)

export const TRADING_FEE = new BN(3).div(new BN(1000))

// temporary values
export const DOLLAR_RATES = new Map([
  ["BSX", new BN(0.00015843)],
  ["Basilisk", new BN(0.00015843)],
  ["KSM", new BN(46.52)],
  ["Kusama", new BN(46.52)],
  ["AUSD", new BN(0.933333)],
  ["Acala USD", new BN(0.933333)],
])