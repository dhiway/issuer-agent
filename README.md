# Issuer-Agent: Verifiable Credentials on CORD Blockchain

The Issuer-Agent is a backend service that enables the creation, issuance, and on-chain anchoring of Verifiable Credentials (VCs) using the CORD blockchain. It follows the W3C Verifiable Credentials standards to ensure security, interoperability, and decentralization. This service is built using Node.js and exposes a set of APIs to interact with credentials and registries.

## ✨ Key Features

- **Credential Issuance**: Issue cryptographically signed Verifiable Credentials compliant with W3C standards.
- **Blockchain Anchoring**: Anchor credential hashes on the CORD blockchain for tamper-evidence.
- **Decentralized Identity Support**: Built-in DID management and integration with the CORD identity layer.
- **Swagger Docs**: Explore and test API endpoints via an interactive Swagger UI.

---

## 📅 Prerequisites

Make sure the following are installed on your system:

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Yarn](https://classic.yarnpkg.com/en/docs/install)
- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/)

---

## 📚 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/dhiway/issuer-agent.git
cd issuer-agent
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Create a Stash Account

```bash
yarn create:stash-account
```

This will generate a stash account with a mnemonic phrase. Save the phrase securely and add it to your environment variables.

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
STASH_ACC_MNEMONIC="your twelve word mnemonic phrase"
```

Ensure your stash account is funded. You can contact Dhiway for testnet funds if needed.

---

## 🚀 Running the Project

### Option 1: Using Docker (Recommended)

1. **Build the Docker image**

```bash
docker build . -t dhiway/issuer-agent:latest -f Dockerfile
```

2. **Start the service**

```bash
docker compose up -d
```

### Option 2: Running Locally with Node.js

```bash
yarn dev
```

---

## 🔍 API Documentation

### Swagger UI:

Access interactive documentation at:

```
 https://dhiway.github.io/dhiway-api-docs/issuer-agent
```

### Postman:

Import the `postman_collection.json` file provided in the repo to quickly test APIs with pre-configured requests.

#### Available APIs:

- `POST /profile` → Create and link a profile
- `POST /registry` → Anchor the credential hash and schema to the blockchain
- `POST /credential/issue` → Issue a Verifiable Credential

> Note: There is no standalone schema creation API. Schemas are passed as part of the registry creation or credential issuance payload.

---

## 💡 Development Workflow

1. **Create Profile**: Register an entity (person/org) to issue credentials.
2. **Create Registry**: Define and anchor the credential structure and metadata to the blockchain.
3. **Issue Credential**: Generate a VC using the created profile and registry.
4. **Verify**: Use public chain data and cryptographic signatures to validate.

---

## 🎓 CORD.js SDK

For advanced use cases or integrating directly with the blockchain:

- GitHub: [https://github.com/dhiway/cord.js]
- Features:

  - DID management
  - Credential creation & verification
  - On-chain registry access
  - Signing utilities

---

## 🛠️ Architecture Overview

```
┌──────────────┐     ┌───────────────┐     ┌────────────────────┐
│  Client App  ├────>│ Issuer-Agent  ├────>│  CORD Blockchain    │
└──────────────┘     └───────────────┘     └────────────────────┘
                           │
                           ▼
                    ┌───────────────┐
                    │  VC Storage   │
                    └───────────────┘
```

---

## 🌟 Contributing

We welcome contributions to the Issuer-Agent! Follow these steps:

1. Fork the repo
2. Create a new feature branch
3. Commit and push your changes
4. Submit a pull request with a clear description

---

## 🌐 Support & Contact

For technical support or help funding your stash account:

- Website: [https://dhiway.com](https://dhiway.com)
- GitHub: [https://github.com/dhiway](https://github.com/dhiway)

---
