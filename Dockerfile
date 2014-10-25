FROM node:0.10.32

RUN npm install -g npm@1.x
RUN mkdir -p /workspace
ADD package.json /workspace/package.json
WORKDIR /workspace
RUN npm install
ADD . /workspace
