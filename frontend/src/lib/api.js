import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const apiClient = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
});

export const submitPartialLead = async (payload) => {
    const { data } = await apiClient.post("/leads/partial", payload);
    return data;
};

export const submitFullLead = async (payload) => {
    const { data } = await apiClient.post("/leads/submit", payload);
    return data;
};
