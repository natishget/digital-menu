import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`🔌 WebSocket Client Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 WebSocket Client Disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:order')
  handleJoinOrder(@MessageBody() data: { orderId: string }, @ConnectedSocket() client: Socket) {
    if (data && data.orderId) {
      client.join(`order_${data.orderId}`);
      console.log(`Socket ${client.id} joined room order_${data.orderId}`);
    }
  }

  @SubscribeMessage('join:station')
  handleJoinStation(@MessageBody() data: { station: string }, @ConnectedSocket() client: Socket) {
    if (data && data.station) {
      client.join(`station_${data.station}`);
      console.log(`Socket ${client.id} joined room station_${data.station}`);
    }
  }

  @SubscribeMessage('join:cashier')
  handleJoinCashier(@ConnectedSocket() client: Socket) {
    client.join('cashier_room');
    console.log(`Socket ${client.id} joined room cashier_room`);
  }

  // Helper broadcast methods
  emitOrderCreated(order: any) {
    this.server.emit('order:created', order);
    this.server.to('cashier_room').emit('cashier:new_order', order);
  }

  emitOrderStatusChanged(orderId: string, status: string, orderData?: any) {
    this.server.to(`order_${orderId}`).emit('order:status_updated', { orderId, status, order: orderData });
    this.server.emit('order:status_updated_global', { orderId, status });
  }

  emitKotTicketUpdated(ticket: any) {
    this.server.to(`station_${ticket.station}`).emit('kot:ticket_updated', ticket);
    this.server.emit('kot:ticket_updated_global', ticket);
  }
}
