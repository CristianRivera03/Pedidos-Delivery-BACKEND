import { Product } from '@core/entities/product.entity';
import { Uuid } from '@core/value-objects/uuid.value-object';
import { ValidationError } from '@core/errors/validation.error';

describe('Product Entity (Domain Validation)', () => {
  const categoryId = new Uuid();

  it('debería crear un producto válido cuando el precio > 0 y stock >= 0', () => {
    const product = Product.create({
      categoryId,
      name: 'Hamburguesa Especial',
      description: 'Doble carne y queso',
      price: 8.50,
      stock: 25,
    });

    expect(product.getName()).toBe('Hamburguesa Especial');
    expect(product.getPrice()).toBe(8.50);
    expect(product.getStock()).toBe(25);
    expect(product.isActive()).toBe(true);
  });

  it('debería rechazar un producto con precio <= 0 (RF-03 & RF-09)', () => {
    expect(() => {
      Product.create({
        categoryId,
        name: 'Invalido',
        price: 0,
        stock: 10,
      });
    }).toThrow(ValidationError);

    expect(() => {
      Product.create({
        categoryId,
        name: 'Invalido Negativo',
        price: -5,
        stock: 10,
      });
    }).toThrow(ValidationError);
  });

  it('debería rechazar un producto con stock negativo (stock < 0) (RF-03 & RF-09)', () => {
    expect(() => {
      Product.create({
        categoryId,
        name: 'Invalido Stock',
        price: 5.00,
        stock: -1,
      });
    }).toThrow(ValidationError);
  });

  it('debería permitir ajustar el stock a 0 o más y rechazar si queda negativo', () => {
    const product = Product.create({
      categoryId,
      name: 'Pizza',
      price: 12.00,
      stock: 5,
    });

    product.adjustStock(-5);
    expect(product.getStock()).toBe(0);

    expect(() => {
      product.adjustStock(-1);
    }).toThrow(ValidationError);
  });
});
