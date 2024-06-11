require('dotenv').config();
const {Web3} = require('web3');

const BN = require('bn.js');


const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const MY_KEY = process.env.MY_KEY;
const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const THRESHOLD = process.env.THRESHOLD;

const web3 = new Web3(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`);
// const web3 = new Web3(`https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`);

const account = web3.eth.accounts.privateKeyToAccount(`0x${MY_KEY}`);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const recipientAddress = RECIPIENT_ADDRESS;

const tokenABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_to', type: 'address' }, { name: '_value', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function'
  }
];

const tokenContract = new web3.eth.Contract(tokenABI, TOKEN_ADDRESS);
var count = 0;
async function main() {
  try {
    const balance = await tokenContract.methods.balanceOf(account.address).call();
    const tokenDecimals = 18; // Adjust this according to your token's decimals
    const tokenBalance = new BN(balance).div(new BN(10).pow(new BN(tokenDecimals)));
    const threshold = new BN(THRESHOLD);

    console.log(`Token Balance: ${tokenBalance.toString()}`);

    if (tokenBalance.gt(threshold)) {
      const gasPrice = await web3.eth.getGasPrice();
      // const gasLimit = 60000; // Estimate this properly for your token transfer

      const amountToSend = new BN(tokenBalance).mul(new BN(10).pow(new BN(tokenDecimals)));
      const txCount = await web3.eth.getTransactionCount(account.address);
      const tx = {
        nonce: txCount, // + new BN(count++),
        from: account.address,
        to: TOKEN_ADDRESS,
        // gas: gasLimit,
        // gasPrice: gasPrice,
        data: tokenContract.methods.transfer(recipientAddress, amountToSend.toString()).encodeABI()
      };

      const gasLimit = await web3.eth.estimateGas(tx);
      console.log(gasLimit);
      // Check ETH balance for gas fee
      const ethBalance = await web3.eth.getBalance(account.address);
      const estimatedGasFee = new BN(gasPrice).mul(new BN(gasLimit));
      console.log(estimatedGasFee);

      if (new BN(ethBalance).lt(estimatedGasFee)) {
        console.log('Not enough ETH for gas fee.');
        setTimeout(function () {
          main();
        }, 5000);
        return;
      }

      tx.gas = gasLimit;
      tx.gasPrice = gasPrice;

      const signedTx = await web3.eth.accounts.signTransaction(tx, MY_KEY);
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      console.log('Transaction hash:', receipt.transactionHash);
      console.log('Transfer complete');
      main();

    } else {
      console.log('Token balance is below the threshold.');
      setTimeout(function () {
        main();
      }, 5000);
    }

  } catch (error) {
    console.error('Error:', error);
    setTimeout(function () {
      main();
    }, 5000);
  }
}

main();
