FROM node:15

RUN apt-get update && \
  apt-get install -y build-essential libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm config set strict-ssl false
RUN npm install

RUN mkdir src
COPY tsconfig.json .
COPY .eslintrc.js .
COPY src/ src/
RUN yarn build
RUN yarn lint || :

EXPOSE 9000
CMD [ "node", "dist/server.js" ]
