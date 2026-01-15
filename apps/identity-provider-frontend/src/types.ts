import * as t from 'io-ts'

export const FlagVariationsPerEnvironment = t.type({
  production: t.array(t.string),
  staging: t.array(t.string),
  preview: t.array(t.string),
  development: t.array(t.string),
  neptune: t.array(t.string),
  audit: t.array(t.string),
})
