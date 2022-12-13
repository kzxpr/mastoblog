# mastoblog
Simple blog with support for Mastodon interaction using ActivityPub

## Running this is your own responsibility
This software is NOT tested for production and installing it is AT YOUR OWN RISK!

## How to run?
This section is coming very soon!!!

## If using a proxy
Remember to add these in Nginx:

    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

## ActivityPub requires SSL to test

### Run through SSH tunnel:

    ssh -R remoteport:127.0.0.1:localport user@ip.ip.ip.ip