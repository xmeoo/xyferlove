globalThis.xyferPrepareStorage = scope => new Promise((resolve, reject) => {
  globalThis.xyferStorageName = '$xyfer-state:' + scope;
  const request = indexedDB.open(globalThis.xyferStorageName, 1);
  request.onupgradeneeded = () => {
    for (const name of ['config', 'cookies', 'redirectTrackers', 'referrerPolicies', 'publicSuffixList']) {
      if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name);
    }
  };
  request.onsuccess = () => { request.result.close(); resolve(); };
  request.onerror = () => reject(new Error('Unable to prepare storage.'));
});
