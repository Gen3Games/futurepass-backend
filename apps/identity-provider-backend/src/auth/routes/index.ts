/**
 * Routes Index
 * 
 * Exports all authentication route factories
 */

// SIWE routes
export {
  createSiweRoutes,
  SiweRoutesConfig,
  siweLoginHintMiddleware,
} from './siwe'

// XRPL routes
export {
  createXrplRoutes,
  XrplRoutesConfig,
  xrplLoginHintMiddleware,
} from './xrpl'

// Login routes
export {
  createLoginRoutes,
  LoginRoutesConfig,
} from './login'
