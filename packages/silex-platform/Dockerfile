FROM node:16

COPY . /silex
WORKDIR /silex

# Already done in github action:
# RUN npm install
# RUN npm run build

EXPOSE 6805
CMD ["npm", "start"]
