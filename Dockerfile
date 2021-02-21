FROM node:15

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm config set strict-ssl false
RUN npm install

RUN mkdir src
COPY tsconfig.json .
COPY src/ src/
RUN yarn build

EXPOSE 9000
CMD [ "node", "dist/server.js" ]
