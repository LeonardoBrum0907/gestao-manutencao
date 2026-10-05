import { Injectable } from "@nestjs/common";
import type { MatrixSettingsDto } from "@manutencao/shared";
import { readObject } from "../../kernel/parse";
import { requirePerformanceTarget, requireQualifiedAdherence } from "../domain/catalog";
import { SettingsRepository } from "../infra/settings.repository";

@Injectable()
export class MatrixSettings {
  constructor(private readonly settings: SettingsRepository) {}

  show(): Promise<MatrixSettingsDto> {
    return this.settings.load();
  }

  // Cada card de Configurações grava o seu campo: o que não vier no corpo continua como está.
  async update(body: unknown): Promise<MatrixSettingsDto> {
    const input = readObject(body);
    const current = await this.settings.load();
    return this.settings.save({
      qualifiedAdherence:
        input.qualifiedAdherence === undefined ? current.qualifiedAdherence : requireQualifiedAdherence(input.qualifiedAdherence),
      performanceTarget:
        input.performanceTarget === undefined ? current.performanceTarget : requirePerformanceTarget(input.performanceTarget),
    });
  }
}
