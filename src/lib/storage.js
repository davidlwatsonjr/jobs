const { STORAGE_BASE_URL, STORAGE_API_KEY } = process.env;

const headers = { "x-api-key": STORAGE_API_KEY };

const getFiles = async (q) => {
  const query = new URLSearchParams({ q });
  const url = `${STORAGE_BASE_URL}/files?${query}`;

  console.log(`Getting files using ${url}`);
  const response = await fetch(url, { headers });
  return await response.json();
};

const getFile = async (id) => {
  const url = `${STORAGE_BASE_URL}/files/${id}`;

  console.log(`Getting file ${id} with ${url}`);
  return await fetch(url, { headers });
};

const getFirstFile = async (q) => {
  const {
    data: { files },
  } = await getFiles(q);
  return files?.[0] ? await getFile(files[0].id) : Promise.resolve(null);
};

const uploadFile = async (body, name) => {
  headers["Content-Type"] = "application/json";
  const url = `${STORAGE_BASE_URL}/files`;
  const fetchBody = JSON.stringify({ body, name });

  console.log(`Uploading ${name} using ${url}`);
  const response = await fetch(url, {
    headers,
    method: "POST",
    body: fetchBody,
  });
  return await response.json();
};

const updateFile = async (id, body) => {
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
  getFiles,
  getFile,
  getFirstFile,
  saveFile: updateFile,
  uploadFile,
  updateFile,
};
