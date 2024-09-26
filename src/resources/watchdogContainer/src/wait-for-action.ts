export function waitForAction(cb: () => Promise<boolean>, timeoutMS: number, intervalCheckMS: number): Promise<void> {
  const timeout = Date.now() + timeoutMS;
  return new Promise((res, rej) => {
    const interval = setInterval(() => {
      cb().then(val => {
        if (val) {
          clearInterval(interval);
          res();
        } else if (Date.now() >= timeout) {
          clearInterval(interval);
          rej('Timed out waiting for an action');
        }
      }).catch((err) => {
        clearInterval(interval);
        rej(err);
      });
    }, intervalCheckMS);
  });
}