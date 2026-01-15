# passport-tiktok

The passport-tiktok library is used for TikTok custodial login.

This library is originally forked from https://github.com/jaredhanson/passport-oauth2. There are a few reasons why it is forked:

1. We are using the passport-js libraries for all the custodial logins.
2. TikTok Login has been updated to v2, but the existing passport-js library only support v1.
3. TikTok Login follows the oauth2 standard but differs slightly from it.

The major changes made to adapt the TikTok Login:

1. Rewrite the strategy.js, rename OAuth2Strategy to TikTokStrategy.
2. Predefined TikTok Login URLs.
3. Re-implement the algorithm of how code verifier is generated.
4. Implement the user profile module allowing the library to read the user profile based on the login scope.
