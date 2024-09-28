#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PLUGIN_DIR=$SCRIPT_DIR/plugins

# rm $PLUGIN_DIR/*.jar

curl -L -o $PLUGIN_DIR/Geyser-Spigot.jar \
    https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot

curl -L -o $PLUGIN_DIR/Floodgate-Spigot.jar \
    https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot

curl -L -o $PLUGIN_DIR/Vault.jar \
    https://github.com/MilkBowl/Vault/releases/download/1.7.3/Vault.jar

curl -L -o $PLUGIN_DIR/LuckPerms.jar \
    https://download.luckperms.net/1556/bukkit/loader/LuckPerms-Bukkit-5.4.141.jar

curl -L -o $PLUGIN_DIR/EssentialsX.jar \
    https://github.com/EssentialsX/Essentials/releases/download/2.20.1/EssentialsX-2.20.1.jar

curl -L -o $PLUGIN_DIR/SmoothTimber.jar \
    https://www.spigotmc.org/resources/smoothtimber.39965/download?version=556726

curl -L -o $PLUGIN_DIR/AwsNotifier.jar \
    https://github.com/robbynshaw/mc-aws-notifier/releases/download/v1.1.0/aws-notifier-1.1.0-all.jar