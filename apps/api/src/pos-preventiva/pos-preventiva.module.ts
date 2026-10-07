import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { PostPreventives } from "./application/post-preventives";
import { PostPreventiveController } from "./http/post-preventive.controller";
import { PostPreventiveRepository } from "./infra/post-preventive.repository";

@Module({
  imports: [CadastroModule],
  controllers: [PostPreventiveController],
  providers: [PostPreventiveRepository, PostPreventives],
})
export class PosPreventivaModule {}
