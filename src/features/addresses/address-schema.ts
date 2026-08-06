import { z } from "zod";

/** Mirrors CreateAddressRequest / UpdateAddressRequest / OrderAddressRequest field names exactly. */
export const addressSchema = z.object({
  recipientName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(7, "Enter a valid phone number"),
  country: z.string().min(1, "Country is required").default("Nigeria"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  localGovernment: z.string().optional(),
  streetAddress: z.string().min(1, "Street address is required"),
  apartmentSuite: z.string().optional(),
  postalCode: z.string().optional(),
  landmark: z.string().optional(),
  deliveryInstructions: z.string().optional(),
});

export type AddressValues = z.infer<typeof addressSchema>;

/** Nigerian states for the state selector. */
export const NG_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River",
  "Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe","Imo","Jigawa","Kaduna","Kano",
  "Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo",
  "Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
] as const;
