import { Module } from "@nestjs/common";
import { Rps } from "../rp/application/rps";
import { RpModule } from "../rp/rp.module";
import {
  PUBLIC_CLOCK,
  PUBLIC_DIRECTORY_STORE,
  PUBLIC_LINK_STORE,
  PUBLIC_WRITE_LIMITER,
  RP_BOOK,
  RP_REVISION_STORE,
  SUPERVISOR_LINK_STORE,
} from "./application/ports";
import { PublicLinks } from "./application/public-links";
import { PublicRps } from "./application/public-rps";
import { RpReviews } from "./application/rp-reviews";
import { SupervisorLinks } from "./application/supervisor-links";
import { PUBLIC_WRITE_RULES, PublicWriteLimiter } from "./domain/write-limiter";
import { PublicRpController } from "./http/public-rp.controller";
import { RpPublicLinkController } from "./http/rp-public-link.controller";
import { RpReviewController } from "./http/rp-review.controller";
import { RpSupervisorLinkController } from "./http/rp-supervisor-link.controller";
import { PublicDirectoryRepository } from "./infra/public-directory.repository";
import { PublicLinkRepository } from "./infra/public-link.repository";
import { RpRevisionRepository } from "./infra/rp-revision.repository";
import { SupervisorLinkRepository } from "./infra/supervisor-link.repository";

// Página pública de RPs (sem login) e o que o coordenador faz com os RPs que chegam por ela.
@Module({
  imports: [RpModule],
  controllers: [PublicRpController, RpPublicLinkController, RpReviewController, RpSupervisorLinkController],
  providers: [
    PublicLinks,
    PublicRps,
    RpReviews,
    SupervisorLinks,
    { provide: RP_BOOK, useExisting: Rps },
    { provide: PUBLIC_LINK_STORE, useClass: PublicLinkRepository },
    { provide: SUPERVISOR_LINK_STORE, useClass: SupervisorLinkRepository },
    { provide: RP_REVISION_STORE, useClass: RpRevisionRepository },
    { provide: PUBLIC_DIRECTORY_STORE, useClass: PublicDirectoryRepository },
    { provide: PUBLIC_WRITE_LIMITER, useFactory: () => new PublicWriteLimiter(PUBLIC_WRITE_RULES) },
    { provide: PUBLIC_CLOCK, useValue: () => new Date() },
  ],
})
export class RpPublicoModule {}
