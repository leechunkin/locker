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

To start Electron App:
npm run-script electron

To start web server:
npm run-script start

If it will not be run as web server,
dependent "xmldoc" in "package.json" can be removed.

If it will not be run as App,
dependent "electron" can be removed.


LICENSE
=======

Copyright (C) 2020  Lee Chun Kin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
