FROM node:18-alpine
WORKDIR /usr/chunkfunc

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --unsafe-perm

COPY ./src ./src
RUN npm run-script build && mkdir ./profiling

ENV FUNC_LOG_LEVEL=info
EXPOSE 8080
CMD [ "node", "--cpu-prof", "--cpu-prof-dir=./profiling", "./node_modules/.bin/faas-js-runtime", "./build/index.js" ]
# CMD [ "npx", "faas-js-runtime", "./build/index.js" ]
