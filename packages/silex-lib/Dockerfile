FROM node:18

# see doc about env vars here: https://github.com/silexlabs/Silex/wiki/How-to-Host-An-Instance-of-Silex#environment-variables
# these can be overriden using the `-e` option in docker run
# SILEX_FS_ROOT=/repo.git/

ENV SILEX_EXPRESS_JSON_LIMIT=1mb
ENV SILEX_EXPRESS_TEXT_LIMIT=10mb
ENV SILEX_EXPRESS_URLENCODED_LIMIT=1mb
ENV SILEX_SESSION_NAME=silex-session
ENV SILEX_SESSION_SECRET="replace this session secret in env vars"
ENV SILEX_PORT=6805
ENV SILEX_HOST=localhost
ENV SILEX_PROTOCOL=http
ENV SILEX_DEBUG=FALSE
ENV SILEX_SERVER_CONFIG=
ENV SILEX_SSL_PORT=
ENV SILEX_FORCE_HTTPS=
ENV SILEX_SSL_PRIVATE_KEY=
ENV SILEX_SSL_CERTIFICATE=
ENV SILEX_FORCE_HTTPS_TRUST_XFP_HEADER=
ENV SILEX_CORS_URL=
ENV SILEX_CLIENT_CONFIG=
ENV SILEX_FS_ROOT=
ENV SILEX_FS_HOSTING_ROOT=

COPY . /silex
WORKDIR /silex
RUN apt-get update
RUN npm install
RUN npm run build

EXPOSE 6805
CMD ["npm", "start"]
