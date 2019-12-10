#!/bin/bash

# Script to provision a Debian 9 instance to run the Open Targets web app

sudo apt install --yes curl build-essential apt-transport-https

# Install Yarn - needs a custom repo
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt install --yes --no-install-recommends yarn

# Use NVM to install the correct versions of Node etc
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.1/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
nvm install 8
nvm use 8

# Checkout Open Targets web app
git clone https://github.com/opentargets/webapp.git
cd webapp

# Optional - do any customisations to the web app here

# Build the web app
yarn install

# Edit this to point to the host where your API is running, if you are using a custom API host. Note the URL can include a port if required.
export APIHOST=http://platform-api.opentargets.io

yarn run setup
yarn run build-all

# Optional - server for testing
# yarn run server

