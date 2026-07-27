import { api } from "@/lib/api-client";
import type { CustomerProfile, DashboardOverview, ActivityEntry } from "@/types/models";

export interface UpdateProfileRequest {
  firstName?: string; lastName?: string; phoneNumber?: string; // TODO confirm editable fields
}
export interface NotificationPreferences { [key: string]: boolean; } // TODO confirm

export const customerApi = {
  me: () => api.get<CustomerProfile>("/customers/me"),
  updateMe: (body: UpdateProfileRequest) => api.put<CustomerProfile>("/customers/me", body),
  uploadPicture: (file: File) => {
    const fd = new FormData();
    fd.append("file", file); // TODO confirm form field name
    return api.postForm<CustomerProfile>("/customers/me/picture", fd);
  },
  deletePicture: () => api.delete<CustomerProfile>("/customers/me/picture"),
  updatePreferences: (body: Record<string, unknown>) => api.put<void>("/customers/me/preferences", body),
  updateNotificationPreferences: (body: NotificationPreferences) =>
    api.put<void>("/customers/me/notification-preferences", body),
  dashboard: () => api.get<DashboardOverview>("/customers/me/dashboard"),
  activity: () => api.get<ActivityEntry[]>("/customers/me/activity"),
};
