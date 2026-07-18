import hre from 'hardhat'

async function main() {
  console.log('Compiling contracts...')
  await hre.run('compile')

  const Anchor = await hre.ethers.getContractFactory('contracts/MerkleAnchor.sol:Anchor')
  console.log('Deploying Anchor contract...')
  const anchor = await Anchor.deploy()
  await anchor.deployed()

  console.log('Anchor deployed to:', anchor.address)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
