"use server";
import { GfyResponse, GfyDetailResponse, AccountsResponse } from "@/lib/types";
const BASE_URL = process.env.BASE_URL;

export async function searchGfys(formData: FormData) {
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
  let res = await fetch(apiUrl.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
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

export async function addGfyView(videoUrl: string) {
  const apiUrl = `${BASE_URL}/api/gfy/views`;
  let res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ videoUrl }),
  });
}
