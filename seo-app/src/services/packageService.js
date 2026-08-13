import api from "../lib/api";

export const getActivePackages = () => api.get("/packages");
