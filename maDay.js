//成交价格,上一次循环中的均线状况,本次循环中的均线状况,持仓信息
var ratio, value, nowFlag, position, ticker, account, price, lastFlag = null, buyOrSell;

//平仓
function close() {
    //没有仓位信息不处理
    if (null == position || position.length == 0 || !position[0].Amount) {
        return;
    }
    //获取所有仓位信息并依此平仓
    for (var index in position) {
        //Type == 1凭空， type==0 平多
        var po = position[index];
        //Log("平仓", ticker)
        if (po.Type == 1) {
            exchange.SetDirection("closesell");
            exchange.Buy(ticker.Last + 10, po.Amount);
        } else {
            exchange.SetDirection("closebuy");
            exchange.Sell(ticker.Last - 10, po.Amount);
        }
    }
}

//花费所有余额购买
function buyAll() {
    close();
    //开多
    exchange.SetDirection("buy");
    // exchange.SetMarginLevel(marginLevel);
    account = _C(exchange.GetAccount);
    if (switchKey != 0) {
        let price = _N(ticker.Sell, 6);
        let amount = _N(_N(ticker.Sell * ratio, 5) * account.Stocks, 0);
        exchange.Buy(price, amount);
        // exchange.Buy(_N(ticker.Sell, 5), _N(_N(ticker.Sell * ratio, 5) * marginLevel * account.Stocks / 95, 0));
    }
}

//卖出所有
function sellAll() {
    close();
    //开空
    exchange.SetDirection("sell");
    account = _C(exchange.GetAccount);
    if (switchKey != 0) {
        let price = _N(ticker.Sell, 6);
        let amount = _N(_N(ticker.Sell * ratio, 5) * account.Stocks, 0);
        exchange.Sell(price, amount);
    }
}

function onTick() {
    // 价格突破均线买入，跌破均线卖出
    if ("low" == lastFlag && "high" == nowFlag) {
    //    Log("开空",b,  price, ma5Price, ticker.Last)
        Log("涨过均线，买入:" + ticker.Last + "  " + getMAPrice());
        buyAll();
    } else if ("high" == lastFlag && "low" == nowFlag) {
    //    Log("开多",b, price, ma5Price, ticker.Last)
        Log("跌破均线，卖出:" + ticker.Last + "  " +  getMAPrice());
        sellAll();
    } else {

    }
    //更新均线状况
    lastFlag = nowFlag;
}

//初始化全局函数
function initValue() {
    position = exchange.GetPosition(); //仓位状况
    ticker = exchange.GetTicker(); //买卖信息
    account = _C(exchange.GetAccount); //账户信息
    // 当前价格高于均线，则标记为high，否则为low
    nowFlag = ticker.Last > getMAPrice() ? "high" : "low";
    //第一次运行进行初始化
    if (null == lastFlag) {
        lastFlag = nowFlag;
    }
}

function getMAPrice() {
    var maRequired = TA.MA(exchange.GetRecords(PERIOD_D1), dayLimit);
    priceMA = maRequired[maRequired.length - 1];
    return priceMA;
}

function main() {
    //设置合约类型，不同交易所可设置类型可能不同. 未添加防爆仓机制,倍率过高爆仓时则收益清空.设置的数值留有空间，因此可以忽略手续费
    // BitMEX: XBTUSD
    exchange.SetContractType(contractType);
    exchange.SetMarginLevel(marginLevel);
    ratio = (100 - Marker * 5) / 100;
    Log("switchKey:" + switchKey);
    //Log("脚本开始运行" + new Date() + "@");
    while (true) {
        //   Log("脚本正常运行中:" + new Date() + "@");
        initValue();
        onTick();
        //休眠，进入下一轮循环
        Sleep(1000 * 60 * sleepTime);
    }
}
