FROM --platform=linux/amd64 node:20.18.0-bullseye

WORKDIR /build

RUN apt-get update && apt-get install -y \
    build-essential \
    libkrb5-dev \
    python3 \
    python3-pip \
    libx11-dev \
    libxkbfile-dev \
    libsecret-1-dev \
    pkg-config \
    make \
    g++ \
    gcc \
    python3-dev

RUN node -v && node -p process.arch

ENV NODE_OPTIONS="--max-old-space-size=32768"
ENV NODE_GYP_FORCE_PYTHON=/usr/bin/python3

COPY . .
RUN rm -rf node_modules
RUN npm install --verbose

RUN npm install -g gulp

CMD ["npm", "run", "gulp", "vscode-linux-x64"]
