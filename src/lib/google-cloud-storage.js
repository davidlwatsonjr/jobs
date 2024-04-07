const { Storage } = require("@google-cloud/storage");

const { GCS_BUCKET } = process.env;

const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

const getFile = async (name) => {
  return (
    await bucket
      .file(name)
      .download()
      .catch(() => null)
  )?.toString();
};

const saveFile = async (name, data, saveOptions) => {
  return await bucket.file(name).save(data, saveOptions);
};

const deleteFile = async (name) => {
  return await bucket
    .file(name)
    .delete()
    .catch(() => null);
};

module.exports = {
  getFile,
  saveFile,
  deleteFile,
};
