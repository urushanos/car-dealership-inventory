import { z } from 'zod';

export const createVehicleSchema = z.object({
  make: z.string().trim().min(1, 'Make cannot be empty'),
  model: z.string().trim().min(1, 'Model cannot be empty'),
  category: z.string().trim().min(1, 'Category cannot be empty'),
  price: z.number().min(0, 'Price must be non-negative'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative')
    .optional(),
  year: z
    .number()
    .int('Year must be an integer')
    .min(1900, 'Year must be 1900 or later')
    .optional(),
  vin: z.string().trim().min(1, 'VIN cannot be empty').optional(),
  status: z.enum(['available', 'sold', 'reserved']).optional(),
});

export const updateVehicleSchema = z
  .object({
    make: z.string().trim().min(1, 'Make cannot be empty').optional(),
    model: z.string().trim().min(1, 'Model cannot be empty').optional(),
    category: z.string().trim().min(1, 'Category cannot be empty').optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .min(0, 'Quantity cannot be negative')
      .optional(),
    year: z
      .number()
      .int('Year must be an integer')
      .min(1900, 'Year must be 1900 or later')
      .optional(),
    vin: z.string().trim().min(1, 'VIN cannot be empty').optional(),
    status: z.enum(['available', 'sold', 'reserved']).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  });

export const searchVehicleSchema = z
  .object({
    make: z.string().trim().optional(),
    model: z.string().trim().optional(),
    category: z.string().trim().optional(),
    minPrice: z.coerce.number().min(0, 'minPrice must be non-negative').optional(),
    maxPrice: z.coerce.number().min(0, 'maxPrice must be non-negative').optional()
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: 'minPrice cannot exceed maxPrice',
      path: ['minPrice'],
    }
  );

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type SearchVehicleQuery = z.infer<typeof searchVehicleSchema>;

export const restockVehicleSchema = z
  .object({
    quantity: z
      .number()
      .int('Restock quantity must be a positive integer')
      .positive('Restock quantity must be a positive integer')
      .optional(),
    quantityToAdd: z
      .number()
      .int('Restock quantity must be a positive integer')
      .positive('Restock quantity must be a positive integer')
      .optional(),
  })
  .refine(
    (data) => data.quantity !== undefined || data.quantityToAdd !== undefined,
    {
      message: 'Restock quantity is required',
    }
  );

export type RestockVehicleInput = z.infer<typeof restockVehicleSchema>;