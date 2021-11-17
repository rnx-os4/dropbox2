#!/bin/bash

DROPD=$1
DROPU=$2
HOMED=$3

HOME="${HOMED}" ${DROPD} > /tmp/dropbox.${DROPU}

