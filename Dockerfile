FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

#RUN chmod +x ./wait-for-it.sh


# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
#COPY package.json ./

RUN npm install

RUN ln -s /usr/src/app/backend/config/dev-config.js /usr/src/app/backend/config/config.js
RUN ln -s /usr/src/app/src/config/dev-config.js /usr/src/app/src/config/config.js

RUN npm run build

RUN cd  /usr/src/app/backend && npm install


# If you are building your code for production
# RUN npm install --only=production


EXPOSE 8000
#RUN ping mongodb
#RUN cd /usr/src/app/backend && npm run service && npm run scheduelr

WORKDIR /usr/src/app/backend
CMD ["npm","run","service"]
CMD ["npm","run","scheduler"]
