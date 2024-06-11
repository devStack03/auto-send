require('dotenv').config();
const {Web3} = require('web3');

const BN = require('bn.js');


const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const MY_KEY = process.env.MY_KEY;
const RECIPIENT_ADDRESS = "0xfe31CfDf1d2777BbA22Bc84616d37c9a5587F561";//process.env.RECIPIENT_ADDRESS;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const THRESHOLD = 500000000000000;//process.env.THRESHOLD;

// const web3 = new Web3(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`);
const web3 = new Web3(`https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`);

const account = web3.eth.accounts.privateKeyToAccount(`0x${MY_KEY}`);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const recipientAddress = RECIPIENT_ADDRESS;

async function main() {
  try {
    const balance = await web3.eth.getBalance(account.address);
    console.log(`Current Balance: ${balance} WEI`);
    console.log(`Current threshold: ${new BN(THRESHOLD)} WEI`);
    console.log(`Current Balance: ${Web3.utils.fromWei(balance, 'ether')} ETH`);
    if (new BN(balance).gt( new BN(THRESHOLD))) {
      console.log('Token balance is above the threshold.');
      const gasPrice = await web3.eth.getGasPrice();
      // const gasLimit = 60000; // Estimate this properly for your token transfer

      const amountToSend = new BN(balance) - new BN(THRESHOLD); // Amount to send in ETH;
      console.log(`Amount to send: ${amountToSend} WEI`);
      const txCount = await web3.eth.getTransactionCount(account.address);
      const tx = {
        nonce: txCount, // + new BN(count++),
        from: account.address,
        to: RECIPIENT_ADDRESS,
        value: amountToSend,
        // gas: gasLimit,
        // gasPrice: gasPrice,
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
