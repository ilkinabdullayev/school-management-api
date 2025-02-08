FROM node:18

USER node

RUN mkdir -p /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node . .

RUN yarn install

EXPOSE 5111

CMD ["npm", "start"]