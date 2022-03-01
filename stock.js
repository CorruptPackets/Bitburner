/** @param {NS} ns **/
export async function main(ns) {
	//Format output as Money
	var currency = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',

	})

	ns.disableLog('disableLog');
	ns.disableLog('sleep');
	ns.disableLog('getServerMoneyAvailable');

	const stocktick = 6000;
	let counter = 0
	let asking = 0
	let pos = new Array()
	let sum = 0
	let total = 0

	//Builds Stock Object
	let stocks = ns.stock.getSymbols()
	for (let i = 0; i < stocks.length; i++) {
		stocks[i] = { sym: stocks[i], shares: 0, gains: new Array(), gainSum: 0, sGains: new Array(), sGainSum: 0 }
	}

	//Builds Gains Array
	while (counter < 5) {
		await ns.sleep(stocktick)
		getGains(stocks)
		counter++
		
	}
	counter = 0

	//Main Loop
	while (true) {

		await ns.sleep(stocktick)
		getGains(stocks)
		buyStocks(stocks)
		sellStocks(stocks)
		money(stocks)
	}



	//Money Counter
	function money(stocks){
		for (let i = 0; i < stocks.length; i++) {
			
			pos = ns.stock.getPosition(stocks[i].sym)
			sum = pos[0] * ns.stock.getBidPrice(stocks[i].sym)
			total = total + sum
			sum = 0
		}
		total = total + ns.getServerMoneyAvailable("home")
		ns.tprint(currency.format(total))
		total = 0

	}

	//Buy Loop
	function buyStocks(stocks) {

		for (let i = 0; i < stocks.length; i++) {
			if (stocks[i].gainSum >= 9) {
				let oneShares = ns.stock.getMaxShares(stocks[i].sym) * .01
				let fifteenPercent = ns.getServerMoneyAvailable("home") * 0.30
				let stockPrice = ns.stock.getAskPrice(stocks[i].sym)
				let fifteenShares = Math.floor(fifteenPercent / stockPrice)
				
				if (oneShares < fifteenShares) {
					ns.stock.buy(stocks[i].sym, oneShares)
					ns.tprint(stocks[i].sym + " Buying from One Percent " + oneShares + " Gains Sum: " + stocks[i].gainSum)

				}
				else if (fifteenShares > 5) {
					//Buy the stocks
					ns.stock.buy(stocks[i].sym, fifteenShares)
					ns.tprint(stocks[i].sym + " Buying from fifteen " + fifteenShares + " Gains Sum: " + stocks[i].gainSum)
				}
				//Error Check
				else {
					ns.tprintf('ERROR ' + "Purchase failed, not enough money or tried to purchase too few stocks.")
				}
				pos = ns.stock.getPosition(stocks[i].sym)
				stocks[i].shares = pos[0]

			}

		}
	}

	//Sell Loop
	function sellStocks(stocks) {

		for (let i = 0; i < stocks.length; i++) {
			if (stocks[i].sGainSum <= 1 && stocks[i].shares > 0) {
				let sellAmount = 0
				sellAmount = stocks[i].shares
				ns.tprint("Selling " + sellAmount + " of " + stocks[i].sym + " Sgain Sum " + stocks[i].sGainSum)
				ns.stock.sell(stocks[i].sym, sellAmount)
				stocks[i].shares = 0
			}
		}
	}

	//getGains
	function getGains(stocks) {

		for (let i = 0; i < stocks.length; i++) {
			let sym = stocks[i].sym
			asking = ns.stock.getAskPrice(sym)
			if (stocks[i].price < asking) {
				stocks[i].gains.push(1)
			}
			if (stocks[i].price > asking) {
				stocks[i].gains.push(0)
			}
			if (stocks[i].gains.length > 10) {
				stocks[i].gains.shift()
			}
			stocks[i].price = asking
			stocks[i].gainSum = 0
			stocks[i].sGainSum = 0
			//Calculate gainSum
			for (let g = 0; g < stocks[i].gains.length; g++) {
				stocks[i].gainSum += stocks[i].gains[g]
			}

		}
		//Calculate sGainSum
		for (let i = 0; i < stocks.length; i++) {
			stocks[i].sGains = stocks[i].gains.slice(-5)
			
			for (let s = 0; s < stocks[i].sGains.length; s++) {
				stocks[i].sGainSum += stocks[i].gains[s]
			}
		}

	}
}
