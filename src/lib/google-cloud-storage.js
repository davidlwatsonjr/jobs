const { Storage } = require("@google-cloud/storage");

const { GCS_BUCKET } = process.env;

let bucket;
if (GCS_BUCKET) {
  bucket = new Storage().bucket(GCS_BUCKET);
} else {
  console.warn(
    "GCS_BUCKET environment variable needs to be set for Google Cloud Storage to work.",
  );
}

const getFile = async (name) => {
  return (
    await bucket
      ?.file(name)
      .download()
      .catch(() => null)
  )?.toString();
};

const saveFile = async (name, data, saveOptions) => {
  return await bucket?.file(name).save(data, saveOptions);
};

const deleteFile = async (name) => {
  return await bucket
    ?.file(name)
    .delete()
    .catch(() => null);
};

module.exports = {
  getFile,
  saveFile,
  deleteFile,
};
