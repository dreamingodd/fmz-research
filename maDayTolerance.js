/**
Parameters needed:
sleepTime 休眠时间 recommend default: 1440(分钟-1天)
dayLimit 均线范围 recommend default: 83(AK)
contractType 合约类型 recommend default: XBTUSD(BitMEX)
Marker 手续费 recommend default: 0.1(千分之一)
*/
//成交价格,上一次循环中的均线状况,本次循环中的均线状况,持仓信息
var ratio, value, nowFlag, position, ticker, account, price, lastFlag = null, buyOrSell, nowStatus = false, nowDate;

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
            exchange.Buy(ticker.Last + 1, po.Amount);
        } else {
            exchange.SetDirection("closebuy");
            exchange.Sell(ticker.Last - 1, po.Amount);
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
        let price = _N(ticker.Sell, 6) + 50;
        let amount = _N(_N(ticker.Sell * ratio, 5) * account.Stocks, 0);
        exchange.Buy(price, amount);
        var i = 1;
        while (null != position && position.length != 0 && position[0].Amount) {
            Log(position)
            if (i > 10) break;
            Sleep(1000 * 60 * 1);
            i++;
        }
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
    let maPrice = getMAPrice();
    //收线价格是否高于均线
    let tempStatus = ticker.Last > maPrice;
    //忽略波动过小的交叉
    let absValue = Math.abs(1 - (ticker.Last / maPrice));
    //如果均线指向没有发生变化则不操作,操作之后3天内不不操作
    if(tempStatus == nowStatus || getNowDate() - nowDate < (1000 * 3600 * 24 * 5) || absValue < 0.01){
        return;
    }
    //一天只交易一次
    nowDate = getNowDate();
    //Log(maPrice,  ticker.Last, nowStatus, tempStatus, absValue)
    nowStatus = tempStatus;
    // 价格突破均线买入，跌破均线卖出
    if (nowStatus) {
    //    Log("开空",b,  price, ma5Price, ticker.Last)
        Log("涨过均线，买入:" + ticker.Last + "  " + getMAPrice());
        buyAll();
    } else {
    //    Log("开多",b, price, ma5Price, ticker.Last)
        Log("跌破均线，卖出:" + ticker.Last + "  " +  getMAPrice());
        sellAll();
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

function getNowDate(){
  return new Date().getTime();
}

function main() {
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
