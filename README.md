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

Ensure that you have Docker installed on your system to run the issuer-agent locally. Docker Compose is also required for managing multiple containers efficiently.

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

The service will now be running locally, and you can access the API documentation through the Swagger interface. Alternatively, you can also test the APIs by importing the Postman collection.

## API Documentation

- [Swagger_Documentation](https://issuer-agent.demo.dhiway.com/docs)

You can explore the API and interact with the service using Swagger. The Swagger documentation provides detailed information about available endpoints, request/response formats, and the overall workflow.
Swagger Documentation

- [Postman_Collection]
  Alternatively, the `postman_collection.json` file mentioned in the repository can be imported into Postman to test out the APIs directly. This collection contains pre-configured API requests, making it easier to interact with the issuer-agent.

# Further Implementation: CORD.js SDK (https://github.com/dhiway/cord.js)

For more advanced interactions with the CORD blockchain, you can use the cord.js SDK, which provides developers with tools to build on the CORD blockchain. This SDK is essential for managing identity, verifiable credentials, and interacting with CORD-based decentralized networks.

The cord.js repository offers comprehensive utilities for handling blockchain transactions, creating and managing decentralized identifiers (DIDs), and managing credentials programmatically.