const MetaCoin = artifacts.require('./MetaCoin');

contract('Demo of interacting with contracts', async (accounts) => {
  it('logs the MetaCoin instance', async () => {
    const instance = await MetaCoin.deployed();
    console.log(instance);
  });
  it('should make a tx', async () => {
    const meta = await MetaCoin.deployed();

    try {
      // send coins to trigger a tx
      let res = await meta.sendCoin(accounts[1], 10, {
        from: accounts[0]
      });

      // result is an object with the following values:
      //
      // result.tx      => transaction hash, string
      // result.logs    => array of decoded events that were triggered within this transaction
      // result.receipt => transaction receipt object, which includes gas used

      // We can loop through result.logs to see if we triggered the Transfer event.
      for (let log of res.logs) {
        if ('Transfer' == log.event) {
          console.log("Transaction successful!");
          break;
        }
      }

    } catch (error) {
      // There was an error! Handle it.
      assert(false, error);
    }
  });
  it('should make a call', async () => {
    const meta = await MetaCoin.deployed();

    try {
      let balance = await meta.getBalance.call(accounts[0], {
        from: accounts[0]
      });

      console.log(balance.toNumber());
    } catch (error) {
      assert(false, error)
    }
  });
  /*
  it('should trigger the fallback function', async () => {
    try {
      const meta = await MetaCoin.new();
      const res = meta.send(web3.toWei(1, 'ether'));
      console.log(res);
    } catch (error) {
      assert(false, error);
    }
  });*/
});