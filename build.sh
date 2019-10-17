#!/usr/bin/env bash
DHIS2_APP_FOLDER="/var/lib/dhis2/mflapp/files/apps/elmis"
echo "Building the eLMIS app"
#ng build --prod --base ""
npm run build-dev
echo "Preparing the install app files"
if [ -d "./dist" ]; then
  cp -rf src/manifest.webapp dist
  cd dist
  if [ -d $DHIS2_APP_FOLDER ]; then
    sudo rsync --delete -vaz . $DHIS2_APP_FOLDER
  else
    echo "Creating the eLMIS App folder"
    sudo mkdir $DHIS2_APP_FOLDER
    sudo rsync --delete -vaz . $DHIS2_APP_FOLDER
  fi
  echo packaging the file as zip
  zip -r elmis.zip *
  sudo cp -r elmis.zip $DHIS2_APP_FOLDER
  echo "Installing eLMIS apps"
  #curl -k -X POST -F file=@mflappv5.zip -u admin:district https://192.168.10.102/mflapp/api/28/apps
  echo "Installed eLMIS apps"
  echo "Cleaning up"
  find . -type f -not -name '*.zip' -print0 | xargs -0 rm --
  find . -type d -name 'assets' -print0 | xargs -0 rm -r
  echo "Finished"
  cd ..
else
  echo "Build failed"
fi
