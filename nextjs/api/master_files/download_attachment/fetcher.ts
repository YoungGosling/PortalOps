import { fetchWithToken } from "@/lib/utils";

export async function fetchDownloadAttachment(fileId: string): Promise<Blob> {
  try {
    const response = await fetchWithToken(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/master-files/attachments/${fileId}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download attachment: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Error downloading attachment:", error);
    throw error;
  }
}






