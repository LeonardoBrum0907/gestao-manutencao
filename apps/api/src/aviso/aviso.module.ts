import { Module } from "@nestjs/common";
import { PushDevices } from "./application/push-devices";
import { PUSH_DEVICES, PUSH_SENDER } from "./application/push-ports";
import { PushController } from "./http/push.controller";
import { PushDeviceRepository } from "./infra/push-device.repository";
import { WebPushSender } from "./infra/web-push.sender";

// Avisos no celular (Web Push): aparelhos inscritos e o envio. Lembretes, resumo e alertas usam o PushDevices.
@Module({
  controllers: [PushController],
  providers: [
    { provide: PUSH_DEVICES, useClass: PushDeviceRepository },
    { provide: PUSH_SENDER, useClass: WebPushSender },
    PushDevices,
  ],
  exports: [PushDevices],
})
export class AvisoModule {}
