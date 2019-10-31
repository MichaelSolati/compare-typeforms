export const to = async (promise: Promise<any>): Promise<any> => {
  return promise.then((data) => {
     return [null, data];
  }, (rejected) => {
    return [rejected];
  })
  .catch((err) => [err]);
};