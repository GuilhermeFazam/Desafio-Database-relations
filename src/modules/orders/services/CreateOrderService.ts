import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
    id: string;
    quantity: number;
}

interface IRequest {
    customer_id: string;
    products: IProduct[];
}

@injectable()
class CreateOrderService {
    constructor(
        @inject('OrdersRepository')
        private ordersRepository: IOrdersRepository,
        @inject('ProductsRepository')
        private productsRepository: IProductsRepository,
        @inject('CustomersRepository')
        private customersRepository: ICustomersRepository,
    ) {}

    public async execute({ customer_id, products }: IRequest): Promise<Order> {
        const checkCustomerExist = await this.customersRepository.findById(
            customer_id,
        );

        if (!checkCustomerExist) {
            throw new AppError('Customer not Exist');
        }

        const checkProductsExist = await this.productsRepository.findAllById(
            products,
        );

        if (!checkProductsExist.length) {
            throw new AppError('Products not Exist');
        }

        const checkProductsIdsExist = checkProductsExist.map(
            product => product.id,
        );

        const checkProductsIdsInexistent = products.filter(
            product => !checkProductsIdsExist.includes(product.id),
        );

        if (checkProductsIdsInexistent.length) {
            throw new AppError('Products Ids not Exist');
        }

        const findProductsInvalid = products.filter(
            product =>
                checkProductsExist.filter(item => item.id === product.id)[0]
                    .quantity < product.quantity,
        );

        if (findProductsInvalid.length) {
            throw new AppError('Products Ids not Exist');
        }

        const allProducts = products.map(product => ({
            product_id: product.id,
            quantity: product.quantity,
            price: checkProductsExist.filter(item => item.id === product.id)[0]
                .price,
        }));

        const order = await this.ordersRepository.create({
            customer: checkCustomerExist,
            products: allProducts,
        });

        const oderprodutsquantity = products.map(product => ({
            id: product.id,
            quantity:
                checkProductsExist.filter(item => item.id === product.id)[0]
                    .quantity - product.quantity,
        }));

        await this.productsRepository.updateQuantity(oderprodutsquantity);

        return order;
    }
}

export default CreateOrderService;
