const { STORAGE_BASE_URL, STORAGE_API_KEY } = process.env;

if (!STORAGE_BASE_URL || !STORAGE_API_KEY) {
  console.warn(
    "STORAGE_BASE_URL and STORAGE_API_KEY environment variables need to be set for storage to work.",
  );
}

const headers = { "x-api-key": STORAGE_API_KEY };

const getFile = async (id) => {
  if (!STORAGE_BASE_URL || !STORAGE_API_KEY) {
    return;
  }
  const url = `${STORAGE_BASE_URL}/files/${id}`;
  console.log(`Getting file ${id} with ${url}`);
  return await fetch(url, { headers });
};

const saveFile = async (id, body) => {
  if (!STORAGE_BASE_URL || !STORAGE_API_KEY) {
    return;
  }
  headers["Content-Type"] = "application/json";
  const url = `${STORAGE_BASE_URL}/files/${id}`;
  const fetchBody = JSON.stringify({ body });

  console.log(`Updating ${id} using ${url}`);
  const response = await fetch(url, {
    headers,
    method: "PUT",
    body: fetchBody,
  });
  console.log(`Updated ${id}`);
  return response;
};

module.exports = {
  getFile,
  saveFile,
};
