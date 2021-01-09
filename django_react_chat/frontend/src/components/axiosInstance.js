import axios from "axios";
import axiosRetry from "axios-retry";

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";


const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    timeout: 10000,
    Authorization: "JWT " + localStorage.getItem("accessToken"),
    "Content-Type": "application/json",
    accept: "application/json",
    'Access-Control-Allow-Origin': '*',
  },
});

axiosRetry(axiosInstance, { retries: 3 });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if (
      error &&
      (error.response.status === 401 || error.response.status === 403) &&
      (error.response.statusText === "Unauthorized" ||
        error.response.statusText === "Forbidden")
    ) {
      const refresh_token = localStorage.getItem("refreshToken");
      return axiosInstance
        .post("/token/refresh/", { refresh: refresh_token })
        .then((response) => {
          localStorage.setItem("accessToken", response.data.access);
          localStorage.setItem("refreshToken", response.data.refresh);

          axiosInstance.defaults.headers["Authorization"] =
            "JWT " + response.data.access;
          originalRequest.headers["Authorization"] =
            "JWT " + response.data.access;
          return axiosInstance(originalRequest);
        })
        .catch((err) => {
          console.log(err);
        });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
