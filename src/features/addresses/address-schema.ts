import { z } from "zod";

/**
 * Field names mirror the Address model in @/types/models. If the backend DTO
 * uses different names (street vs line1, zip vs postalCode), change them in
 * both places — this schema and the model.
 */
export const addressSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(7, "Enter a valid phone number"),
  line1: z.string().min(1, "Street address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().optional(),
  country: z.string().min(1, "Country is required").default("Nigeria"),
});

export type AddressValues = z.infer<typeof addressSchema>;

/** Nigerian states for the state selector. */
export const NG_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River",
  "Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe","Imo","Jigawa","Kaduna","Kano",
  "Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo",
  "Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
] as const;
