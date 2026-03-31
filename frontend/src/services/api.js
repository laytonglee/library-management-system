import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Let errors propagate — AuthContext handles 401 via route protection
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default api;
