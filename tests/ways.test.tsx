/**
 * "Ways You Can Support" boxes: words on the front, picture on the back.
 * jsdom has no layout, so the 3D turn itself and the crops are not tested.
 */
import "./setup";
import "./dom-setup";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { render, fireEvent, cleanup } from "@testing-library/react";
import WaysFlip from "../components/harmonic/WaysFlip";

const ways = [
  { id: "a", n: "01", emoji: "🍚", title: "Food for the Hungry", text: "Providing rice boxes.", image: "/a.jpg", pos: "50% 50%", w: 10, h: 10 },
  { id: "b", n: "02", emoji: "👕", title: "Clothing Support", text: "Providing new clothes.", image: "/b.jpg", pos: "50% 50%", w: 10, h: 10 },
];
const show = () => render(<WaysFlip ways={ways} wa="https://wa.me/1?text=x" tel="tel:+911" phone="99999" />);
afterEach(cleanup);

describe("WaysFlip", () => {
  it("front carries the words, back carries the picture and the contact actions", () => {
    const { container } = show();
    const card = container.querySelector(".flip-card")!;
    assert.match(card.querySelector(".flip-face-front")!.textContent!, /Food for the Hungry.*Providing rice boxes\./);
    assert.equal(card.querySelector(".flip-face-back img")!.getAttribute("src"), "/a.jpg");
    assert.equal(card.querySelector(".flip-face-back img")!.getAttribute("alt"), "", "decorative picture");
    assert.equal(card.querySelectorAll('.flip-face-back a[href="https://wa.me/1?text=x"]').length, 1);
    assert.match(card.querySelector(".flip-face-back")!.textContent!, /Support This Cause/);
  });
  it("click flips, Flip back returns; hidden face is inert; other box untouched", () => {
    const { container } = show();
    const els = container.querySelectorAll(".flip-card");
    assert.ok(els[0].querySelector(".flip-face-back")!.hasAttribute("inert"));
    fireEvent.click(els[0].querySelector(".flip-face-front button")!);
    assert.equal(els[0].getAttribute("data-flipped"), "true");
    assert.equal(els[1].getAttribute("data-flipped"), "false");
    assert.ok(els[0].querySelector(".flip-face-front")!.hasAttribute("inert"));
    fireEvent.click(els[0].querySelector(".flip-face-back button")!);
    assert.equal(els[0].getAttribute("data-flipped"), "false");
  });
  it("mouse hover flips; touch hover does not; Escape returns", () => {
    const { container } = show();
    const card = container.querySelector(".flip-card")!;
    fireEvent.pointerEnter(card, { pointerType: "mouse" });
    assert.equal(card.getAttribute("data-flipped"), "true");
    fireEvent.pointerLeave(card, { pointerType: "mouse" });
    fireEvent.pointerEnter(card, { pointerType: "touch" });
    assert.equal(card.getAttribute("data-flipped"), "false");
    fireEvent.click(card.querySelector(".flip-face-front button")!);
    fireEvent.keyDown(card.querySelector(".flip-face-back a")!, { key: "Escape" });
    assert.equal(card.getAttribute("data-flipped"), "false");
  });
});
