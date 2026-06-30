FROM node:24

RUN apt-get update
EXPOSE 6805

# see doc about env vars here: https://github.com/silexlabs/Silex/wiki/How-to-Host-An-Instance-of-Silex#environment-variables
# these can be overridden using the `-e` option in docker run

ENV SILEX_EXPRESS_JSON_LIMIT=1mb
ENV SILEX_EXPRESS_TEXT_LIMIT=10mb
ENV SILEX_EXPRESS_URLENCODED_LIMIT=1mb
ENV SILEX_SESSION_NAME=silex-session
ENV SILEX_SESSION_SECRET="replace this session secret in env vars"
ENV SILEX_PORT=6805
ENV SILEX_HOST=localhost
ENV SILEX_PROTOCOL=http
ENV SILEX_DEBUG=FALSE
ENV SILEX_SSL_PORT=
ENV SILEX_FORCE_HTTPS=
ENV SILEX_SSL_PRIVATE_KEY=
ENV SILEX_SSL_CERTIFICATE=
ENV SILEX_FORCE_HTTPS_TRUST_XFP_HEADER=
ENV SILEX_CORS_URL=
ENV SILEX_FS_ROOT=
ENV SILEX_URL=http://localhost:6805

# Additional environment variables based on README
ENV STORAGE_CONNECTORS=ftp
ENV HOSTING_CONNECTORS=ftp,download
ENV SILEX_FS_HOSTING_ROOT=/silex/hosting/
ENV FTP_STORAGE_PATH=
ENV FTP_HOSTING_PATH=
ENV GITLAB_DISPLAY_NAME=
ENV GITLAB_DOMAIN=
ENV GITLAB_CLIENT_ID=
ENV GITLAB_CLIENT_SECRET=
ENV GITLAB2_DISPLAY_NAME=
ENV GITLAB2_DOMAIN=
ENV GITLAB2_CLIENT_ID=
ENV GITLAB2_CLIENT_SECRET=

# Monorepo single-package build. Build context is the repo root (see the
# root captain-definition: dockerfilePath ./server/deploy/Dockerfile).
COPY . /silex
WORKDIR /silex
RUN npm install -g pnpm@9.14.1 \
  && pnpm install --frozen-lockfile --filter @silexlabs/silex \
  && pnpm build

# The default SaaS config (server + client) lives in server/deploy/ and is loaded by
# default — see server/config.ts (configFilePath / client config). Override per-instance
# with SILEX_SERVER_CONFIG / SILEX_CLIENT_CONFIG env vars if self-hosting a custom setup.

CMD ["pnpm", "start"]
