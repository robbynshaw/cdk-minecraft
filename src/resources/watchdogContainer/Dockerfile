FROM node:22

COPY package.json .
COPY yarn.lock .
RUN yarn

COPY tsconfig.json .
COPY ./src ./src
RUN yarn build

CMD [ "node", "dist/index.js" ]