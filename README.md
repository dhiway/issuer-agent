# Issuer-Agent: Verifiable Credentials on CORD Blockchain

This project demonstrates the APIs for creation and issuance of verifiable credentials in compliance with the W3C standards, using the CORD blockchain. The issuer-agent provides functionality for schema creation, credential issuance, and the anchoring of hashes on-chain, ensuring tamper-evident and verifiable data.

The primary objective of the project is to issue digital credentials that are cryptographically verifiable and anchored on the CORD blockchain. This offers trust and transparency, enabling entities to issue and manage verifiable credentials while adhering to decentralized identity standards.

## Key Features

- **Schema Creation**: Design and define credential schemas, forming the structure for verifiable credentials.
- **Verifiable Credential Issuance**: Issue credentials that are cryptographically signed and aligned with the W3C Verifiable Credentials standard.
- **CORD Blockchain Integration**: Anchor the issued credentials hash on the CORD blockchain to ensure tamper-evidence and verifiability.
- **Compliance**: Built to adhere to globally recognized standards for decentralized identity and credentialing, promoting interoperability and trust.

## Getting Started

To get the project up and running locally, follow the instructions below.

### Prerequisites

Ensure that you have the following installed on your system:

- Docker and Docker Compose for containerized deployment
- Node.js and Yarn for development setup

### Installation and Setup

1. **Install dependencies**

   ```bash
   yarn install
   ```

2. **Create a stash account**

   ```bash
   yarn create:stash-account
   ```

3. **Fund your account**

   - Load balance into your stash account, or contact Dhiway for funding assistance
   - Save your stash account mnemonic in the environment variable `STASH_ACC_MNEMONIC`

4. **Configure environment variables**
   Create a `.env` file in the project root and add your stash account mnemonic:
   ```env
   STASH_ACC_MNEMONIC="your twelve word mnemonic phrase here"
   ```

### Running Locally Using Docker

1. **Build the Docker image**  
   Build the Docker image for the issuer-agent using the following command:

   ```bash
   docker build . -t dhiway/issuer-agent:latest -f Dockerfile.mac
   ```

2. **Run the Docker container**  
   After building the image, use Docker Compose to bring up the necessary services in detached mode:

   ```bash
   docker compose up -d
   ```

The service will now be running locally, and you can access the API documentation through the Swagger interface. You can now start using the APIs for credential issuance and management.

## API Documentation

### Swagger Documentation

- **Live API Docs**: [https://issuer-agent.demo.dhiway.com/docs]

You can explore the API and interact with the service using Swagger. The Swagger documentation provides detailed information about available endpoints, request/response formats, and the overall workflow for:

- Creating credential schemas
- Issuing verifiable credentials
- Anchoring credentials on CORD blockchain
- Managing decentralized identities

### Postman Collection

For developers who prefer using Postman, import the `postman_collection.json` file included in this repository. This collection contains pre-configured API requests with example payloads, making it easier to test and interact with the issuer-agent APIs.

## Development Workflow

1. **Schema Definition**: Create and register credential schemas that define the structure and validation rules for your credentials.

2. **Credential Issuance**: Issue verifiable credentials based on your defined schemas, ensuring cryptographic signatures and W3C compliance.

3. **Blockchain Anchoring**: Anchor credential hashes on the CORD blockchain for tamper-evidence and decentralized verification.

4. **Verification**: Verify issued credentials using the anchored blockchain data and cryptographic proofs.

## Further Implementation: CORD.js SDK

For more advanced interactions with the CORD blockchain, leverage the **CORD.js SDK** available at [https://github.com/dhiway/cord.js](https://github.com/dhiway/cord.js).

The CORD.js SDK provides developers with comprehensive tools to build on the CORD blockchain, including:

- **Identity Management**: Create and manage decentralized identifiers (DIDs)
- **Credential Operations**: Programmatic credential creation, issuance, and verification
- **Blockchain Interactions**: Direct interaction with CORD blockchain for transactions and queries
- **Network Management**: Tools for connecting to and managing CORD-based decentralized networks

### Key SDK Features

- Complete DID document management
- Verifiable credential lifecycle management
- On-chain credential registry operations
- Cryptographic utilities for signing and verification
- Network utilities for blockchain communication

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  Issuer-Agent    │───▶│  CORD Blockchain │
│                 │    │     APIs         │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Credential     │
                       │    Storage       │
                       └──────────────────┘
```

## Contributing

We welcome contributions to improve the issuer-agent and expand its capabilities. Please follow the standard Git workflow:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request with a clear description of your improvements

## Support

For technical support, questions, or funding assistance for stash accounts, please contact Dhiway:

- **Website**: [https://dhiway.com](https://dhiway.com)
- **GitHub**: [https://github.com/dhiway](https://github.com/dhiway)