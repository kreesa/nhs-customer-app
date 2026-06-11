const BASE_URL = "https://nepalhomeservice.com";
import * as SecureStore from "expo-secure-store";

export async function login(
  email: string,
  password: string,
  device_name: string,
) {
  const response = await fetch(
    `${BASE_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        device_name,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Login failed"
    );
  }

  return data;
}


export async function saveToken(
  token: string
) {
  await SecureStore.setItemAsync(
    "auth_token",
    token
  );
}

export async function getToken() {
  return SecureStore.getItemAsync(
    "auth_token"
  );
}

export async function removeToken() {
  return SecureStore.deleteItemAsync(
    "auth_token"
  );
}


// Logout
export async function logout() {
  const token = await getToken();

  const response = await fetch(
    `${BASE_URL}/api/auth/logout`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  await removeToken();

  return response.json();
}