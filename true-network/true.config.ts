
import { TrueApi, testnet } from '@truenetworkio/sdk'
import { TrueConfig } from '@truenetworkio/sdk/dist/utils/cli-config'

// If you are not in a NodeJS environment, please comment the code following code:
import dotenv from 'dotenv'
dotenv.config()

export const getTrueNetworkInstance = async (): Promise<TrueApi> => {
  const trueApi = await TrueApi.create(config.account.secret)

  await trueApi.setIssuer(config.issuer.hash)

  return trueApi;
}

export const config: TrueConfig = {
  network: testnet,
  account: {
    address: 'jvkXtXF15aZe3fEeRMh3n8oqTGcyEmxfpuojVSqk8bJhsoo',
    secret: process.env.TRUE_NETWORK_SECRET_KEY ?? ''
  },
  issuer: {
    name: 'attester',
    hash: '0x8153040c2fa602bc5fdafe95656e999fdf9c8b62bf81276ef3bbf41718fce794'
  },
  algorithm: {
    id: undefined,
    path: 'acm',
    schemas: []
  },
}
  