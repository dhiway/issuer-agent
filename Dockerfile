FROM node:18-slim as prod

#ENV NODE_ENV=production

WORKDIR /app

COPY package.json  yarn.lock /app/
RUN yarn

COPY . .
RUN yarn build

RUN mkdir -p /tmp/templates

EXPOSE 5001

CMD ["node", "dist/index.js"]

#CMD ["tail", "-f", "/dev/null"]
