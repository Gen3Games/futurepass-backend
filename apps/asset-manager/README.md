# Tenant FuturePass Customisation

Clients of Futureverse who purchase this option can create custom versions of the authentication flow. The customisations include:

1. Subdomain (e.g. `tenant.pass.online`). The tenants authentication flow will be directed through the subdomain to the FuturePass Identity Provider.
2. Title of the page, e.g. `TenantPass`.
3. Assets:
   a. Logo, Favicon and Background Image
   b. Translations
   c. Styles
   d. Fonts

All assets must be provided to the development team two weeks in advance of launch. Please submit them and any queries to your contact person.

All the uploaded files will be validated and sanitised before being uploaded to our CDN servers, but you have the sole responsibility of ensuring if the final outcome of the customisation is correct.

## Ensuring Quick Load Times

There are no hard limits on the size of the provided files, but it is in your best interest to provide smallest possible sizes in the right formats. The smaller they are, the faster your custom authentication page will load.

## Subdomain

The tenant's subdomain must be agreed upon with the sales team.

Your subdomain will be configured on 3 environments:

1. Development: `tenant.passonline.dev`
2. Staging: `tenant.passonline.cloud`
3. Production: `tenant.pass.online`

## Assets

All assets should be provided as a single ZIP package using the following structure:

- `config`
  - `config.json`
- `fonts`
  - `TenantFont.woff2`
  - `TenantFont.woff`
  - `TenantFont.ttf`
- `i18n`
  - `translation-tenant-en.json`
  - `translation-tenant-jp.json`
- `images`
  - `bg.webp`
  - `bg.png`
  - `favicon.webp`
  - `favicon.png`
  - `logo.webp`
  - `logo.png`
- `styles`
  - `style.css`

### Config

Provide a JSON config file that has the following fields:

```json
{
  "name": "TenantPass",
  "logoPath": "images/logo.png",
  "faviconPath": "images/favicon.png",
  "translations": [
    {
      "locale": "en",
      "localePath": "i18n/translation-tenant-en.json"
    },
    {
      "locale": "jp",
      "localePath": "i18n/translation-tenant-jp.json"
    }
  ]
}
```

### Images

The logo, favicon and background image are customisable. Any other images will be disregarded.
Ensure that both `webp` and `png` formats are provided.

### Styles

You can provide up to ten CSS files that will be loaded to override the default styling.

#### Changing the defaults

To change the default colours, fonts and other basic CSS properties simply override them in your CSS file. Use the DevTools inspector in your browser to view available elements. All of the important UI elements have IDs or classes assigned to them following the BEM (Block, Element, Modifier) convention. For example: for example:

```css
/* ---------------------------------------------------------- */
/* set background image */

body {
  background-image: url('../images/bg.png') !important;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* ---------------------------------------------------------- */

/* ---------------------------------------------------------- */
/* set box background */

.page {
  backdrop-filter: blur(20px);
}

/* ---------------------------------------------------------- */

.tenant-logo__image {
  width: 30px;
}

/* ---------------------------------------------------------- */
/* set custom font  */

@font-face {
  font-family: 'customTenantFont';
  src: url('../fonts/TenantFont-Regular.ttf');
}

h1 {
  font-family: customTenantFont !important;
}
button {
  font-family: customTenantFont !important;
}

/* ---------------------------------------------------------- */

/* ---------------------------------------------------------- */
/* signer popup customization  */

.signer-tenant-logo__image {
  width: 80px;
}

.custodial-signer__content_message-1 {
  color: white;
  font-size: medium;
}

.custodial-signer__content_message-2 {
  font-size: small;
}

/* ---------------------------------------------------------- */
```

### Fonts

If you're using any non-default fonts, such as the `CustomTenantFont.woff2` in the example above, ensure to upload them in the `fonts` folder. You should provide `woff2`, `woff` and `ttf` versions of each font.

### Translations

Provide translations as JSON files with names formatted as `translation-tenant-<locale>.json`, e.g. `translation-tenant-jp.json`. You can use the English locale file to customise the default English values. The following copy is customisable:

```json
{
  "index": {
    "index__logout_link": "Logout"
  },
  "error": {
    "error__message": "Dropped pass",
    "error__code": "Error Code: {{errorCode}}"
  },
  "metamask-prompt": {
    "metamask-prompt__header_message": "Unsupported Browser",
    "metamask-prompt__content_message-1": "{{tenantName}} is not optimised for the for this browser.",
    "metamask-prompt__content_message-2": "Use the Google Chrome browser on desktop.",
    "metamask-prompt__content_back-button": "Go Back"
  },
  "brave-prompt": {
    "brave-prompt__header_message": "{{tenantName}} Early Access Phase",
    "brave-prompt__content_message-1": "You are about to create Your FuturePass",
    "brave-prompt__content_message-2": "{{tenantName}} is optimised for Google Chrome during the early access phase. If not in Google Chrome browser we recommend changing browsers for the best experience.",
    "brave-prompt__content_continue-button": "I Am Using Google Chrome"
  },
  "metamask-install-prompt": {
    "metamask-install-prompt__header": "{{wallet}} not installed.",
    "metamask-install-prompt__content": "You need to install {{wallet}} to continue. Please install {{wallet}} then refresh the page.",
    "metamask-install-prompt__content_back-button": "Go back",
    "metamask-install-prompt__content_install-button": "Install {{wallet}}"
  },
  "futurepass-info": {
    "futurepass-info__header": "What is a {{tenantName}}??",
    "futurepass-info__content_message-1": "The {{tenantName}} is your pass to journey through the Open Metaverse.",
    "futurepass-info__content_message-2": "It connects you to any experience or application, and is unique to you. It protects all aspects of your identity and data, it stores your assets, manages permissions, helps you build status and safeguards your funds as you explore the Open Metaverse. This is the beginning of your journey, simpler and safer than ever before.",
    "futurepass-info__content_message-3": "For more information, ",
    "futurepass-info__content_message-3-link": "visit website.",
    "futurepass-info__content_close-button": "Close"
  },
  "custom-network-warning": {
    "custom-network-warning__header": "Does your wallet support custom networks?",
    "custom-network-warning__content": "Your FuturePass connects to The Root Network and Ethereum. Please ensure you are using a wallet that supports custom networks.",
    "custom-network-warning__content_back-button": "Go Back",
    "custom-network-warning__content_support-button": "My Wallet Supports Custom Networks"
  },
  "login-error": {
    "login-error__header_message": "We ran into a problem",
    "login-error__content_message": "There was a problem logging into your Futureverse account. Please try again or go back.",
    "login-error__content_back-button": "Go Back",
    "login-error__content_try-again-button": "Try Again"
  },
  "xaman-qr-code": {
    "xaman-qr-code__heading": "Continue with Xaman",
    "xaman-qr-code__show-qr_message": "Please scan the QR code in your wallet",
    "xaman-qr-code__hide-qr_message-1": "Xaman wallet connected successfully!",
    "xaman-qr-code__hide-qr_message-2": "Please authorize FuturePass in your mobile wallet.",
    "xaman-qr-code__hide-qr_message-3": "Didn&apos;t receive a signature request in wallet?",
    "xaman-qr-code__hide-qr_show-qr-button": "Scan QR code instead"
  },
  "login-custodial": {
    "login-custodial__header_message": "Begin your journey.",
    "login-custodial__content_google-button": "Google",
    "login-custodial__content_facebook-button": "Facebook",
    "login-custodial__content_twitter-button": "X",
    "login-custodial__content_tiktok-button": "TikTok",
    "login-custodial__content_email-button": "Continue with Email",
    "login-custodial__content_alternatively": "Alternatively",
    "login-custodial__content_switch-mode-button": {
      "custodial": "Connect Email or Socials",
      "non-custodial": "Connect Web3 wallet"
    }
  },
  "login-non-custodial": {
    "login-non-custodial__header_message": "Begin your journey.",
    "login-non-custodial__content_metamask-button": "MetaMask",
    "login-non-custodial__content_walletconnect-button": "WalletConnect",
    "login-non-custodial__content_xaman-button": "Xaman",
    "login-non-custodial__content_coinbase-button": "Coinbase Wallet",
    "login-non-custodial__content_alternatively": "Alternatively",
    "login-non-custodial__content_switch-mode-button": {
      "custodial": "Connect Email or Socials",
      "non-custodial": "Connect Web3 wallet"
    }
  },
  "sms-otp-page": {
    "sms-opt-page__header_verification-required": "SMS verification required",
    "sms-otp-page__header_message": "We require an extra verification step when an empty web3 address is used to create a {{tenantName}}",
    "sms-otp-page__input_phone": "Phone number",
    "sms-otp-page__resend-time": "Resend code in {{formattedTimeUntilNextSendSmsOtpRetry}}",
    "sms-otp-page__buttons_back-button": "Back",
    "sms-otp-page__buttons_next-button": "Next",
    "errors": {
      "generic": "Something went wrong, please try again.",
      "invalidPhoneNumber": "Invalid phone number, please use the +112345678 format.",
      "maxAttemptsReached": "Verification attempts maximum exceeded, please wait 10 minutes before trying again.",
      "wrongCodeLength": "Please enter 6-digit code.",
      "incorrectCode": "Incorrect code entered, please try again."
    }
  },
  "verify-otp": {
    "verify-otp__header_message": {
      "sms": "SMS verification required",
      "email": "Verify your email"
    },
    "verify-otp__instruction": "Enter the 6 digit code sent to {{connectInfo}}",
    "verify-otp__resend_message": "Did not receive a code ?",
    "verify-otp__resend_messag-email": " Please check junk email",
    "verify-otp__resend_resend-button": {
      "resendIn": "Resend code in {{formattedTimeUntilNextRetry}}",
      "resend": "Resend"
    },
    "verify-otp__back-button-container_back-button": "Back"
  },
  "email": {
    "email__header_text": "Continue with email",
    "email__header_input": "Enter your email address",
    "email__button-container": {
      "back": "Back",
      "continue": "Continue"
    }
  }
}
```
