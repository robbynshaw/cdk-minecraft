"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPortListening = isPortListening;
const node_netstat_1 = __importDefault(require("node-netstat"));
function netStat(protocol, port, established) {
    return new Promise((res, rej) => {
        (0, node_netstat_1.default)({ filter: { protocol }, sync: true }, (item) => {
            console.log(JSON.stringify(item));
            if ((item.remote.port === port || item.local.port === port) && (!established || (established && item.state === 'ESTABLISHED'))) {
                res(true);
                return false;
            }
            return true;
        });
        res(false);
    });
}
function isPortListening(protocol, port, established) {
    return netStat(protocol, port, established);
}
(0, node_netstat_1.default)({ filter: {}, sync: true }, (item) => {
    console.log('ITEM', JSON.stringify(item));
});
