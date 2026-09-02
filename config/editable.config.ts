/**
 * ============================================================
 * WHAT SUPERADMIN IS ALLOWED TO EDIT
 * ============================================================
 * The list of overridable fields, per brand.
 *
 * WHY A LIST AND NOT "EVERYTHING"
 *
 * A content editor that can rewrite any field is a content editor that
 * can break the site at 11pm. These are the pieces that genuinely
 * change — a phone number, a headline, an office hour, a notice —
 * chosen because getting one wrong is embarrassing rather than fatal.
 * Structure, routes, prices and legal text are not here: prices belong
 * in the catalogue where the server can see them, and the disclaimers
 * exist for reasons an admin should not be able to click away.
 *
 * Each entry names a key. A page reads its config default, fetches
 * /api/content?brand=…, and prefers the override when one exists —
 * so an empty store leaves the site exactly as it shipped.
 */

export type EditableField = {
  key: string;
  label: string;
  hint?: string;
  type?: "text" | "textarea";
};

export type EditableGroup = { group: string; fields: EditableField[] };

export const editable: Record<string, EditableGroup[]> = {
  "tnwla": [
    {
      group: "Contact",
      fields: [
        { key: "phone1", label: "Primary phone" },
        { key: "phone2", label: "Second phone" },
        { key: "landline", label: "Landline" },
        { key: "email", label: "Email" },
        { key: "address", label: "Address", type: "textarea" },
      ],
    },
    {
      group: "Homepage",
      fields: [
        { key: "heroTagline", label: "Hero tagline", hint: "The line under the association's name" },
        { key: "noticeBanner", label: "Notice banner", hint: "Leave empty to hide it", type: "textarea" },
      ],
    },
  ],

  "stand-firm": [
    {
      group: "Contact",
      fields: [
        { key: "phone1", label: "Primary phone" },
        { key: "phone2", label: "Second phone" },
        { key: "landline", label: "Landline" },
        { key: "whatsapp", label: "WhatsApp number", hint: "Digits only with country code, e.g. 919962502244" },
        { key: "email", label: "Email" },
        { key: "address", label: "Address", type: "textarea" },
      ],
    },
    {
      group: "The firm",
      fields: [
        { key: "tagline", label: "Tagline" },
        { key: "motto", label: "Motto" },
        { key: "hoursWeekday", label: "Weekday hours" },
        { key: "hoursSunday", label: "Sunday hours" },
      ],
    },
    {
      group: "Services page",
      fields: [
        { key: "servicesNotice", label: "Notice under the service grid", type: "textarea" },
      ],
    },
  ],

  "jeni": [
    {
      group: "Contact",
      fields: [
        { key: "phone1", label: "Primary phone" },
        { key: "whatsapp", label: "WhatsApp number", hint: "Digits only with country code" },
        { key: "email", label: "Email" },
        { key: "address", label: "Address", type: "textarea" },
      ],
    },
    {
      group: "Shop",
      fields: [
        { key: "shopNotice", label: "Notice under the product grid", type: "textarea" },
        { key: "deliveryNote", label: "Delivery and despatch note", type: "textarea" },
        { key: "announcement", label: "Announcement banner", hint: "Leave empty to hide it" },
      ],
    },
  ],

  "harmonic": [
    {
      group: "Contact",
      fields: [
        { key: "phone1", label: "Primary phone" },
        { key: "whatsapp", label: "WhatsApp number", hint: "Digits only with country code" },
        { key: "email", label: "Email" },
        { key: "address", label: "Address", type: "textarea" },
      ],
    },
    {
      group: "Classes",
      fields: [
        { key: "nextBatch", label: "Next batch dates", hint: "Shown at the top of the classes page" },
        { key: "meditationTime", label: "Weekly meditation — day and time" },
        { key: "venue", label: "Class venue", type: "textarea" },
      ],
    },
  ],
};

export const groupsFor = (brand: string): EditableGroup[] => editable[brand] ?? [];
