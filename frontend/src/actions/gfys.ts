"use server";
import { GfyResponse, GfyDetailResponse, AccountsResponse } from "@/lib/types";
import { validDateStringOrNull } from "@/lib/utils";
const BASE_URL = process.env.BASE_URL;

export async function searchGfys(formData: FormData) {
  const title = formData.get("title")?.toString() || "";
  const tags = formData.get("tags")?.toString() || "";
  let start_date = formData.get("start_date")?.toString() || "";
  if (start_date) {
    start_date = validDateStringOrNull(start_date) || "";
  }
  let end_date = formData.get("end_date")?.toString() || "";
  if (end_date) {
    end_date = validDateStringOrNull(end_date) || "";
  }
  const page = formData.get("page")?.toString() || "1";
  let account = formData.get("account")?.toString() || "";
  if (account == "All") {
    account = "";
  }
  const apiUrl = new URL(`${BASE_URL}/api/gfys`);
  apiUrl.searchParams.append("title", title);
  apiUrl.searchParams.append("tags", tags);
  apiUrl.searchParams.append("start_date", start_date);
  apiUrl.searchParams.append("end_date", end_date);
  apiUrl.searchParams.append("account", account);
  apiUrl.searchParams.append("page", page);
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
