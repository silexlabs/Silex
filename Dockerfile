FROM node:10

# see doc about env vars here: https://github.com/silexlabs/Silex/wiki/How-to-Host-An-Instance-of-Silex#environment-variables
# these can be overriden using the `-e` option in docker run
ENV ENABLE_FS=true
# ENV ENABLE_FTP=true ENABLE_SFTP=true ENABLE_WEBDAV=true

COPY . /silex
WORKDIR /silex
RUN apt-get update
RUN npm install
RUN npm run build

EXPOSE 6805
CMD ["node", "dist/server/server/silex_web.js"]
