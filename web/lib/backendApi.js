function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://localhost:5000";
  return String(raw).trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

function backendUrl(path) {
  const cleanPath = `/${String(path || "").replace(/^\/+/, "")}`;
  return `${getApiBaseUrl()}${cleanPath}`;
}

module.exports = { backendUrl, getApiBaseUrl };
