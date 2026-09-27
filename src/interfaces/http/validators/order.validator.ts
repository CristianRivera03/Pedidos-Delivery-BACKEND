import { z } from 'zod';

export const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de pedido inválido (debe ser UUID)'),
  }),
});

export const checkoutOrderSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['CARD', 'CASH'], {
      errorMap: () => ({ message: 'El método de pago debe ser CARD o CASH' }),
    }),
    deliveryAddress: z
      .string()
      .min(5, 'La dirección de entrega debe tener al menos 5 caracteres')
      .max(255, 'Máximo 255 caracteres'),
    items: z
      .array(
        z.object({
          productId: z.string().uuid('ID de producto inválido'),
          quantity: z.number().int('La cantidad debe ser entera').positive('La cantidad debe ser mayor a 0'),
        }),
      )
      .min(1, 'El pedido debe tener al menos un producto'),
  }),
});

export const listOrdersQuerySchema = z.object({
  query: z.object({
    status: z
      .enum(['CREADO', 'PAGADO', 'EN_PREPARACION', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'])
      .optional(),
    userId: z.string().uuid('ID de usuario inválido').optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de pedido inválido (debe ser UUID)'),
  }),
  body: z.object({
    // CREADO y PAGADO se excluyen a propósito: solo se asignan durante el checkout.
    status: z.enum(['EN_PREPARACION', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'], {
      errorMap: () => ({ message: 'Estado inválido' }),
    }),
  }),
});

export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>['body'];
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>['query'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
