import z from "zod";

export const userSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.email("Email must be format in email like: example@email.com"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const categorySchema = z.object({
  name: z.string().min(3, "Category name must be at least 3 characters"),
});

export const paymentMethodSchema = z.object({
  type: z.enum(["bank", "e-wallet"]),
  provider: z.string().min(3, "Provider must be at least 3 characters"),
  accountNumber: z.string().min(8, "Account number must be at least 8 characters"),
  accountHolderName: z.string().min(3, "Account holder name must be at least 3 characters"),
});

export const campaignSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  category: z.object({
    name: z.string().min(1, "Category must be required"),
  }),
  targetAmount: z.coerce.bigint().default(0),
  currentAmount: z.coerce.bigint().default(0),
  deadline: z.string(),
});

export const donationSchema = z.object({
  donor: z.string().nonempty().min(3, "Name must be at least 3 characters"),
  amount: z.coerce.bigint(),
  notes: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  password: z.string().min(8, "Password must be at least 3 characters").optional(),
});

export const updateRoleSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNotes: z.string().optional(),
});
