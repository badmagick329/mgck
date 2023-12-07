"use server";
const BASE_URL = process.env.BASE_URL;

export async function searchGfys(formData: FormData) {
  const title = formData.get("title") || "";
  const tags = formData.get("tags") || "";
  console.log(`title: ${title}`);
  console.log(`tags: ${tags}`);
  const apiUrl = new URL(`${BASE_URL}/api/gfys`);
  apiUrl.searchParams.append("title", title as string);
  apiUrl.searchParams.append("tags", tags as string);
  let res = await fetch(apiUrl.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = await res.json();
  return data;
}
