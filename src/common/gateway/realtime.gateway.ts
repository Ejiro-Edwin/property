import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: unknown, @ConnectedSocket() client: Socket) {
    client.emit('pong', { ok: true, received: data });
    return { ok: true, received: data };
  }

  emitNotification(payload: Record<string, unknown>) {
    this.server?.emit('notification', payload);
  }

  emitPaymentUpdate(payload: Record<string, unknown>) {
    this.server?.emit('payment:update', payload);
  }
}
