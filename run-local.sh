#!/bin/bash

yarn build

[ -f .env ] && source .env
exec yarn start
