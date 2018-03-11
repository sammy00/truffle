const MetaCoin = artifacts.require('MetaCoin');

contract('2nd MetaCoin test', async (accounts) => {
  it('should put 10000 MetaCoin in the first account', async () => {
    let instance = await MetaCoin.deployed();
    let balance = await instance.getBalance.call(accounts[0]);

    assert.equal(balance.valueOf(), 10000);
  });

  it('should calll a function that depends on a linked library', async () => {
    let meta = await MetaCoin.deployed();
    let outCoinBalance = await meta.getBalance.call(accounts[0]);
    let metaCoinBalance = outCoinBalance.toNumber();
    let outCoinBalanceEth = await meta.getBalanceInEth.call(accounts[0]);
    let metaCoinEthBalance = outCoinBalanceEth.toNumber();

    assert.equal(metaCoinEthBalance, 2 * metaCoinBalance);
  });

  it('should send coin correctly', async () => {
    // get initial balances of 1st and 2nd account
    let amount = 10;

    let meta = await MetaCoin.deployed();

    let balance = await meta.getBalance.call(accounts[0]);
    let a0_start = balance.toNumber();

    balance = await meta.getBalance.call(accounts[1]);
    let a1_start = balance.toNumber();

    // send coins
    await meta.sendCoin(accounts[1], amount, {
      from: accounts[0]
    });

    balance = await meta.getBalance.call(accounts[0]);
    let a0_end = balance.toNumber();

    balance = await meta.getBalance.call(accounts[1]);
    let a1_end = balance.toNumber();

    assert.equal(a0_end, a0_start - amount, "amount wasn't correctly taken from the sender");
    assert.equal(a1_end, a1_start + amount, "amount wasn't correctly sent to the receiver");
  });
});