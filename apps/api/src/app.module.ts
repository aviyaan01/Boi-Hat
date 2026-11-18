import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BooksModule } from './modules/books/books.module';
import { MessagesModule } from './modules/messages/messages.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdsModule } from './modules/ads/ads.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { CouriersModule } from './modules/couriers/couriers.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { HealthModule } from './modules/health/health.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    HealthModule,
    StorageModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    BooksModule,
    MessagesModule,
    OrdersModule,
    AdminModule,
    WishlistModule,
    RecommendationsModule,
    PaymentsModule,
    AdsModule,
    WalletModule,
    ReviewsModule,
    CouriersModule,
    MerchantsModule,
  ],
})
export class AppModule {}


