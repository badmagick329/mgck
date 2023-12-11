"use server";
import { GfyResponse, GfyDetailResponse, AccountsResponse } from "@/lib/types";
const BASE_URL = process.env.BASE_URL;

export async function searchGfys(formData: FormData) {
  let currentTime = performance.timeOrigin + performance.now();
  console.log(`Action called at: ${currentTime}`);
  const title = formData.get("title") || "";
  const tags = formData.get("tags") || "";
  const page = formData.get("page") || "1";
  let account = formData.get("account") || "";
  if (account == "All") {
    account = "";
  }
  const apiUrl = new URL(`${BASE_URL}/api/gfys`);
  apiUrl.searchParams.append("title", title as string);
  apiUrl.searchParams.append("tags", tags as string);
  apiUrl.searchParams.append("account", account as string);
  apiUrl.searchParams.append("page", page as string);
  let now = performance.now();
  let res = await fetch(apiUrl.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log("fetch took", performance.now() - now, "ms");
  now = performance.now();
  const data = await res.json();
  console.log("json took", performance.now() - now, "ms");
  // TODO: Validation
  return data as GfyResponse;
}

export async function fetchGfy(videoId: string) {
  const apiUrl = new URL(`${BASE_URL}/api/gfys/${videoId}`);
  let res = await fetch(apiUrl.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  // TODO: Validation
  return data as GfyDetailResponse;
}

export async function fetchAccounts() {
  const apiUrl = new URL(`${BASE_URL}/api/accounts`);
  let res = await fetch(apiUrl.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  // TODO: Validation
  return data as AccountsResponse;
}
