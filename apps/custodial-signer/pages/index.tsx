import dynamic from 'next/dynamic'
import { config } from '../config'
import { SignPage } from '../src/components/SignPage'
import {
  FVSessionContextProvider,
  RPCCallContextProvider,
  RPCServerContextProvider,
  TenantContextProvider,
  useFVSession,
  useRPCCallContext,
  useRPCServerContext,
} from '../src/providers'

function IndexWrapper() {
  return (
    <RPCCallContextProvider defaultIdpUrl={config.public.defaultIdpURL}>
      <FVSessionContextProvider>
        <RPCServerContextProvider>
          <TenantContextProvider>
            <Index />
          </TenantContextProvider>
        </RPCServerContextProvider>
      </FVSessionContextProvider>
    </RPCCallContextProvider>
  )
}

function Index() {
  const { user } = useFVSession()
  const { activeRequest } = useRPCServerContext()
  const { pendingRPCCall } = useRPCCallContext()

  const { payload } = pendingRPCCall as { payload: Record<string, string> }
  const message = payload.message || payload.transaction
  return <SignPage user={user} request={activeRequest} message={message} />
}

export default dynamic(() => Promise.resolve(IndexWrapper), {
  ssr: false,
})
