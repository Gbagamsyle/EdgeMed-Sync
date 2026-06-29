import { ethers } from 'ethers'

const CONTRACT_ABI = [
  'function anchorMerkleRoot(bytes32 merkleRoot, string batchId) public returns (bool)',
  'function getMerkleRoot(string batchId) public view returns (bytes32)'
]

const BLOCKCHAIN_RPC_URL = process.env.BLOCKCHAIN_RPC_URL
const BLOCKCHAIN_PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY
const BLOCKCHAIN_CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS

export const isBlockchainConfigured = () => {
  return !!(BLOCKCHAIN_RPC_URL && BLOCKCHAIN_PRIVATE_KEY && BLOCKCHAIN_CONTRACT_ADDRESS)
}

const getProvider = () => {
  if (!BLOCKCHAIN_RPC_URL) throw new Error('BLOCKCHAIN_RPC_URL is not configured')
  return new ethers.providers.JsonRpcProvider(BLOCKCHAIN_RPC_URL)
}

const getSigner = () => {
  if (!BLOCKCHAIN_PRIVATE_KEY) throw new Error('BLOCKCHAIN_PRIVATE_KEY is not configured')
  return new ethers.Wallet(BLOCKCHAIN_PRIVATE_KEY, getProvider())
}

const getContract = () => {
  if (!BLOCKCHAIN_CONTRACT_ADDRESS) throw new Error('BLOCKCHAIN_CONTRACT_ADDRESS is not configured')
  return new ethers.Contract(BLOCKCHAIN_CONTRACT_ADDRESS, CONTRACT_ABI, getSigner())
}

export const anchorMerkleRoot = async (batchId, merkleRootHex) => {
  if (!batchId || !merkleRootHex) {
    throw new Error('batchId and merkleRootHex are required')
  }

  const contract = getContract()
  const rootBytes = ethers.utils.hexlify(merkleRootHex.startsWith('0x') ? merkleRootHex : `0x${merkleRootHex}`)

  const tx = await contract.anchorMerkleRoot(rootBytes, batchId)
  const receipt = await tx.wait()

  return {
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    status: receipt.status === 1,
    gasUsed: receipt.gasUsed.toString()
  }
}

export const fetchOnChainMerkleRoot = async (batchId) => {
  if (!batchId) {
    throw new Error('batchId required')
  }

  const contract = getContract()
  const rootBytes = await contract.getMerkleRoot(batchId)
  return ethers.utils.hexlify(rootBytes)
}
