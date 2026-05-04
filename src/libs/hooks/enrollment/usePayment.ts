import { useCallback, useState } from "react";
import type { ApiError } from "@/types/api";
import {
  enrollFree as enrollFreeRequest,
  createOrder as createOrderRequest,
  verifyPayment as verifyPaymentRequest,
} from "@/libs/services/enrollment/enrollmentService";
import type {
  CreateOrderResponse,
  EnrollFreeResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from "@/types/enrollment";

interface UsePaymentState {
  isLoading: boolean;
  error: ApiError | null;
}

interface UsePaymentResult extends UsePaymentState {
  enrollFree: (courseId: number, cohortId?: number | null) => Promise<EnrollFreeResponse | null>;
  createOrder: (
    courseId: number,
    pricingGroupId: number,
    cohortId?: number | null,
  ) => Promise<CreateOrderResponse | null>;
  verifyPayment: (
    data: VerifyPaymentRequest,
  ) => Promise<VerifyPaymentResponse | null>;
  clearError: () => void;
}

export function usePayment(): UsePaymentResult {
  const [state, setState] = useState<UsePaymentState>({
    isLoading: false,
    error: null,
  });

  const enrollFree = useCallback(
    async (courseId: number, cohortId?: number | null): Promise<EnrollFreeResponse | null> => {
      setState({ isLoading: true, error: null });
      try {
        const response = await enrollFreeRequest({
          course_id: courseId,
          ...(cohortId ? { cohort_id: cohortId } : {}),
        });
        setState({ isLoading: false, error: null });
        return response.data;
      } catch (err) {
        setState({ isLoading: false, error: err as ApiError });
        return null;
      }
    },
    [],
  );

  const createOrder = useCallback(
    async (courseId: number, pricingGroupId: number, cohortId?: number | null): Promise<CreateOrderResponse | null> => {
      setState({ isLoading: true, error: null });
      try {
        const response = await createOrderRequest({
          course_id: courseId,
          pricing_group_id: pricingGroupId,
          ...(cohortId ? { cohort_id: cohortId } : {}),
        });
        setState({ isLoading: false, error: null });
        return response.data;
      } catch (err) {
        setState({ isLoading: false, error: err as ApiError });
        return null;
      }
    },
    [],
  );

  const verifyPayment = useCallback(
    async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse | null> => {
      setState({ isLoading: true, error: null });
      try {
        const response = await verifyPaymentRequest(data);
        setState({ isLoading: false, error: null });
        return response.data;
      } catch (err) {
        setState({ isLoading: false, error: err as ApiError });
        return null;
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { ...state, enrollFree, createOrder, verifyPayment, clearError };
}
