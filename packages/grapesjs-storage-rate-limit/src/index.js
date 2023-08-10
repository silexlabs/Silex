export default (editor, opts = {}) => {
  const options = { ...{
    // default options
    time: 1000, // ms
  },  ...opts };

  const storage = editor.StorageManager.getCurrentStorage();
  const storageOptions = editor.StorageManager.getCurrentOptions();

  editor.StorageManager.setCurrent('rate-limit')

  let isCoolingDown = false;
  let pendingSave = false;
  let latestData = null;

  // Prevent reload while cooling down and before saving
  window.addEventListener('beforeunload', (e) => {
    console.log('beforeunload', e);
    if (pendingSave) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Save the latest data once the cooldown period is over
  const doStore = async (data) => {
    // Save the data immediately
    await storage.store(data, storageOptions);
    // Start another cooldown period after saving
    startCooldown();
  };

  // Start the cooldown period
  const startCooldown = () => {
    isCoolingDown = true;
    setTimeout(async () => {
      isCoolingDown = false;
      if (pendingSave) {
        pendingSave = false;  // Reset the pending save flag
        await doStore(latestData); // Save the latest data once cooldown is over
      }
    }, options.time);
  };

  // Add the rate-limit storage
  editor.Storage.add('rate-limit', {

    // Store the data
    // Adds a cooldown period before saving again
    async store(data) {
      latestData = data;

      if (isCoolingDown) {
        pendingSave = true;
        return;
      }

      await doStore(data);
    },

    // Do nothing
    // Let the initial storage manager handle the load
    async load(options) {
      return storage.load(storageOptions);
    },
  });
};
