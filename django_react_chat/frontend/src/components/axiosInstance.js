import axios from "axios";
import axiosRetry from "axios-retry";

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  headers: {
    Authorization: "JWT " + localStorage.getItem("accessToken"),
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

axiosRetry(axiosInstance, { retries: 3 });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if (
      error && error.response &&
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
