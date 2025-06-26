import { ApiPromise } from '@cord.network/types';

export async function waitForEvent(
  api: ApiPromise,
  eventCheck: any,
) {
  return new Promise((resolve, reject) => {
    let unsubscribe: () => void;
    api.query.system
      .events((events) => {
        events.forEach(({ phase, event }) => {
          if (phase.isApplyExtrinsic && eventCheck(event)) {
            console.log('event found:', event.toHuman());
            const fieldValue = event.data.toHuman();
            resolve(fieldValue);
            if (unsubscribe) unsubscribe();
          }
        });
      })
      .then((unsub) => {
        unsubscribe = unsub;
      });

    setTimeout(() => {
      if (unsubscribe) unsubscribe();
      reject(new Error('Timeout: Event not found'));
    }, 10_000); // 10 seconds
  });
}
