import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><body></body>", { pretendToBeVisual: true, url: "http://localhost/" });
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document,
  HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, Event: dom.window.Event,
  MouseEvent: dom.window.MouseEvent, KeyboardEvent: dom.window.KeyboardEvent,
  getComputedStyle: dom.window.getComputedStyle, IS_REACT_ACT_ENVIRONMENT: true,
});

// jsdom has no PointerEvent; add the one field the component reads.
class PointerEventShim extends dom.window.MouseEvent {
  pointerType: string;
  constructor(type: string, init: Record<string, unknown> = {}) {
    super(type, init);
    this.pointerType = (init.pointerType as string) ?? "";
  }
}
(dom.window as unknown as Record<string, unknown>).PointerEvent = PointerEventShim;
(globalThis as unknown as Record<string, unknown>).PointerEvent = PointerEventShim;
