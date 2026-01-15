/* eslint-disable import/newline-after-import -- polyfills config */
/* eslint-disable @typescript-eslint/consistent-type-assertions -- polyfills config */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- polyfills config */
/* eslint-disable @typescript-eslint/no-explicit-any -- polyfills config */
/**
 * Polyfill stable language features. These imports will be optimized by `@babel/preset-env`.
 *
 * See: https://github.com/zloirock/core-js#babel
 */
import 'core-js/stable'
import 'regenerator-runtime/runtime'
;(window as any).global = window

/* eslint-enable import/newline-after-import -- polyfills config */
/* eslint-enable @typescript-eslint/consistent-type-assertions -- polyfills config */
/* eslint-enable @typescript-eslint/no-unsafe-member-access -- polyfills config */
/* eslint-enable @typescript-eslint/no-explicit-any -- polyfills config */
