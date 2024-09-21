#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PLUGIN_DIR=$SCRIPT_DIR/plugins

curl -L -o $PLUGIN_DIR/Geyser-Spigot.jar \
    https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot

curl -L -o $PLUGIN_DIR/Floodgate-Spigot.jar \
    https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot