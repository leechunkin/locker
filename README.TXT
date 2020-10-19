ENVIRONMENT VARIABLE
====================

DATABASE_URL  database connection string
PORT          socket port for HTTP/HTTPS (default 80)


DATABASE DRIVERS
================

Database drivers have to be installed manually, or local version of
"package.json" is set-up for your chosen driver.

See: https://www.npmjs.com/package/database-js#drivers


SETUP DATABASE
==============

Run sql/setup.sql


TLS CERTIFICATE
===============

certificate file: certificate.pem
private key file: key.pem

HTTPS and HTTP/2 are used if these files existed in the working directory.
Otherwise, HTTP and HTTP/1 are used.


EXECUTE
=======

To start web server:
npm run-script start

To start Electron App:
npm run-script electron
