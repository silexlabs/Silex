FROM node:0.10

COPY . /silex
WORKDIR /silex
RUN apt-get update \
&&  apt-get install -yq python openjdk-7-jre \
&&  rm -rf /var/lib/apt/lists/* \
&&  make

EXPOSE 6805
CMD ["node", "dist/server/server.js"]
