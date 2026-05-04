import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "@/types/api";
import {
  getCertificateDetail,
  getCertificateLinkedInData,
} from "@/libs/services/certificates/certificateService";
import type { CertificateDetail, CertificateLinkedInData } from "@/types/certificates";

interface UseCertificateDetailState {
  certificate: CertificateDetail | null;
  linkedInData: CertificateLinkedInData | null;
  isLoading: boolean;
  isLoadingLinkedIn: boolean;
  error: ApiError | null;
}

interface UseCertificateDetailResult extends UseCertificateDetailState {
  refresh: () => void;
  loadLinkedInData: () => Promise<CertificateLinkedInData | null>;
}

export function useCertificateDetail(id: number): UseCertificateDetailResult {
  const [state, setState] = useState<UseCertificateDetailState>({
    certificate: null,
    linkedInData: null,
    isLoading: true,
    isLoadingLinkedIn: false,
    error: null,
  });

  const fetchCertificate = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await getCertificateDetail(id);
      setState((prev) => ({
        ...prev,
        certificate: response.data,
        isLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err as ApiError,
      }));
    }
  }, [id]);

  const loadLinkedInData = useCallback(async (): Promise<CertificateLinkedInData | null> => {
    setState((prev) => ({ ...prev, isLoadingLinkedIn: true }));
    try {
      const response = await getCertificateLinkedInData(id);
      setState((prev) => ({
        ...prev,
        linkedInData: response.data,
        isLoadingLinkedIn: false,
      }));
      return response.data;
    } catch {
      setState((prev) => ({ ...prev, isLoadingLinkedIn: false }));
      return null;
    }
  }, [id]);

  const refresh = useCallback(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  useEffect(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  return { ...state, refresh, loadLinkedInData };
}
