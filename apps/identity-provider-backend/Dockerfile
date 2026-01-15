# Install dependencies only when needed
FROM node:18 as deps

WORKDIR /usr/src/app
COPY dist/apps/identity-provider-backend/package*.json ./

RUN mkdir ./libs
COPY libs/passport-tiktok ./libs/passport-tiktok

RUN yarn install
# for some reasons the nx build ignores the graphql package, will have to manually install it
RUN yarn add graphql

# Production image, copy all the files and run next
FROM docker.io/node:18-alpine as runner

ENV NODE_ENV production
ENV PORT 3000
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY dist/apps/identity-provider-backend ./
COPY dist/apps/identity-provider-frontend ../identity-provider-frontend 
COPY apps/identity-provider-backend/entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

RUN chown -R node:node .
USER node
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "main.js"]