# docker build -t linter . && docker run -v `pwd`/src:/silex/src --rm linter
FROM node:lts

# Use volume to mount the source code
VOLUME /silex
COPY . /silex
WORKDIR /silex
RUN npm ci

CMD ["npm", "run", "lint:fix"]
