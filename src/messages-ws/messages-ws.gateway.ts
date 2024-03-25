import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dto/new-message.dto';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() wss: Server;

  constructor(private readonly messagesWsService: MessagesWsService) {}

  handleConnection(client: Socket) {
    //console.log(`Client conected, ${client.id}`)

    this.messagesWsService.registerClient( client );

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients())

    // console.log({ conectados: this.messagesWsService.getConnectedClients() });

  }

  handleDisconnect(client: Socket) {
   // console.log(`Client disconected, ${client.id}`)

   this.messagesWsService.removeClient( client.id );
   
   this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients())

   //console.log({ conectados: this.messagesWsService.getConnectedClients() });
   
  }

  @SubscribeMessage('message-from-client')
  onMessageFromClient( client: Socket, payload: NewMessageDto ) {

    // console.log(client.id, payload);

    // Emite unicamente al cliente
/*     client.emit('message-from-server', {
      fullName: 'Soy Yo!!',
      message: payload.message || 'no-message'
    }) */
    
    // Emitir a todos MENOS al cliente inicial
/*     client.broadcast.emit('message-from-server', {
      fullName: 'Soy Yo!!',
      message: payload.message || 'no-message'
    }) */

    // Emitir a todos
    this.wss.emit('message-from-server', {
      fullName: 'Soy Yo!!',
      message: payload.message || 'no-message'
    })

  }

}
