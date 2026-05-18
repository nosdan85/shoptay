import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface StockUpdate {
  productId: string;
  stock: number;
  productName?: string;
}

interface OrderUpdate {
  orderId: string;
  orderNumber: string;
  userId: string;
  status: string;
}

interface NewPurchase {
  discordUsername: string;
  productName: string;
  totalAmount: number;
  orderNumber: string;
}

interface UserNotification {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedClients: Map<string, { socketId: string; userId?: string; rooms: string[] }> = new Map();

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized with /realtime namespace');
    
    setInterval(() => {
      server.emit('ping', { timestamp: Date.now() });
    }, 30000);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || 
                   client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        try {
          const payload = this.jwtService.verify(token, {
            secret: this.configService.get<string>('app.jwt.secret'),
          });
          
          client.data.userId = payload.sub;
          client.data.username = payload.username;
          
          this.logger.log(`Client connected: ${client.id} (user: ${payload.username})`);
          
          client.join(`user:${payload.sub}`);
          
          this.connectedClients.set(client.id, {
            socketId: client.id,
            userId: payload.sub,
            rooms: [`user:${payload.sub}`],
          });
        } catch {
          this.logger.warn(`JWT verification failed for client ${client.id}`);
          this.connectedClients.set(client.id, {
            socketId: client.id,
            rooms: [],
          });
        }
      } else {
        this.logger.log(`Client connected: ${client.id} (anonymous)`);
        this.connectedClients.set(client.id, {
          socketId: client.id,
          rooms: [],
        });
      }

      client.emit('connected', {
        socketId: client.id,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      this.connectedClients.set(client.id, {
        socketId: client.id,
        rooms: [],
      });
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  // === Stock Updates ===

  @SubscribeMessage('subscribe:product')
  handleSubscribeProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody() productId: string,
  ) {
    client.join(`product:${productId}`);
    this.logger.debug(`Client ${client.id} subscribed to product:${productId}`);
    return { event: 'product:subscribed', data: { productId } };
  }

  @SubscribeMessage('unsubscribe:product')
  handleUnsubscribeProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody() productId: string,
  ) {
    client.leave(`product:${productId}`);
    return { event: 'product:unsubscribed', data: { productId } };
  }

  @SubscribeMessage('subscribe:products')
  handleSubscribeAllProducts(@ConnectedSocket() client: Socket) {
    client.join('products:all');
    this.logger.debug(`Client ${client.id} subscribed to all products`);
    return { event: 'products:subscribed', data: { all: true } };
  }

  @SubscribeMessage('unsubscribe:products')
  handleUnsubscribeAllProducts(@ConnectedSocket() client: Socket) {
    client.leave('products:all');
    return { event: 'products:unsubscribed', data: { all: true } };
  }

  // === Order Updates ===

  @SubscribeMessage('subscribe:orders')
  handleSubscribeOrders(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    if (client.data.userId && client.data.userId !== userId) {
      return { event: 'error', data: { message: 'Cannot subscribe to other users orders' } };
    }
    
    client.join(`orders:${userId}`);
    this.logger.debug(`Client ${client.id} subscribed to orders:${userId}`);
    return { event: 'orders:subscribed', data: { userId } };
  }

  @SubscribeMessage('unsubscribe:orders')
  handleUnsubscribeOrders(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    client.leave(`orders:${userId}`);
    return { event: 'orders:unsubscribed', data: { userId } };
  }

  // === Notifications ===

  @SubscribeMessage('subscribe:notifications')
  handleSubscribeNotifications(@ConnectedSocket() client: Socket) {
    if (client.data.userId) {
      client.join(`notifications:${client.data.userId}`);
      return { event: 'notifications:subscribed', data: { userId: client.data.userId } };
    }
    return { event: 'error', data: { message: 'Authentication required' } };
  }

  @SubscribeMessage('notifications:mark-read')
  handleMarkNotificationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationIds: string[] },
  ) {
    if (!client.data.userId) {
      return { event: 'error', data: { message: 'Authentication required' } };
    }
    
    this.realtimeService.markNotificationsRead(client.data.userId, data.notificationIds);
    return { event: 'notifications:marked', data: { count: data.notificationIds.length } };
  }

  // === Purchase Ticker ===

  @SubscribeMessage('subscribe:purchases')
  handleSubscribePurchases(@ConnectedSocket() client: Socket) {
    client.join('purchases:all');
    this.logger.debug(`Client ${client.id} subscribed to all purchases`);
    return { event: 'purchases:subscribed', data: { all: true } };
  }

  @SubscribeMessage('unsubscribe:purchases')
  handleUnsubscribePurchases(@ConnectedSocket() client: Socket) {
    client.leave('purchases:all');
    return { event: 'purchases:unsubscribed', data: { all: true } };
  }

  // === Ping/Pong ===

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  // === Broadcast Methods (for internal use) ===

  /**
   * Emit stock update to subscribers
   */
  emitStockUpdate(data: StockUpdate) {
    this.server.to(`product:${data.productId}`).emit('stock:update', {
      productId: data.productId,
      stock: data.stock,
      productName: data.productName,
      timestamp: Date.now(),
    });
    
    this.server.to('products:all').emit('stock:update', {
      productId: data.productId,
      stock: data.stock,
      productName: data.productName,
      timestamp: Date.now(),
    });
  }

  /**
   * Emit order update to specific user
   */
  emitOrderUpdate(userId: string, order: OrderUpdate) {
    this.server.to(`orders:${userId}`).emit('order:update', {
      ...order,
      timestamp: Date.now(),
    });
    
    this.server.to(`notifications:${userId}`).emit('notification', {
      userId,
      title: 'Order Update',
      message: `Order ${order.orderNumber} status: ${order.status}`,
      type: 'info',
      timestamp: Date.now(),
    });
  }

  /**
   * Emit notification to specific user
   */
  emitNotification(userId: string, notification: UserNotification) {
    this.server.to(`notifications:${userId}`).emit('notification', {
      ...notification,
      userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Emit new purchase to all subscribers (for ticker)
   */
  emitNewPurchase(data: NewPurchase) {
    this.server.to('purchases:all').emit('purchase:new', {
      discordUsername: data.discordUsername,
      productName: data.productName,
      totalAmount: data.totalAmount,
      orderNumber: data.orderNumber,
      timestamp: Date.now(),
    });
  }

  /**
   * Emit stock updates to all clients
   */
  emitStockUpdateBroadcast(data: StockUpdate) {
    this.server.emit('stock:update', {
      productId: data.productId,
      stock: data.stock,
      productName: data.productName,
      timestamp: Date.now(),
    });
  }

  /**
   * Emit to admin room
   */
  emitToAdmins(event: string, data: any) {
    this.server.to('admin').emit(event, {
      ...data,
      timestamp: Date.now(),
    });
  }

  /**
   * Emit to specific product room
   */
  emitToProduct(productId: string, event: string, data: any) {
    this.server.to(`product:${productId}`).emit(event, {
      ...data,
      timestamp: Date.now(),
    });
  }

  /**
   * Join admin room
   */
  @SubscribeMessage('admin:join')
  handleAdminJoin(@ConnectedSocket() client: Socket) {
    client.join('admin');
    this.logger.log(`Client ${client.id} joined admin room`);
    return { event: 'admin:joined', data: { success: true } };
  }

  /**
   * Leave admin room
   */
  @SubscribeMessage('admin:leave')
  handleAdminLeave(@ConnectedSocket() client: Socket) {
    client.leave('admin');
    return { event: 'admin:left', data: { success: true } };
  }

  // === Connection Stats ===

  getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      authenticatedUsers: Array.from(this.connectedClients.values()).filter(c => c.userId).length,
      anonymousConnections: Array.from(this.connectedClients.values()).filter(c => !c.userId).length,
    };
  }
}
