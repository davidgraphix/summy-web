import { api } from "@/lib/api-client";
import type { PagedResult } from "@/types/api";
import type {
  ActivityEntry, CustomerProfile, DashboardOverview, Gender, NotificationPreferences,
} from "@/types/models";

/** Mirrors UpdateCustomerProfileRequest. Email is deliberately absent — changing it re-opens verification. */
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  secondaryPhoneNumber?: string;
  /** ISO date (yyyy-MM-dd). */
  dateOfBirth?: string;
  gender?: Gender;
}
/** Mirrors UpdatePreferencesRequest — free-form personalisation stored as JSON. */
export interface UpdatePreferencesRequest { preferencesJson?: string }

export const customerApi = {
  me: () => api.get<CustomerProfile>("/customers/me"),
  updateMe: (body: UpdateProfileRequest) => api.put<CustomerProfile>("/customers/me", body),
  uploadPicture: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.postForm<CustomerProfile>("/customers/me/picture", fd);
  },
  deletePicture: () => api.delete<void>("/customers/me/picture"),
  updatePreferences: (body: UpdatePreferencesRequest) => api.put<void>("/customers/me/preferences", body),
  updateNotificationPreferences: (body: NotificationPreferences) =>
    api.put<NotificationPreferences>("/customers/me/notification-preferences", body),
  dashboard: () => api.get<DashboardOverview>("/customers/me/dashboard"),
  activity: (pageNumber = 1, pageSize = 20) =>
    api.get<PagedResult<ActivityEntry>>("/customers/me/activity", { params: { pageNumber, pageSize } }),
};
