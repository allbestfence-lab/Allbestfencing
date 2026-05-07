import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;
export const BACKEND_ROOT = BACKEND_URL;

export const apiClient = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
});

// Helper to build full URL for static-served images returned as "/api/uploads/..."
export const absoluteUrl = (path) => {
    if (!path) return path;
    if (/^https?:\/\//.test(path)) return path;
    return `${BACKEND_ROOT}${path}`;
};

// Attach JWT (admin) automatically when present
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("abf_admin_token");
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ===== Leads =====
export const submitPartialLead = async (payload) => {
    const { data } = await apiClient.post("/leads/partial", payload);
    return data;
};

export const submitFullLead = async (payload) => {
    const { data } = await apiClient.post("/leads/submit", payload);
    return data;
};

// ===== Admin auth =====
export const adminLogin = async (password) => {
    const { data } = await apiClient.post("/admin/login", { password });
    return data; // { access_token, token_type }
};

export const adminVerify = async () => {
    const { data } = await apiClient.get("/admin/me");
    return data;
};

// ===== Photos (admin) =====
export const adminListPhotos = async () => {
    const { data } = await apiClient.get("/admin/photos");
    return data;
};

export const uploadPhotos = async ({
    files,
    category,
    caption,
    featured,
    showOnHomepage,
    serviceHeroFor,
    onUploadProgress,
}) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("category", category || "Other");
    if (caption) fd.append("caption", caption);
    fd.append("featured", featured ? "true" : "false");
    fd.append("show_on_homepage", showOnHomepage ? "true" : "false");
    if (serviceHeroFor) fd.append("service_hero_for", serviceHeroFor);

    const { data } = await apiClient.post("/admin/photos/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
    });
    return data;
};

export const updatePhoto = async (id, payload) => {
    const { data } = await apiClient.patch(`/admin/photos/${id}`, payload);
    return data;
};

export const deletePhoto = async (id) => {
    const { data } = await apiClient.delete(`/admin/photos/${id}`);
    return data;
};

// ===== Photos (public) =====
export const listPublicPhotos = async (category) => {
    const params = category && category !== "All" ? { category } : {};
    const { data } = await apiClient.get("/photos", { params });
    return data;
};

export const getServiceHeroPhotos = async () => {
    const { data } = await apiClient.get("/services/hero-photos");
    return data;
};
