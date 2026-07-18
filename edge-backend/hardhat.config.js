import { config as loadEnv } from 'dotenv'
import '@nomiclabs/hardhat-ethers'

loadEnv()

export default {
  solidity: '0.8.19',
  networks: {
    sepolia: {
      url: process.env.BLOCKCHAIN_RPC_URL || '',
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : []
    }
  }
}
