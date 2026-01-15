// import { ALL_AUTH_OPTIONS } from '../routes/authOptions/authOptions'

const API_BASE_URL = 'http://login.passonline.red'
describe('Auth-Options API', () => {
  describe('GET /auth-options', () => {
    it('should return a list of authentication options with a valid x-client-id', async () => {
      const response = await fetch(`${API_BASE_URL}/auth-options`, {
        method: 'GET',
        headers: {
          'x-client-id': '1wV4rphRYo9AZK_Ov_23r',
          Accept: 'application/json',
        },
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)

      // Validate a google authentication option
      const googleOption = data.find(
        (option) => option.id === 'futureverseCustodialGoogle'
      )
      expect(googleOption).toBeDefined()
      expect(googleOption).toHaveProperty('name', 'Google')
      expect(googleOption).toHaveProperty('iconUrls')
      expect(googleOption.iconUrls).toHaveProperty('white')
      expect(googleOption.iconUrls).toHaveProperty('fullcolor')
    })

    it('should return a 400 error for an invalid x-client-id', async () => {
      const response = await fetch(`${API_BASE_URL}/auth-options`, {
        method: 'GET',
        headers: {
          'x-client-id': 'invalid-client-id',
          Accept: 'application/json',
        },
      })

      expect(response.status).toBe(400)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toHaveProperty('code', 400)
      expect(data.error).toHaveProperty('message', 'Invalid client id')
    })

    it('should return a 400 error when x-client-id header is missing', async () => {
      const response = await fetch(`${API_BASE_URL}/auth-options`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      expect(response.status).toBe(400)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toHaveProperty('code', 400)
      expect(data.error).toHaveProperty(
        'message',
        'Missing x-client-id header.'
      )
    })
  })
})

// describe('ALL_AUTH_OPTIONS Data Structure', () => {
//   it('should be an array with the correct number of authentication options', () => {
//     expect(Array.isArray(ALL_AUTH_OPTIONS)).toBe(true)
//     expect(ALL_AUTH_OPTIONS.length).toBe(6)
//   })

//   it('should contain all expected configuration IDs', () => {
//     const expectedConfigIds = [
//       'google',
//       'facebook',
//       'tiktok',
//       'twitter',
//       'apple',
//       'email',
//     ]
//     const configIds = ALL_AUTH_OPTIONS.map((option) => option.configId)
//     expect(configIds).toEqual(expect.arrayContaining(expectedConfigIds))
//   })

//   ALL_AUTH_OPTIONS.forEach((option) => {
//     describe(`Config ID: ${option.configId}`, () => {
//       it('should have a valid configId', () => {
//         expect(typeof option.configId).toBe('string')
//         expect(option.configId).toBeTruthy()
//       })

//       it('should have a valid apiResponse object', () => {
//         expect(option).toHaveProperty('apiResponse')
//         expect(typeof option.apiResponse).toBe('object')
//       })

//       it('apiResponse should have id, name, and iconUrls', () => {
//         const { apiResponse } = option
//         expect(apiResponse).toHaveProperty('id')
//         expect(apiResponse).toHaveProperty('name')
//         expect(apiResponse).toHaveProperty('iconUrls')
//         expect(typeof apiResponse.iconUrls).toBe('object')
//       })

//       it('iconUrls should have a valid white icon URL', () => {
//         const { iconUrls } = option.apiResponse
//         expect(iconUrls).toHaveProperty('white')
//         expect(typeof iconUrls.white).toBe('string')
//         expect(iconUrls.white).toMatch(new RegExp(`/.*-white\\.svg$`))
//       })

//       it('iconUrls should have a valid fullcolor icon URL or be undefined', () => {
//         const { iconUrls } = option.apiResponse
//         if (option.configId === 'email') {
//           expect(iconUrls.fullcolor).toBeUndefined()
//         } else {
//           expect(iconUrls).toHaveProperty('fullcolor')
//           expect(typeof iconUrls.fullcolor).toBe('string')
//           expect(iconUrls.fullcolor).toMatch(
//             new RegExp(`/.*-full-color\\.svg$`)
//           )
//         }
//       })
//     })
//   })
// })
