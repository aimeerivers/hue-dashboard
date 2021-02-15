FROM node:15

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm config set strict-ssl false
RUN npm install

COPY . .

EXPOSE 8080
CMD [ "yarn", "start" ]
