FROM node:18

# see doc about env vars here: https://github.com/silexlabs/Silex/wiki/How-to-Host-An-Instance-of-Silex#environment-variables
# these can be overriden using the `-e` option in docker run
# FS_ROOT=/repo.git/
ENV DIRECTUS_URL=

COPY . /silex
WORKDIR /silex
RUN apt-get update
RUN npm install

# Rebuild so that we use DIRECTUS_URL env var
RUN npm run build

EXPOSE 6805
CMD ["npm", "start"]
