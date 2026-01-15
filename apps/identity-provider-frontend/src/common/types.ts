import * as t from '@sylo/io-ts'

// Define a type for E.164 phone numbers
const E164PhoneNumberRegExp = new RegExp(/^\+[1-9]\d{1,14}$/)

interface E164PhoneNumberBrand {
  readonly E164PhoneNumber: unique symbol
}

export const E164PhoneNumber = t.brand(
  t.string,
  (s: string): s is t.Branded<string, E164PhoneNumberBrand> =>
    E164PhoneNumberRegExp.test(s),
  'E164PhoneNumber'
)

export type E164PhoneNumber = t.TypeOf<typeof E164PhoneNumber>
