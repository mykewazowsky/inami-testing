export const GEOSERVER_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8080/geoserver"
    : "https://geo.inami.id/geoserver";
