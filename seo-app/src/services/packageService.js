import api from "../lib/api";

export const getActivePackages = () => api.get("/packages");
export const getActivePublishers = () => api.get("/publishers");
