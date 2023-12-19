
## API-Endpoint
`http://localhost:8088/api/getBalance/"Your Address Here"`

## Testnet 
Sepolia

## TestTokenAddress
0x3Fd55Be18574E83BB7B280a5664cFcEBF05E8271

## Endpoint and Config can be found In?
/controller/TestToken/ folder

## Contract (Test Token)
 In the /src/ folder

## How to compile the contract
 Use forge build/compile to compile the contract

 ## Endpoint Response Format:
 JSON
 example: {
  "address": "0x4932b72f8F88e741366a30aa27492aFEd143A5E1",
  "balance": "0"
}

`No access Control specifier on testToken so anyone can mint the Tokens.`
`Contract is verified on Etherscan. So you can use that to mint Tokens.`

Script for mint tokens is not written because of use of deployer key and rpc url in foundry


