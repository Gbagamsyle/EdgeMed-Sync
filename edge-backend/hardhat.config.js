require('dotenv').config()
require('@nomiclabs/hardhat-ethers')

module.exports = {
  solidity: '0.8.19',
  networks: {
    sepolia: {
      url: process.env.BLOCKCHAIN_RPC_URL || '',
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    }
  }
}
