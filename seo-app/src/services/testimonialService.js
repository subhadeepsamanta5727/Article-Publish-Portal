import api from "../lib/api";

export const getActiveTestimonials = () => api.get("/testimonials");
