import netstatRaw from 'node-netstat';

function netStat(protocol: 'tcp' | 'udp', port: number, established: boolean) {
  return new Promise<boolean>((res, rej) => {
    netstatRaw({ filter: { protocol }, sync: true }, (item) => {
      if ((item.remote.port === port || item.local.port === port) && (!established || (established && item.state === 'ESTABLISHED'))) {
        res(true);
        return false;
      }
      return true;
    });
    res(false);
  });
}


export function isPortListening(protocol: 'tcp' | 'udp', port: number, established: boolean): Promise<boolean> {
  return netStat(protocol, port, established);
}


export const printPorts = () => netstatRaw({ filter: {}, sync: true }, (item) => {
  console.log('ITEM', JSON.stringify(item));
});