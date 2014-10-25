FROM node:0.10.32

RUN mkdir -p /workspace
ADD . /workspace
WORKDIR /workspace
RUN npm install -g npm@1.x
RUN npm install
