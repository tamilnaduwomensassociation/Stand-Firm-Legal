/**
 * Flip-card behaviour (Donate & Serve) in jsdom: tap, hover, keyboard,
 * Escape, and which face is inert. jsdom has no layout or CSS transitions,
 * so the 560 ms turn and the picture crops are NOT tested here.
 */
import "./setup";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import "./dom-setup";
import { render, fireEvent, cleanup } from "@testing-library/react";
import ServeGallery from "../components/harmonic/ServeGallery";

const cards = [
  { id: "a", title: "Food & Meal Distribution", front: "front a", back: "back a", image: "/a.jpg", alt: "alt a", pos: "50% 50%", w: 10, h: 10 },
  { id: "b", title: "Tree Planting", front: "front b", back: "back b", image: "/b.jpg", alt: "alt b", pos: "50% 50%", w: 10, h: 10 },
];
const show = () => render(<ServeGallery cards={cards} wa="https://wa.me/1?text=x" tel="tel:+911" phone="99999" />);
afterEach(cleanup);

describe("ServeGallery flip cards", () => {
  it("renders one card per entry with alt text, lazy images and the contact links", () => {
    const { container } = show();
    assert.equal(container.querySelectorAll(".flip-card").length, 2);
    const img = container.querySelector("img")!;
    assert.equal(img.getAttribute("alt"), "alt a");
    assert.equal(img.getAttribute("loading"), "lazy");
    assert.equal(container.querySelectorAll('a[href="https://wa.me/1?text=x"]').length, 2);
    assert.equal(container.querySelectorAll('a[href="tel:+911"]').length, 2);
  });

  it("starts on the front: back face inert, front not", () => {
    const { container } = show();
    const card = container.querySelector(".flip-card")!;
    assert.equal(card.getAttribute("data-flipped"), "false");
    assert.ok(card.querySelector(".flip-face-back")!.hasAttribute("inert"));
    assert.ok(!card.querySelector(".flip-face-front")!.hasAttribute("inert"));
  });

  it("click flips one card; the back button returns it", () => {
    const { container } = show();
    const els = container.querySelectorAll(".flip-card");
    fireEvent.click(els[0].querySelector(".flip-face-front button")!);
    assert.equal(els[0].getAttribute("data-flipped"), "true");
    assert.equal(els[1].getAttribute("data-flipped"), "false");
    assert.ok(els[0].querySelector(".flip-face-front")!.hasAttribute("inert"));
    assert.ok(!els[0].querySelector(".flip-face-back")!.hasAttribute("inert"));
    fireEvent.click(els[0].querySelector(".flip-face-back button")!);
    assert.equal(els[0].getAttribute("data-flipped"), "false");
  });

  it("mouse hover flips and un-flips; touch hover does not", () => {
    const { container } = show();
    const card = container.querySelector(".flip-card")!;
    fireEvent.pointerEnter(card, { pointerType: "mouse" });
    assert.equal(card.getAttribute("data-flipped"), "true");
    fireEvent.pointerLeave(card, { pointerType: "mouse" });
    assert.equal(card.getAttribute("data-flipped"), "false");
    fireEvent.pointerEnter(card, { pointerType: "touch" });
    assert.equal(card.getAttribute("data-flipped"), "false");
  });

  it("Escape turns a flipped card back", () => {
    const { container } = show();
    const card = container.querySelector(".flip-card")!;
    fireEvent.click(card.querySelector(".flip-face-front button")!);
    fireEvent.keyDown(card.querySelector(".flip-face-back a")!, { key: "Escape" });
    assert.equal(card.getAttribute("data-flipped"), "false");
  });
});
