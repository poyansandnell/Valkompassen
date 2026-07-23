import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, municipalitiesTable, regionsTable } from "@workspace/db";
import {
  ListMunicipalitiesResponse,
  ListRegionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/municipalities", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: municipalitiesTable.id,
      name: municipalitiesTable.name,
      slug: municipalitiesTable.slug,
      regionId: municipalitiesTable.regionId,
      regionName: regionsTable.name,
    })
    .from(municipalitiesTable)
    .innerJoin(regionsTable, eq(municipalitiesTable.regionId, regionsTable.id));
  rows.sort((a, b) => a.name.localeCompare(b.name, "sv"));
  res.json(ListMunicipalitiesResponse.parse(rows));
});

router.get("/regions", async (_req, res): Promise<void> => {
  const rows = await db.select().from(regionsTable);
  rows.sort((a, b) => a.name.localeCompare(b.name, "sv"));
  res.json(ListRegionsResponse.parse(rows));
});

export default router;
