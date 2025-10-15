import axios from "axios";

const decodeJWT = (token: string | null) => {
  try {
    if (token) {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace("-", "+").replace("_", "/");
      return JSON.parse(atob(base64));
    }
  } catch (error) {
    return null;
  }
};

export const getAccessTokenFromCookie = () => {
  if (typeof document !== "undefined") {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="))
      ?.split("=")[1];
  }
  return null;
};

export const getRefreshTokenFromCookie = () => {
  if (typeof document !== "undefined") {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("refresh_token="))
      ?.split("=")[1];
  }
  return null;
};

export const getAccessTokenExpiryFromCookie = () => {
  const accessToken = getAccessTokenFromCookie();
  if (!accessToken) return null;

  const decodedToken = decodeJWT(accessToken);
  if (!decodedToken || !decodedToken.exp) return null;
  return decodedToken.exp * 1000;
};

export const saveNewAccessToken = (accessToken: any) => {
  if (typeof document !== "undefined") {
    document.cookie = `access_token=${accessToken}; path=/; max-age=${3 * 60 * 60}`;
  }
};

export const refreshAccessToken = async (refreshToken: any) => {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/token/refresh/`, {
      refresh: refreshToken,
    });
    console.log(response);
    return response.data.access;
  } catch (error) {
    throw error;
  }
};

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessTokenFromCookie();
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const scheduleTokenRefresh = () => {
  const tokenExpiryTime = getAccessTokenExpiryFromCookie();
  if (!tokenExpiryTime) return;

  const currentTime = new Date().getTime();
  const timeUntilRefresh = tokenExpiryTime - currentTime - 30 * 1000;
  console.log(timeUntilRefresh);
  if (timeUntilRefresh > 0) {
    setTimeout(() => {
      const refreshToken = getRefreshTokenFromCookie();
      if (refreshToken) {
        refreshAccessToken(refreshToken)
          .then(saveNewAccessToken)
          .catch((err) => {
            console.error("Failed to refresh token", err);
          });
      }
    }, timeUntilRefresh);
  }
};
