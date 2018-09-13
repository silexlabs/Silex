FROM node:6.5.0

# use test apps for localhost only
# these can be overriden using the `-e` option in docker run
ENV DROPBOX_CLIENT_ID=ckixgyo62obeo05 DROPBOX_CLIENT_SECRET=ptg6u5iw7gs6r6o GITHUB_CLIENT_ID=f124e4148bf9d633d58b GITHUB_CLIENT_SECRET=1a8fcb93d5d0786eb0a16d81e8c118ce03eefece
# ENV ENABLE_FTP=true ENABLE_SFTP=true ENABLE_WEBDAV=true

COPY . /silex
WORKDIR /silex
RUN apt-get update \
&&  apt-get install -yq python openjdk-7-jre \
&&  rm -rf /var/lib/apt/lists/* \
&&  npm install \
&&  npm run build

EXPOSE 6805
CMD ["node", "dist/server/silex_web.js"]

