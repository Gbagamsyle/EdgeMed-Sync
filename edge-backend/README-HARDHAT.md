Hardhat Anchor Contract

This folder contains a minimal Solidity contract and Hardhat scripts to deploy an on-chain anchor for Merkle roots.

Quick steps:

1. Install dev dependencies in `edge-backend`:

```bash
cd edge-backend
npm install
```

2. Set env variables (do not commit private keys):

```
export BLOCKCHAIN_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"
export DEPLOYER_PRIVATE_KEY="0x..."
```

On Windows PowerShell use `$env:BLOCKCHAIN_RPC_URL = '...'` etc.

3. Compile contracts:

```bash
npm run compile:contracts
```

4. Deploy to Sepolia (example):

```bash
npm run deploy:sepolia
```

The deploy script will print the deployed contract address. Use that address as `BLOCKCHAIN_CONTRACT_ADDRESS` in your backend configuration.
