/**
 * EVERY LINE SUPERADMIN CAN PRICE, in one flat list per brand.
 *
 * The catalogues are shaped for the pages that render them — foods nest
 * under brands, shop items under sections, Harmony splits dhoobam from
 * courses. A pricing screen wants none of that: it wants one list it can
 * search, grouped only so a human can find a row.
 *
 * Deriving this list rather than maintaining a second copy is the whole
 * point. Add a product to any catalogue and it appears here, in the
 * panel, and in the server price book, with no third edit to forget.
 */
import { allFoodItems, foodBrands } from "@/config/foods.config";
import { shopCatalogue, shopSections } from "@/config/shop.config";
import { courses, dhoobamCatalogue, dhoobamGroups } from "@/config/harmonic.config";
import type { BrandId } from "@/config/brands.config";

export type Priceable = {
  id: string;
  en: string;
  /** Pack, lot or duration — whatever the price is *for* */
  unit: string;
  /** Heading this row sits under in the panel */
  group: string;
  price: number;
  mrp?: number;
  /** Courses are registrations, not despatched goods */
  kind: "product" | "course";
};

const foodGroupOf = (id: string) =>
  foodBrands.find((b) => b.items.some((i) => i.id === id))?.en ?? "Foods";

const shopGroupOf = (sectionId: string) =>
  shopSections.find((s) => s.id === sectionId)?.en ?? "Shop";

const dhoobamGroupOf = (g: string) =>
  dhoobamGroups.find((d) => d.id === g)?.en ?? "Dhoobam";

export const priceableByBrand: Record<string, Priceable[]> = {
  jeni: [
    ...allFoodItems.map((i) => ({
      id: i.id, en: i.en, unit: i.pack, group: `Foods · ${foodGroupOf(i.id)}`,
      price: i.price, mrp: i.mrp, kind: "product" as const,
    })),
    ...shopCatalogue.map((i) => ({
      id: i.id, en: i.en, unit: i.moq ? `${i.pack} · MOQ ${i.moq}` : i.pack,
      group: `${shopGroupOf(i.section)} · ${i.group}`,
      price: i.price, mrp: i.mrp, kind: "product" as const,
    })),
  ],
  harmonic: [
    ...dhoobamCatalogue.map((i) => ({
      id: i.id, en: i.en, unit: i.pack, group: `Dhoobam · ${dhoobamGroupOf(i.group)}`,
      price: i.price, mrp: i.mrp, kind: "product" as const,
    })),
    ...courses.map((c) => ({
      id: c.id, en: c.en, unit: `${c.level} · ${c.duration}`, group: "Classes",
      price: c.fee, mrp: undefined, kind: "course" as const,
    })),
  ],
};

export const hasPricing = (brand: BrandId) => (priceableByBrand[brand]?.length ?? 0) > 0;
