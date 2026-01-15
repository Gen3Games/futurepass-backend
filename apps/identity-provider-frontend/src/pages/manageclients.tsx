import * as t from 'io-ts'
import React from 'react'
import { hush } from '../common'
import { RoundedButton } from '../components'

const urlPattern =
  // eslint-disable-next-line no-useless-escape -- for some reason linter incorrectly parses this and thinks the escape is unnecessary
  /^(http|https):\/\/(?:[0-9]{1,3}\.){3}[0-9]{1,3}|localhost|(http|https):\/\/(?:[\w-]+\.)+[\w-]+(?:\:[0-9]+)?(\/.*)?$/

interface IRegistrationRequest {
  application_type: string
  redirect_uris: string[]
  client_name: string
  subject_type: string
  token_endpoint_auth_method: string
  grant_types: string[]
  response_types: string[]
}

interface IUpdateRequest extends IRegistrationRequest {
  client_id: string
}

const BasicResponse = {
  client_id: t.string,
  client_name: t.string,
  redirect_uris: t.array(t.string),
  registration_access_token: t.string,
}

const RegResponse = t.strict(BasicResponse)
type RegResponse = t.TypeOf<typeof RegResponse>

const ViewResponse = t.type(BasicResponse)
type ViewResponse = t.TypeOf<typeof ViewResponse>
type ClientType = 'web' | 'native'

export default function ManageClients() {
  //Register
  const [redirectUrls, setRedirectUrls] = React.useState<string[]>([])
  const [createClientType, setCreateClientType] =
    React.useState<ClientType>('web')
  const [updateClientType, setUpdateClientType] =
    React.useState<ClientType>('web')

  const [clientNameInput, setClientNameInput] = React.useState<string>('')
  const [redirectUrlInput, setRedirectUrlInput] = React.useState<string>('')
  const [isRegSuccess, setIsRegSuccess] = React.useState<boolean>(false)
  const [registeredClient, setRegisteredClient] = React.useState<RegResponse>()

  //View
  const [clientIdInput, setClientIdInput] = React.useState<string>('')
  const [accessTokenInput, setAccessTokenInput] = React.useState<string>('')
  const [isViewSuccess, setIsViewSuccess] = React.useState<boolean>(false)
  const [viewClient, setViewClient] = React.useState<ViewResponse>()

  //Update
  const [updatedRedirectUrls, setUpdatedRedirectUrls] = React.useState<
    string[]
  >([])

  const [clientIdUpdate, setClientIdUpdate] = React.useState<string>('')
  const [clientNameUpdate, setClientNameUpdate] = React.useState<string>('')
  const [redirectUrlUpdate, setRedirectUrlUpdate] = React.useState<string>('')
  const [redirectUrlReplace, setRedirectUrlReplace] =
    React.useState<boolean>(false)
  const [accessTokenUpdate, setAccessTokenUpdate] = React.useState<string>('')
  const [isUpdateSuccess] = React.useState<boolean>(false)
  const [UpdatedClient] = React.useState<ViewResponse>()

  React.useEffect(() => {
    if (redirectUrlInput.length !== 0) {
      const urls = redirectUrlInput.split(';').map((url) => url.trim())
      const validatedUrls = urls.filter((url) => {
        return urlPattern.test(url)
      })
      setRedirectUrls(validatedUrls)
    }

    if (redirectUrlUpdate.length !== 0) {
      const urls = redirectUrlUpdate.split(';').map((url) => url.trim())
      const validatedUrls = urls.filter((url) => {
        return urlPattern.test(url)
      })
      setUpdatedRedirectUrls(validatedUrls)
    }
  }, [redirectUrlInput, redirectUrlUpdate])

  const register = React.useCallback(async () => {
    if (
      clientNameInput.length !== 0 &&
      redirectUrls.length !== 0 &&
      createClientType.length
    ) {
      const data: IRegistrationRequest = {
        application_type: 'web',
        redirect_uris: redirectUrls,
        client_name: clientNameInput,
        subject_type: 'public',
        token_endpoint_auth_method: 'none',
        grant_types: ['implicit', 'authorization_code', 'refresh_token'],
        response_types: ['id_token', 'code', 'none'],
      }
      if (createClientType === 'native') {
        data.grant_types = ['authorization_code']
        data.response_types = ['code']
      }

      const response = await fetch(`/reg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok && response.status === 201) {
        const client = hush(RegResponse.decode(await response.json()))
        if (client != null) {
          setRegisteredClient(client)
          setIsRegSuccess(true)
        }
      }
    }
  }, [clientNameInput, redirectUrls, createClientType])

  const getClient = async (clientId: string, accessToken: string) => {
    if (clientId.length !== 0 && accessToken.length !== 0) {
      return await fetch(`/reg/${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })
    }

    return
  }

  const view = React.useCallback(async () => {
    if (clientIdInput.length !== 0 && accessTokenInput.length !== 0) {
      const response = await getClient(clientIdInput, accessTokenInput)

      if (response?.ok && response.status === 200) {
        const client = hush(ViewResponse.decode(await response.json()))
        if (client != null) {
          setViewClient(client)
          setIsViewSuccess(true)
        }
      }
    }
  }, [clientIdInput, accessTokenInput])

  const update = React.useCallback(async () => {
    if (
      clientIdUpdate.length !== 0 &&
      clientNameUpdate.length !== 0 &&
      accessTokenUpdate.length !== 0 &&
      updatedRedirectUrls.length !== 0 &&
      updateClientType.length
    ) {
      //check if replace the existing redirect urls

      let existingRedirectUrls: string[] = []
      if (!redirectUrlReplace) {
        //get the existing redirect urls first
        const response = await getClient(clientIdUpdate, accessTokenUpdate)

        if (response?.ok && response.status === 200) {
          const client = hush(ViewResponse.decode(await response.json()))
          if (client != null) {
            existingRedirectUrls = client.redirect_uris
          }
        }
      }

      const data: IUpdateRequest = {
        application_type: 'web',
        redirect_uris: existingRedirectUrls.concat(updatedRedirectUrls),
        client_name: clientNameUpdate,
        subject_type: 'public',
        token_endpoint_auth_method: 'none',
        client_id: clientIdUpdate,
        grant_types: ['implicit', 'authorization_code', 'refresh_token'],
        response_types: ['id_token', 'code', 'none'],
      }

      if (updateClientType === 'native') {
        data.grant_types = ['authorization_code']
        data.response_types = ['code']
      }

      const response = await fetch(`/reg/${clientIdUpdate}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessTokenUpdate}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok && response.status === 200) {
        const buttonB = document.getElementById('viewButton')
        if (buttonB) {
          buttonB.click()
        }
      }
    }
  }, [
    clientIdUpdate,
    clientNameUpdate,
    accessTokenUpdate,
    updatedRedirectUrls,
    redirectUrlReplace,
    updateClientType,
  ])

  return (
    <div className="page">
      {isRegSuccess && (
        <div className="fixed top-0 bottom-0 left-0 right-0 z-999 bg-colorBrand flex justify-center items-center">
          <div className="flex flex-col border-solid border-white border-[1px] p-[20px] rounded-sm max-h-[480px] overflow-y-scroll">
            <h4 className="text-center text-fontLarge">
              Client successfully registered !
            </h4>
            <span className="font-bold p-normal text-[24px]">
              Client id : {registeredClient?.client_id}
            </span>
            <span className="font-bold p-normal text-[24px]">
              Client name : {registeredClient?.client_name}
            </span>
            <span className="font-bold p-normal text-[24px]">
              Access Token : {registeredClient?.registration_access_token}
            </span>
            <div>
              <RoundedButton
                variant="outlined"
                className="w-full"
                onClick={() => {
                  if (registeredClient?.client_id != null) {
                    setClientIdInput(registeredClient.client_id)
                    setAccessTokenInput(
                      registeredClient.registration_access_token
                    )
                  }

                  setIsRegSuccess(false)
                }}
              >
                OK
              </RoundedButton>
            </div>
          </div>
        </div>
      )}

      {isViewSuccess && (
        <div className="fixed top-0 bottom-0 left-0 right-0 z-999 bg-colorBrand flex justify-center items-center">
          <div className="flex flex-col border-solid border-white border-[1px] p-[20px] rounded-sm max-h-[480px] overflow-y-scroll">
            <h4 className="text-center text-fontLarge">Client Details: </h4>
            {Object.entries(viewClient ?? {}).map(([key, value]) => (
              <span className="font-bold p-normal text-[24px]" key={key}>
                {key}: {Array.isArray(value) ? value.join(', ') : value}
              </span>
            ))}
            <div>
              <RoundedButton
                variant="outlined"
                className="w-full"
                onClick={() => {
                  if (viewClient?.client_id != null) {
                    setClientIdUpdate(viewClient.client_id)
                    setClientNameUpdate(viewClient.client_name)
                    setAccessTokenUpdate(viewClient.registration_access_token)
                  }

                  setIsViewSuccess(false)
                }}
              >
                OK
              </RoundedButton>
            </div>
          </div>
        </div>
      )}

      {isUpdateSuccess && (
        <div className="fixed top-0 bottom-0 left-0 right-0 z-999 bg-colorBrand flex justify-center items-center">
          <div className="flex flex-col border-solid border-white border-[1px] p-[20px] rounded-sm max-h-[480px] overflow-y-scroll">
            <h4 className="text-center text-fontLarge">
              Client successfully updated !
            </h4>
            <span className="font-bold p-normal text-[24px]">
              Client name : {UpdatedClient?.client_name}
            </span>
            <span className="font-bold p-normal text-[24px]">
              Redirect URLs :{' '}
              {Array.isArray(UpdatedClient?.redirect_uris)
                ? UpdatedClient?.redirect_uris.join(', ')
                : UpdatedClient?.redirect_uris}
            </span>
            <div>
              <RoundedButton variant="outlined" className="w-full">
                OK
              </RoundedButton>
            </div>
          </div>
        </div>
      )}

      <div className="h-screen w-screen p-[32px]">
        <div className="flex flex-row items-center gap-small  font-ObjektivMk1Medium text-fontExtraLarge">
          Manage Clients
        </div>
        <div className="flex flex-row w-full text-fontMedium leading-[1.48]">
          <div className="flex flex-col flex-grow content-center p-extraLarge gap-extraLarge">
            <div className="text-fontLarge font-ObjektivMk1Medium">
              Register
            </div>
            <div className="flex flex-col flex-grow gap-extraLarge">
              <div className="flex flex-row gap-normal ">
                <span className="flex min-w-[128px] items-center">
                  Client Name
                </span>

                <input
                  className="w-full bg-colorBrand p-extraSmall border-solid border-[1px]"
                  type="text"
                  value={clientNameInput}
                  onChange={(event) => setClientNameInput(event.target.value)}
                />
              </div>
              <div className="flex flex-row gap-normal">
                <span className="flex min-w-[128px] items-center">
                  Redirect URLs
                </span>
                <input
                  className="w-full bg-colorBrand p-extraSmall border-solid border-[1px]"
                  type="text"
                  placeholder="separate the urls using semicolon"
                  value={redirectUrlInput}
                  onChange={(event) => setRedirectUrlInput(event.target.value)}
                />
              </div>
              <div className="flex flex-row gap-normal">
                <span className="flex min-w-[128px] items-center">
                  Client type
                </span>
                <div className="flex flex-row">
                  <input
                    className="w-full p-extraSmall border-solid border-white border-[1px]"
                    type="radio"
                    name="createClientType"
                    value="web"
                    id="radio-btn-web"
                    checked={createClientType === 'web'}
                    onChange={() => setCreateClientType('web')}
                  />
                  <label htmlFor="radio-btn-web">Web</label>
                </div>
                <div className="flex flex-row">
                  <input
                    className="w-full p-extraSmall border-solid border-white border-[1px]"
                    type="radio"
                    name="createClientType"
                    value="native"
                    id="radio-btn-native"
                    checked={createClientType === 'native'}
                    onChange={() => setCreateClientType('native')}
                  />
                  <label htmlFor="radio-btn-native">Native</label>
                </div>
              </div>
              {/* <StyledFormGroup>
                <span></span>
                <ul>
                  {redirectUrls.map((url, index) => (
                    <li key={index}>{url}</li>
                  ))}
                </ul>
              </StyledFormGroup> */}
              <div className="flex flex-row gap-normal">
                <RoundedButton
                  className="w-full"
                  variant="outlined"
                  onClick={() => {
                    void register()
                  }}
                >
                  Register
                </RoundedButton>
              </div>
            </div>
          </div>
          <div className="flex flex-col flex-grow justify-between content-center p-extraLarge gap-extraLarge">
            <div className="text-fontLarge font-ObjektivMk1Medium">View</div>
            <div className="flex flex-col flex-grow content-center gap-extraLarge">
              <div className="flex flex-row gap-normal">
                <span className="flex min-w-[128px] items-center">
                  Client Id
                </span>
                <input
                  className="w-full bg-colorBrand p-extraSmall border-solid border-[1px]"
                  type="text"
                  value={clientIdInput}
                  onChange={(event) => setClientIdInput(event.target.value)}
                />
              </div>
              <div className="flex flex-row gap-normal">
                <span className="flex min-w-[128px] items-center">
                  Access Token
                </span>
                <input
                  className="w-full bg-colorBrand p-extraSmall border-solid border-[1px]"
                  type="text"
                  value={accessTokenInput}
                  onChange={(event) => setAccessTokenInput(event.target.value)}
                />
              </div>
              <div className="flex flex-row gap-normal">
                <RoundedButton
                  id="viewButton"
                  variant="outlined"
                  onClick={() => {
                    void view()
                  }}
                  className="w-full"
                >
                  View
                </RoundedButton>
              </div>
            </div>
          </div>
          <div className="flex flex-col flex-grow justify-between content-center p-extraLarge gap-extraLarge">
            <div className="text-fontLarge font-ObjektivMk1Medium">Update</div>
            <div className="flex flex-col flex-grow justify-between content-center gap-extraLarge">
              <div className="flex flex-row gap-normal">
                <span className="flex min-w-[128px] items-center">
                  Client Id
                </span>
                <input
                  className="w-full bg-colorBrand p-extraSmall border-solid border-[1px]"
                  type="text"
                  value={clientIdUpdate}
                  onChange={(event) => setClientIdUpdate(event.target.value)}
                />
              </div>
              <div className="flex flex-row gap-normal">
                <span className="flex min-w-[128px] items-center">
                  Client Name
                </span>
                <input
                  className="w-full bg-colorBrand p-extraSmall border-solid border-[1px]"
                  type="text"
                  value={clientNameUpdate}
                  onChange={(event) => setClientNameUpdate(event.target.value)}
                />
              </div>
              <div className="flex flex-row gap-normal">
                <span className="flex min-w-[128px] items-center">
                  Redirect URLs
                </span>
                <input
                  className="w-full bg-colorBrand p-extraSmall border-solid border-[1px]"
                  type="text"
                  placeholder="separate the urls using semicolon"
                  value={redirectUrlUpdate}
                  onChange={(event) => setRedirectUrlUpdate(event.target.value)}
                />
              </div>
              <div className="flex flex-row gap-normal">
                <span className="flex min-w-[128px] items-center">
                  Replace URLs
                </span>
                <input
                  className="w-full p-extraSmall border-solid border-white border-[1px]"
                  type="checkbox"
                  checked={redirectUrlReplace}
                  onChange={() => setRedirectUrlReplace(!redirectUrlReplace)}
                />
              </div>
              <div className="flex flex-row gap-normal">
                <span className="flex min-w-[128px] items-center">
                  Access Token
                </span>
                <input
                  className="w-full bg-colorBrand p-extraSmall border-solid border-[1px]"
                  type="text"
                  value={accessTokenUpdate}
                  onChange={(event) => setAccessTokenUpdate(event.target.value)}
                />
              </div>
              <div className="flex flex-row gap-normal">
                <span className="flex min-w-[128px] items-center">
                  Client type
                </span>

                <div className="flex flex-row">
                  <input
                    className="w-full p-extraSmall border-solid border-white border-[1px]"
                    type="radio"
                    name="updateClientType"
                    value="web"
                    id="update-radio-btn-web"
                    checked={updateClientType === 'web'}
                    onChange={() => setUpdateClientType('web')}
                  />
                  <label htmlFor="update-radio-btn-web">Web</label>
                </div>
                <div className="flex flex-row">
                  <input
                    className="w-full p-extraSmall border-solid border-white border-[1px]"
                    type="radio"
                    name="updateClientType"
                    value="native"
                    id="update-radio-btn-native"
                    checked={updateClientType === 'native'}
                    onChange={() => setUpdateClientType('native')}
                  />
                  <label htmlFor="update-radio-btn-native">Native</label>
                </div>
              </div>
              <div className="flex flex-row gap-normal">
                <RoundedButton
                  variant="outlined"
                  onClick={() => {
                    void update()
                  }}
                  className="w-full"
                >
                  Update
                </RoundedButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
