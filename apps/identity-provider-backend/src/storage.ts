/* eslint-disable @typescript-eslint/no-unused-vars  -- this is just the interface */
/* eslint-disable @typescript-eslint/no-invalid-void-type  -- this is just the interface */

import { Adapter, AdapterPayload } from 'oidc-provider'

export class StorageAdapter implements Adapter {
  constructor(private readonly name: string) {}
  upsert(
    id: string,
    payload: AdapterPayload,
    expiresIn: number
  ): Promise<void | undefined> {
    throw new Error('Method not implemented.')
  }
  find(id: string): Promise<void | AdapterPayload | undefined> {
    throw new Error('Method not implemented.')
  }
  findByUserCode(userCode: string): Promise<void | AdapterPayload | undefined> {
    throw new Error('Method not implemented.')
  }
  findByUid(uid: string): Promise<void | AdapterPayload | undefined> {
    throw new Error('Method not implemented.')
  }
  consume(id: string): Promise<void | undefined> {
    throw new Error('Method not implemented.')
  }
  destroy(id: string): Promise<void | undefined> {
    throw new Error('Method not implemented.')
  }
  revokeByGrantId(grantId: string): Promise<void | undefined> {
    throw new Error('Method not implemented.')
  }
}

/* eslint-enable @typescript-eslint/no-invalid-void-type -- enable the rest  */
/* eslint-enable -- enable the rest  */
