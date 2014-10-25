FROM node:0.10.32

RUN npm install -g npm@1.x
RUN mkdir -p /workspace
RUN adduser web --home /home/web --shell /bin/bash --disabled-password --gecos ""
RUN chown -R web:web /workspace
USER web
ADD package.json /workspace/package.json
WORKDIR /workspace
RUN npm install
RUN npm run-script bower-install
ADD package.json /workspace/package.json
ADD bower.json /worksapce/bower.json
ADD . /workspace
