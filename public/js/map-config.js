export const GEOSERVER_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8080/"
    : "https://foster-cringing-unwary.ngrok-free.dev/geoserver";

export const GEOSERVER_HEADERS = {
  "ngrok-skip-browser-warning": "true",
};
