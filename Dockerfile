FROM node:18

# see doc about env vars here: https://github.com/silexlabs/Silex/wiki/How-to-Host-An-Instance-of-Silex#environment-variables
# these can be overriden using the `-e` option in docker run
# SILEX_FS_ROOT=/repo.git/

COPY . /silex
WORKDIR /silex
RUN apt-get update
RUN npm install
# RUN npm run build

EXPOSE 6805
CMD ["npm", "start"]
