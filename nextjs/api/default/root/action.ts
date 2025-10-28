"use server";

import { fetchRootInfo } from "./fetcher";

async function fetchRootInfoAction() {
  return await fetchRootInfo();
}

export { fetchRootInfoAction };

