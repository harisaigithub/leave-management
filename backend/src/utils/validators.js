const { z } = require("zod");

const LEAVE_TYPES = ["SICK", "CASUAL", "EARNED", "UNPAID"];

const dateStr = z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
  message: "Must be a valid date (YYYY-MM-DD)",
});

const applyLeaveSchema = z
  .object({
    leave_type: z.enum(LEAVE_TYPES, { errorMap: () => ({ message: `leave_type must be one of ${LEAVE_TYPES.join(", ")}` }) }),
    start_date: dateStr,
    end_date: dateStr,
    reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(500),
  })
  .refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: "start_date must be on or before end_date",
    path: ["end_date"],
  });

// All fields optional on update, but if provided, same rules apply.
const updateLeaveSchema = z
  .object({
    leave_type: z.enum(LEAVE_TYPES).optional(),
    start_date: dateStr.optional(),
    end_date: dateStr.optional(),
    reason: z.string().trim().min(5).max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

const reviewLeaveSchema = z.object({
  manager_comments: z.string().trim().max(500).optional(),
});

module.exports = { LEAVE_TYPES, applyLeaveSchema, updateLeaveSchema, reviewLeaveSchema };
