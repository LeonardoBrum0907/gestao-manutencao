import { Injectable } from "@nestjs/common";
import type { MatrixSettingsDto } from "@manutencao/shared";
import { readObject } from "../../kernel/parse";
import { requireQualifiedAdherence } from "../domain/catalog";
import { SettingsRepository } from "../infra/settings.repository";

@Injectable()
export class MatrixSettings {
  constructor(private readonly settings: SettingsRepository) {}

  show(): Promise<MatrixSettingsDto> {
    return this.settings.load();
  }

  update(body: unknown): Promise<MatrixSettingsDto> {
    return this.settings.save({ qualifiedAdherence: requireQualifiedAdherence(readObject(body).qualifiedAdherence) });
  }
}
