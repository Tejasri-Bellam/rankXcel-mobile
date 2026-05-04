import { useCallback, useState } from "react";
import { Linking, Platform, Share } from "react-native";
import type { View } from "react-native";
import type React from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import RNBlobUtil from "react-native-blob-util";
import { buildCertificateHtml } from "@/components/dashboard/certificates/utils/certificateHtml";
import { useAppModal } from "@/components/ui/AppModal";
import type { CertificateDetail, CertificateLinkedInData } from "@/types/certificates";

interface UseShareResult {
  shareNative: (certificate: CertificateDetail) => Promise<void>;
  shareLinkedIn: (data: CertificateLinkedInData) => Promise<void>;
  shareWhatsApp: (certificate: CertificateDetail) => Promise<void>;
  shareTwitter: (certificate: CertificateDetail) => Promise<void>;
  downloadPdf: (certificate: CertificateDetail) => Promise<void>;
  downloadPng: (certificate: CertificateDetail, viewRef: React.RefObject<View | null>) => Promise<void>;
  isDownloadingPdf: boolean;
  isDownloadingPng: boolean;
}

export function useShare(): UseShareResult {
  const modal = useAppModal();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);

  const shareNative = useCallback(async (certificate: CertificateDetail) => {
    await Share.share({
      url: certificate.verification_url,
      message: certificate.verification_url,
      title: `Certificate: ${certificate.course_title}`,
    });
  }, []);

  const shareLinkedIn = useCallback(
    async (data: CertificateLinkedInData) => {
      const params = new URLSearchParams({
        startTask: "CERTIFICATION_NAME",
        name: data.name,
        organizationName: data.issuing_organization,
        issueYear: String(data.issue_date.year),
        issueMonth: String(data.issue_date.month),
        certUrl: data.credential_url,
        certId: data.credential_id,
      });
      const url = `https://www.linkedin.com/profile/add?${params.toString()}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    },
    [],
  );

  const shareWhatsApp = useCallback(async (certificate: CertificateDetail) => {
    const text = encodeURIComponent(
      `I earned a certificate for "${certificate.course_title}" on Trainly!\nVerify it here: ${certificate.verification_url}`,
    );
    const url = `https://wa.me/?text=${text}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  }, []);

  const shareTwitter = useCallback(async (certificate: CertificateDetail) => {
    const text = encodeURIComponent(
      `I just earned a certificate for "${certificate.course_title}" on @TrainlyApp! 🎓`,
    );
    const url = encodeURIComponent(certificate.verification_url);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    const canOpen = await Linking.canOpenURL(twitterUrl);
    if (canOpen) {
      await Linking.openURL(twitterUrl);
    }
  }, []);

  // Generates a PDF from the certificate HTML.
  // Android: saves directly to the public Downloads folder with a system notification.
  // iOS: opens the share sheet so the user can save to Files → Downloads.
  const downloadPdf = useCallback(async (certificate: CertificateDetail) => {
    setIsDownloadingPdf(true);
    try {
      const certWidth = 612;
      const certHeight = Math.round(certWidth * 566 / 800);
      const html = buildCertificateHtml(certificate, certWidth);
      const { uri } = await Print.printToFileAsync({ html, width: certWidth, height: certHeight });
      // expo-print returns a file:// URI — strip the prefix for file system operations
      const srcPath = uri.startsWith("file://") ? uri.slice(7) : uri;
      const safeTitle = certificate.course_title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
      const filename = `Trainly_Certificate_${safeTitle}.pdf`;

      if (Platform.OS === "android") {
        const androidVersion = typeof Platform.Version === "number"
          ? Platform.Version
          : parseInt(Platform.Version, 10);

        if (androidVersion >= 29) {
          // Android 10+ — MediaStore API (no WRITE_EXTERNAL_STORAGE needed)
          await RNBlobUtil.MediaCollection.copyToMediaStore(
            { name: filename, parentFolder: "", mimeType: "application/pdf" },
            "Download",
            srcPath,
          );
        } else {
          // Android < 10 — write directly to DownloadDir
          const destPath = `${RNBlobUtil.fs.dirs.DownloadDir}/${filename}`;
          await RNBlobUtil.fs.cp(srcPath, destPath);
          await RNBlobUtil.android.addCompleteDownload({
            title: filename,
            description: `Certificate for ${certificate.course_title}`,
            mime: "application/pdf",
            path: destPath,
            showNotification: true,
          });
        }
        modal.show({ variant: "success", title: "Saved", message: `"${filename}" saved to your Downloads folder.` });
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Certificate — ${certificate.course_title}`,
          UTI: "com.adobe.pdf",
        });
      }
    } catch {
      modal.show({ variant: "error", title: "Download Failed", message: "Could not generate the PDF. Please try again." });
    } finally {
      setIsDownloadingPdf(false);
    }
  }, []);

  // Captures the certificate card View as a PNG and saves it to the photo library.
  const downloadPng = useCallback(
    async (_certificate: CertificateDetail, viewRef: React.RefObject<View | null>) => {
      if (!viewRef.current) {
        modal.show({ variant: "error", title: "Error", message: "Certificate view is not ready. Please try again." });
        return;
      }
      setIsDownloadingPng(true);
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          modal.show({ variant: "warning", title: "Permission Required", message: "Allow Trainly to access your photo library to save the certificate image." });
          return;
        }
        const uri = await captureRef(viewRef, {
          format: "png",
          quality: 1,
          result: "tmpfile",
        });
        await MediaLibrary.saveToLibraryAsync(uri);
        modal.show({ variant: "success", title: "Saved", message: "Certificate image saved to your photo library." });
      } catch {
        modal.show({ variant: "error", title: "Download Failed", message: "Could not capture the certificate image. Please try again." });
      } finally {
        setIsDownloadingPng(false);
      }
    },
    [],
  );

  return {
    shareNative,
    shareLinkedIn,
    shareWhatsApp,
    shareTwitter,
    downloadPdf,
    downloadPng,
    isDownloadingPdf,
    isDownloadingPng,
  };
}
