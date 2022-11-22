FROM node:16

COPY . /silex
WORKDIR /silex

RUN npm install
RUN npm run build

EXPOSE 6805
CMD ["npm", "start"]
