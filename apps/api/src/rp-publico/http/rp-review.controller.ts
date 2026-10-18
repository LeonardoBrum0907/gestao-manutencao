import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { RpReviews } from "../application/rp-reviews";

// Lado do coordenador (com login) para os RPs da página pública.
@Controller("api")
export class RpReviewController {
  constructor(private readonly reviews: RpReviews) {}

  @Post("rp/:id/checked")
  setChecked(@Param("id") id: string, @Body() body: unknown) {
    return this.reviews.setChecked(id, body);
  }

  @Get("rp/:id/revisions")
  revisions(@Param("id") id: string) {
    return this.reviews.list(id);
  }

  @Post("rp/:id/revisions/:revisionId/restore")
  restore(@Param("id") id: string, @Param("revisionId") revisionId: string) {
    return this.reviews.restore(id, revisionId);
  }

  @Patch("members/:id/public-rp")
  setMemberPublicRp(@Param("id") id: string, @Body() body: unknown) {
    return this.reviews.setMemberPublicRp(id, body);
  }
}
