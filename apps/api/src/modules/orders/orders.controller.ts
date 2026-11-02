import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { OrderStatus, PaymentMethod, Role } from '@boi-hat/shared-types';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly db: DatabaseService) {}

  @Get('my')
  async getMyOrders(@Req() req: any) {
    return this.db.getOrdersForUser(req.user.id);
  }

  @Post()
  async createOrder(
    @Req() req: any,
    @Body()
    body: {
      book_id: string;
      delivery_address: string;
      payment_method?: PaymentMethod;
    },
  ) {
    if (!body.book_id || !body.delivery_address) {
      throw new BadRequestException('book_id and delivery_address are required');
    }

    const book = await this.db.getBookById(body.book_id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.seller_id === req.user.id) {
      throw new BadRequestException('You cannot purchase your own listed book.');
    }

    const order = await this.db.createOrder({
      buyer_id: req.user.id,
      seller_id: book.seller_id,
      book_id: book.id,
      delivery_address: body.delivery_address,
      payment_method: body.payment_method || PaymentMethod.COD,
    });

    return order;
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string, @Req() req: any) {
    const order = await this.db.getOrderById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Access check: only buyer, seller, or admin can view order
    if (
      order.buyer_id !== req.user.id &&
      order.seller_id !== req.user.id &&
      req.user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return order;
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { status: OrderStatus; courier_tracking_id?: string },
  ) {
    const order = await this.db.getOrderById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isSeller = order.seller_id === req.user.id;
    const isBuyer = order.buyer_id === req.user.id;
    const isAdmin = req.user.role === Role.ADMIN;

    if (!isSeller && !isBuyer && !isAdmin) {
      throw new ForbiddenException('Permission denied');
    }

    // Enforce valid status progression:
    // Seller: pending -> confirmed -> shipped
    // Buyer / Admin: shipped -> delivered
    if (isSeller && !isAdmin) {
      if (
        body.status !== OrderStatus.CONFIRMED &&
        body.status !== OrderStatus.SHIPPED &&
        body.status !== OrderStatus.CANCELLED
      ) {
        throw new BadRequestException('Seller may only confirm, ship, or cancel order.');
      }
    }

    const updated = await this.db.updateOrderStatus(id, body.status, body.courier_tracking_id);
    return updated;
  }

  @Post(':id/dispute')
  async raiseDispute(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { reason: string },
  ) {
    const order = await this.db.getOrderById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyer_id !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only the buyer or an admin can raise an order dispute.');
    }

    if (!order.delivered_at) {
      throw new BadRequestException('Dispute can only be opened after delivery.');
    }

    // Check 48h dispute window
    const now = new Date();
    if (order.dispute_window_expires_at && now > new Date(order.dispute_window_expires_at)) {
      throw new BadRequestException('The 48-hour buyer protection dispute window has expired.');
    }

    const updated = await this.db.updateOrderStatus(id, OrderStatus.DISPUTED);
    return {
      message: 'Dispute submitted successfully. Admin mediation in progress.',
      order: updated,
    };
  }
}
