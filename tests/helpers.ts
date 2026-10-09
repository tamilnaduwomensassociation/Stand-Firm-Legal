/** Shared fixtures for the membership tests. */
export const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export const jpegUrl = (extra = 32) =>
  "data:image/jpeg;base64," + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(extra, 1)]).toString("base64");

export const pdfUrl = () =>
  "data:application/pdf;base64," + Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\n").toString("base64");

/** A request body that passes validation; override fields per test. */
export const goodRequest = (over: Record<string, unknown> = {}) => ({
  fullName: "Meenakshi Sundaram",
  membershipNo: "101",
  email: "meena@example.com",
  mobile: "9876543210",
  category: "advocate",
  ...over,
});
