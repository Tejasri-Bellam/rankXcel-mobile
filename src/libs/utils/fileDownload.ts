import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { storageGetAccessToken } from "./storage";
import { getAuthState } from "../context/authStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

interface DownloadAuthenticatedFileOptions {
  endpointPath: string;
  filename: string;
  mimeType: string;
  onProgress?: (progress: number) => void;
}

export async function downloadAuthenticatedFile({
  endpointPath,
  filename,
  mimeType,
  onProgress,
}: DownloadAuthenticatedFileOptions): Promise<string> {
  const token = getAuthState().token ?? await storageGetAccessToken();
  const url = `${API_BASE_URL}${endpointPath}`;

  const cacheUri = `${FileSystem.cacheDirectory}${filename}`;

  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    cacheUri,
    { headers: token ? { Authorization: `Token ${token}` } : {} },
    (downloadProgress) => {
      if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress(progress);
      }
    },
  );

  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) throw new Error("File download failed");

  if (Platform.OS === "android") {
    const downloadsUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Download");
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(downloadsUri);
    if (!permissions.granted) throw new Error("Storage permission denied");

    const fileContent = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const safUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      filename,
      mimeType,
    );

    await FileSystem.writeAsStringAsync(safUri, fileContent, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await FileSystem.deleteAsync(result.uri, { idempotent: true });
    onProgress?.(1);
    return safUri;
  }

  onProgress?.(1);
  return result.uri;
}
