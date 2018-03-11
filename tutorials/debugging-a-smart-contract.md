# 智能合约调试教程  

时间：2017-10-23  
作者：Mike Pumphrey  
原文：http://truffleframework.com/tutorials/debugging-a-smart-contract  

> 注：本教程依赖4.0或其以上版本的Truffle  

以太坊中的一个智能合约只是一些代码。与我们在其他地方常见的“纸质”的合约不同，这种合约需要以非常简洁的方式表达出其意义。  

（稍加想象就会发现这个需要编译的真实世界合约将会变得简洁很多。因此，这是一个件好事。）

如果我们没有正确编写合约，相应的交易可能回失败，使得我们损失ether（表现为gas），更别提被浪费的时间和精力。

好在Truffle（从4.0.0版本开始）内置了一个调试器用于单步调试我们的代码，使得我们在遇见错误时，能够找出确切的问题并在引导下修复它。  

在本教程中，我们把一个简单的合约发布到测试链上，在合约中引入一些错误，然后利用Truffle内置的调试器修正它们。

## 一个简单的智能合约  
一个简单的storage合约是众多基本和有意义的智能合约之一。（以下例子摘录自[Solidity的官方文档](https://solidity.readthedocs.io/en/develop/introduction-to-smart-contracts.html)）

```
pragma solidity ^0.4.17;

contract SimpleStorage {
  uint myVariable;

  function set(uint x) public {
    myVariable = x;
  }

  function get() constant public returns (uint) {
    return myVariable;
  }
}
```

以上合约实现两个目标：  
+ 允许我们设置一个变量（`myVariable`）的值为一个特定的整数值  
+ 允许我们通过查询`myVariable`获得设置值  

这不是个非常有趣的合约，但这是本教程关注的重点。我们想要看看程序出错会导致的现象。  

我们首先需要搭建好演示的环境。  
## 部署一个基本的智能合约  
1. 新建一个用于存放我们合约的本地目录   
```bash
mkdir simple-storage
cd simple-storage
```

2. 创建一个基础的Truffle项目  
```bash
truffle init
``` 
这一步会在当前目录下创建`contracts/`和`migrations/`等目录，并在其中生成一些部署合约到区块链所需的文件。  

3. 在`contracts/`目录下创建一个名为`Store.sol`的文件，并写入以下内容  
```
pragma solidity ^0.4.17;

contract SimpleStorage {
  uint myVariable;

  function set(uint x) public {
    myVariable = x;
  }

  function get() constant public returns (uint) {
    return myVariable;
  }
}
```
以上就是我们将会调试的合约。本教程不会涉及这个文件的细节。可见，这是一个名为`SimpleStorage`的合约，它有一个数值变量`myVariable`和两个函数：`set()`和`get()`。`set()`函数将`myVariable`设为一个给定值，`get()`则用于查询设置的值。  

4. 在`migrations/`目录下创建一个名为`2_deploy_contracts.js`的文件，并写入以下内容   
```javascript
var SimpleStorage = artifacts.require("SimpleStorage");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
};
```
这个文件描述了将合约`SimpleStorage`部署到链上的相关指令。  

5. 在终端执行命令编译合约  
```bash
truffle compile
``` 

6. 再打开一个终端，运行`truffle develop`命令启动一条开发链。这是一条内置于Truffle的区块链，可用于测试我们的合约  
```bash
truffle develop
```
控制台的命令行提示符变为`truffle(develop)`。除非特别说明，往后所有命令都从这个命令行提示窗口中输入。  

7. 开发控制台成功启动并运行后，我们执行部署操作就可以将合约部署到链上了  
```bash
migrate
```
相应的反馈信息应该和以下内容类似，只是其中特定的ID会有所不同   
```bash
Running migration: 1_initial_migration.js
   Replacing Migrations...
   ... 0xe4f911d95904c808a81f28de1e70a377968608348b627a66efa60077a900fb4c
   Migrations: 0x3ed10fd31b3fbb2c262e6ab074dd3c684b8aa06b
 Saving successful migration to network...
   ... 0x429a40ee574664a48753a33ea0c103fc78c5ca7750961d567d518ff7a31eefda
 Saving artifacts...
 Running migration: 2_deploy_contracts.js
   Replacing SimpleStorage...
   ... 0x6783341ba67d5c0415daa647513771f14cb8a3103cc5c15dab61e86a7ab0cfd2
   SimpleStorage: 0x377bbcae5327695b32a1784e0e13bedc8e078c9c
 Saving successful migration to network...
   ... 0x6e25158c01a403d33079db641cb4d46b6245fd2e9196093d9e5984e45d64a866
 Saving artifacts...
```

## 与这个基本的智能合约进行交互  
我们的智能合约就这样被部署到了测试网络。这个测试网络的搭建需要通过`truffle develop`命令启动一个和[Ganache](http://truffleframework.com/ganache)（Truffle内置用于开发的一条本地链）对接的[控制台](http://truffleframework.com/docs/getting_started/console)。 

接下来，我们将会在与这个合约交互中查明它在正常情况下的工作方式。交互会用到`truffle develop`控制台。

> 注：因为Truffle Develop控制台为我们处理了挖矿问题，所以我们不用担心交易的安全问题。如果您用了不同的网络，请确保通过挖矿让您的交易上链。  

1. 在`truffle develop`命令启动的控制台中，执行以下命令  
```javascript
SimpleStorage.deployed().then(function(instance){return instance.get.call();}).then(function(value){return value.toNumber()});
```
这个命令查看合约`SimpleStorage`，然后调用其定义的`get()`函数。它随后返回一个通常渲染为字符串的输出，并将其转化为一个数值：
```bash
0
```
输出表明：尽管我们还没有设定`myVariable`的值，它的值已经为0了。这是因为Solidity中初始化整形变量会被自动赋值为0。而在其他语言中它的值可能被设为`NULL`或`undefined`。  

2. 我们现在利用合约进行一笔交易。具体操作未执行`set()`函数来将变量`myVariable`的值设为其他整数，命令如下  
```javascript
SimpleStorage.deployed().then(function(instance){return instance.set(4);});
```
这个操作降变量值设为`4`。控制台输出显示了交易相关的部分信息，包括交易的ID（哈希值）、收款人和交易触发的所有事件日志：
```javascript
 { tx: '0x7f799ad56584199db36bd617b77cc1d825ff18714e80da9d2d5a0a9fff5b4d42',
   receipt:
    { transactionHash: '0x7f799ad56584199db36bd617b77cc1d825ff18714e80da9d2d5a0a9fff5b4d42',
      transactionIndex: 0,
      blockHash: '0x60adbf0523622dc1be52c627f37644ce0a343c8e7c8955b34c5a592da7d7c651',
      blockNumber: 5,
      gasUsed: 41577,
      cumulativeGasUsed: 41577,
      contractAddress: null,
      logs: [] },
   logs: [] }
```
其中，交易ID对我们最为重要（输出中的对应项未`tx`和`transactionHash`）。调试时回用到这个值。  
> 注：您具体操作时的交易ID应该和此处输出的不同。  

3. 再次调用`get()`函数验证变量值的变化：  
```bash
SimpleStorage.deployed().then(function(instance){return instance.get.call();}).then(function(value){return value.toNumber()});
```
相应的输出应为：
```bash
4
```

## 调试错误  
以上部分描述了合约正常工作的情形。现在，我们在合约中引入一些小错误然后重新部署它，然后查看问题的表现形式，并借助Truffle内置的调试能力来修复这些问题。  

我们会看到一下问题：  
+ 无限循环  
+ 非法错误检查  
+ 无错误，但是函数没有按预期运行  

### 问题1：无限循环  
在以太坊区块链中，交易是无法设定为永远执行的。  

一个交易会持续进行直至消耗的gas达到上限。一旦出现gas消耗完毕，这个交易就会报错，返回一个“out of gas”错误。  

由于gas是以ether计价的，这个错误事关现实世界的经济问题。因此，消除这个out-of-gas错误是相当重要的。  

#### 引入错误  
创造一个无限循环时很容易的。  

1. 用文本编辑器打开`contracts/`目录下的`Store.sol`文件  

2. 将`set()`函数的内容替换为  
```
function set(uint x) public {
  while(true) {
    myVariable = x;
  }
}
```
`while(true)`条件使得这个函数会永远执行。    

### 测试合约  
在Truffle Develop控制台中，无需退出然后重启控制台，我们就可以部署更新的合约。因为`migrate`命令合并了编译和部署两步操作，我们只需一步就可以将链上的合约重置。  
1. 在Truffle Develop控制台中执行命令更新合约：
```bash
migrate --reset
```
我们会看到编译和部署的输出。  

2. 为了便于查错，打开另一个控制台用于输出日志。通过这个控制台，我们可以查看失败交易的ID等。在另一个终端窗口中执行以下命令：  
```bash
truffle develop --log
```
暂时不用理这个窗口，并回到之前的控制台窗口。  

3. 现在我们可以开始进行交易了。执行同上`set()`命令  
```javascript
SimpleStorage.deployed().then(function(instance){return instance.set(4);});
```
这时可以看到以下错误：  
```bash
Error: VM Exception while processing transaction: out of gas
```
在负责输出日志的控制台中，我们可以看到更多信息：  
```bash
develop:testrpc eth_sendTransaction +0ms
develop:testrpc  +1s
develop:testrpc   Transaction: 0xe493340792ab92b95ac40e43dca6bc88fba7fd67191989d59ca30f79320e883f +2ms
develop:testrpc   Gas usage: 4712388 +11ms
develop:testrpc   Block Number: 6 +15ms
develop:testrpc   Runtime Error: out of gas +0ms
develop:testrpc  +16ms
```
错误和交易ID在手，我们现在开始调试这个交易。  

### 调试查明问题  
Truffle有一个内置的调试器。在Truffle Develop控制台执行`debug <Transaction ID>`或在终端执行`truffle debug <Transaction ID>`均可启动这个调试工具。让我们开始调试吧～  

1. 在Truffle Develop控制台中，从日志控制台复制交易ID并粘贴为`debug`命令的参数：
```bash
debug 0xe493340792ab92b95ac40e43dca6bc88fba7fd67191989d59ca30f79320e883f
```
> 注：再次说明，您具体操作时的交易ID会和上面的有所不同。  
我们会看到以下输出：  
```bash
Gathering transaction data...

   Addresses affected:
     0x377bbcae5327695b32a1784e0e13bedc8e078c9c - SimpleStorage

   Commands:
   (enter) last command entered (step next)
   (o) step over, (i) step into, (u) step out, (n) step next
   (;) step instruction, (p) print instruction, (h) print this help, (q) quit

   Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

   1: pragma solidity ^0.4.17;
   2:
   3: contract SimpleStorage {
      ^^^^^^^^^^^^^^^^^^^^^^^

   debug(develop:0xe4933407...)>
```
这是一个交互式的控制台。我们可以利用列出的命令和代码进行不同方式的交互。  

2. 最为常用的交互方式是“下一步”（step next）：每次往下执行代码的一条指令。单击回车键或`n`即可到下一步。  
相应的输出如下：  
```
Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

4:   uint myVariable;
5:
6: function set(uint x) public {
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```
可见程序已经运行到了行号未6的下一条指令。（^号指向当前正在执行的指令）  

3. 再次点击回车进入下一条指令  
```bash
Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

5:
6: function set(uint x) public {
7:   while(true) {
     ^^^^^^^^^^^^
```

4. 继续点击回车  
```bash
Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

5:
6: function set(uint x) public {
7:   while(true) {
           ^^^^

debug(develop:0xe4933407...)>

Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

5:
6: function set(uint x) public {
7:   while(true) {
     ^^^^^^^^^^^^

debug(develop:0xe4933407...)>

Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

6: function set(uint x) public {
7:   while(true) {
8:     myVariable = x;
                    ^

debug(develop:0xe4933407...)>

Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

6: function set(uint x) public {
7:   while(true) {
8:     myVariable = x;
       ^^^^^^^^^^

debug(develop:0xe4933407...)>

Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

6: function set(uint x) public {
7:   while(true) {
8:     myVariable = x;
       ^^^^^^^^^^^^^^

debug(develop:0xe4933407...)>

Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

5:
6: function set(uint x) public {
7:   while(true) {
     ^^^^^^^^^^^^
```
最后我们发现其中一些步骤不断重复。事实上，不断点击回车会在这些指令间不断循环（更准确地说是直到交易消耗完gas为止）。我们通过这种现象就发现了问题所在。  
5. 输出`q`退出调试  

### 问题2：非法的错误检查  
智能合约能够利用`assert()`等语句确保特定条件被满足。这种操作可能会产生与合约的状态不可调和的矛盾。  

我们在此引入一个类似的条件，然后看看调试器如何帮我们查出来。  

#### 引入错误  
1. 再次打开`Store.sol`  

2. 将`set()`函数的内容替换为  
```
function set(uint x) public {
  assert(x == 0);
  myVariable = x;
}
```

这个合约和原始版本一样，只是添加一个`assert()`函数以确保`x == 0`。除非我们输入的`x`为0，否则相应的问题就会出现。  

#### 测试合约  
和之前类似，我们重置链上的合约。  
1. 在Truffle Develop控制台中，将合约重置为起初始部署的状态：  
```bash
migrate --reset
```

2. 现在我们就可以测试新的交易了。执行和之前一样的命令：
```javascript
SimpleStorage.deployed().then(function(instance){return instance.set(4);});
```
我们会发现以下错误：
```bash
Error: VM Exception while processing transaction: invalid opcode
```
也就是说问题摆在了眼前。  

3. 在日志窗口可以看到相应的交易ID和错误。 

#### 调试查明问题  
1. 复制交易ID作为`debug`命令的参数  
```bash
debug 0xe493340792ab92b95ac40e43dca6bc88fba7fd67191989d59ca30f79320e883f
```
> 注：再次说明，您具体操作时的交易ID会和上面的有所不同。  
回到调试界面：
```bash
Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

   1: pragma solidity ^0.4.17;
   2:
   3: contract SimpleStorage {
      ^^^^^^^^^^^^^^^^^^^^^^^

   debug(develop:0xe4933407...)>
```

2. 点击回车几下，逐步执行代码。最后，调试器会停止并报以下错误：  
```bash
Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

5:
6:   function set(uint x) public {
7:     assert(x == 0);
       ^^^^^^^^^^^^^^

debug(develop:0x7e060037...)>

Transaction halted with a RUNTIME ERROR.

This is likely due to an intentional halting expression, like 
assert(), require() or revert(). It can also be due to out-of-gas
exceptions. Please inspect your transaction parameters and 
contract code to determine the meaning of this error.
```
正是这个最后的事件触发了错误。稍作推理就知道问题出在`assert()`函数上面。  

### 问题3：函数没有按预期执行  
有时，一个错误并不是一个真正的错误。它没有在运行时引发问题，只是做了我们没有预想到的事情。  

以这样一个设定为例：根据我们的变量的奇偶性分别触发不同的事件。如果我们无意中将事件的触发条件反转了，它并不会引发错误。然而，合约就会按非预期的方式运行了。  

我们再次利用调试器来查看哪里出现了问题。  

#### 引入错误  
1. 再次打开`Store.sol`  

2. 将`set()`函数的内容替换为  
```
event Odd();
event Even();

function set(uint x) public {
  myVariable = x;

  if (x % 2 == 0) {
    Odd();
  } else {
    Even();
  }
}
```

我们引入了两个虚设的事件`Odd()`和`Even()`：根据`x`是否能够被2整除而触发。  

但是，我们这里把它们的出发条件弄反了。如果`x`能够被2整除，事件`Odd()`事件就会发生。  

#### 测试合约  
和之前类似，我们重置链上的合约。  
1. 在Truffle Develop控制台中，将合约重置为起初始部署的状态：  
```bash
migrate --reset
```
我们可以看到编译和部署的输出。  

2. 现在我们就可以测试新的交易了。执行和之前一样的命令：
```javascript
SimpleStorage.deployed().then(function(instance){return instance.set(4);});
```
可见没有错误出现。反馈信息为一个交易ID附带其他具体信息：  
```
{ tx: '0x7f799ad56584199db36bd617b77cc1d825ff18714e80da9d2d5a0a9fff5b4d42',
  receipt:
   { transactionHash: '0x7f799ad56584199db36bd617b77cc1d825ff18714e80da9d2d5a0a9fff5b4d42',
     transactionIndex: 0,
     blockHash: '0x08d7c35904e4a93298ed5be862227fcf18383fec374759202cf9e513b390956f',
     blockNumber: 5,
     gasUsed: 42404,
     cumulativeGasUsed: 42404,
     contractAddress: null,
     logs: [ [Object] ] },
  logs:
   [ { logIndex: 0,
       transactionIndex: 0,
       transactionHash: '0x7f799ad56584199db36bd617b77cc1d825ff18714e80da9d2d5a0a9fff5b4d42',
       blockHash: '0x08d7c35904e4a93298ed5be862227fcf18383fec374759202cf9e513b390956f',
       blockNumber: 5,
       address: '0x377bbcae5327695b32a1784e0e13bedc8e078c9c',
       type: 'mined',
       event: 'Odd',
       args: {} } ] }
```
但是，交易日志里面显示的事件是`Odd()`。这与我们的预期不符，我们需要查明它为什么被触发了。  

### 调试查明问题  
1. 复制交易ID作为`debug`命令的参数  
```bash
debug 0x7f799ad56584199db36bd617b77cc1d825ff18714e80da9d2d5a0a9fff5b4d42
```
> 注：再次说明，您具体操作时的交易ID会和上面的有所不同。  
我们再次进入调试界面。  

2. 点击回车几下，往下执行指令。最后我们就会发现触发事件`Odd()`的条件：  
```
Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

10:   function set(uint x) public {
11:     myVariable = x;
12:     if (x % 2 == 0) {
        ^^^^^^^^^^^^^^^^

debug(develop:0x7f799ad5...)>

Store.sol | 0x377bbcae5327695b32a1784e0e13bedc8e078c9c:

11:     myVariable = x;
12:     if (x % 2 == 0) {
13:       Odd();
          ^^^^^

debug(develop:0x7f799ad5...)>
```
问题查明。这个判断条件触发了错误的事件。  

## 结论  
Truffle赋予了我们直接调试我们合约的能力，使得我们具有更多手段编写稳健和安全部署的智能合约。我们应多加阅读关于Truffle Develop控制台和调试器的文档。遇到问题时，请加入我们的[Gitter交流频道](https://gitter.im/ConsenSys/truffle)，在那里提出您的问题。  

祝您调试愉快～  