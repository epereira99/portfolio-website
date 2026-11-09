import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { STORIES } from "@/content/stories";
import { setScreens } from "@/journey/progress";
import { JourneyOverlay } from "./JourneyOverlay";

beforeEach(() => window.history.replaceState(null, "", "/"));
afterEach(() => act(() => setScreens(0)));

const at = (s: number) => {
  render(<JourneyOverlay />);
  act(() => setScreens(s));
};

test("he introduces himself, with a prompt to scroll that goes once you do", () => {
  at(0);
  expect(screen.getByRole("heading", { level: 1, name: /^Eduardo Pereira/ })).toBeInTheDocument();
  expect(screen.getByText("Scroll to walk")).toBeInTheDocument();
  act(() => setScreens(0.1));
  expect(screen.queryByText("Scroll to walk")).toBeNull();
});

test("he says hello on the home screen, one line at a time as you start scrolling", () => {
  at(0);
  expect(screen.getAllByTestId("bubble").map((b) => b.textContent)).toEqual(["Hey, great to see you here."]);
  act(() => setScreens(0.3));
  expect(screen.getAllByTestId("bubble")).toHaveLength(3);
  expect(screen.getAllByTestId("bubble")[2]).toHaveTextContent(/^I'm a yapper/);
});

test("shows the current project with a Read more that opens it", () => {
  at(2);
  expect(screen.getByRole("heading", { name: "Mambu migration tool" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /read more/i }));
  expect(window.location.search).toBe("?project=mambu-migration");
});

test("the BSc chapter wears the University of Minho logo in its top corner; Porto's has none", () => {
  at(1.0);
  const logo = screen.getByRole("img", { name: "University of Minho" });
  expect(logo).toHaveAttribute("src", "/uminho-mark.png");
  expect(logo.closest("div")).toContainElement(screen.getByRole("heading", { level: 2, name: "BSc Computer Science" }));
  act(() => setScreens(1.6));
  expect(screen.queryByRole("img", { name: "University of Minho" })).toBeNull();
});

test("announces the stage with a chapter title as you enter Porto", () => {
  at(1.6);
  expect(screen.queryByText(/Chapter \d/)).toBeNull();
  expect(screen.getByRole("heading", { level: 2, name: "Deloitte" })).toBeInTheDocument();
  expect(screen.getByText("Cloud & DevOps → Integration Software · 2022–2024")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /read more/i })).toBeNull();
});

test("the chapter stays while the projects its story mentions come and go under it", () => {
  at(2.0);
  expect(screen.getByRole("heading", { level: 2, name: "Deloitte" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Mambu migration tool" })).toBeInTheDocument();
  expect(screen.queryByText("Porto · Deloitte")).toBeNull(); // the box is just its title and Read more
  expect(screen.queryByText(/Automated core-banking/)).toBeNull();
  act(() => setScreens(2.9)); // the gap: the card has gone with the bubbles, the chapter stays
  expect(screen.getByRole("heading", { level: 2, name: "Deloitte" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Mambu migration tool" })).toBeNull();
  act(() => setScreens(3.7)); // "…for Ageas"
  expect(screen.getByRole("heading", { level: 2, name: "Deloitte" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Mambu migration tool" })).toBeNull();
  expect(screen.getByRole("heading", { name: "Claim document classification and extraction" })).toBeInTheDocument();
});

test("Deloitte gets its green dot", () => {
  at(1.6);
  const dot = screen.getByRole("heading", { level: 2, name: "Deloitte" }).querySelector("[data-dot]");
  expect(dot).toHaveTextContent(".");
  expect(screen.queryByText("BSc Computer Science")).toBeNull();
});

describe("his story beside him (content/stories.ts)", () => {
  const written = structuredClone(STORIES);
  afterEach(() => Object.assign(STORIES, structuredClone(written)));

  test("arrives as the bubbles written, the next appearing as he walks on", () => {
    STORIES.porto = [[{ say: "Porto was where I learned to ship. Fast." }, { say: "Then faster." }]];
    at(1.55); // just into Porto
    expect(screen.getAllByTestId("bubble").map((b) => b.textContent)).toEqual(["Porto was where I learned to ship. Fast."]);
    act(() => setScreens(3.5));
    expect(screen.getAllByTestId("bubble")).toHaveLength(2);
  });

  test("a project card appears with the line that mentions it", () => {
    STORIES.porto = [[{ say: "Deloitte." }, { say: "I built an automation for Western Union.", show: "mambu-migration" }]];
    at(1.6);
    expect(screen.queryByRole("heading", { name: "Mambu migration tool" })).toBeNull();
    act(() => setScreens(3.0));
    expect(screen.getByText("I built an automation for Western Union.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mambu migration tool" })).toBeInTheDocument();
  });

  test("one line can bring in two project cards", () => {
    STORIES.porto = [[{ say: "Two at once.", show: ["mambu-migration", "azure-ml-integrations"] }]];
    at(2.0);
    expect(screen.getByRole("heading", { name: "Mambu migration tool" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Claim document classification and extraction" })).toBeInTheDocument();
  });

  test("no more than three bubbles at once", () => {
    STORIES.porto = [["One.", "Two.", "Three.", "Four."].map((say) => ({ say }))];
    at(3.6); // all four have come, before the block fades
    expect(screen.getAllByTestId("bubble").map((b) => b.textContent)).toEqual(["Two.", "Three.", "Four."]);
  });

  test("in Braga the bubbles start when the chapter appears, after the intro, not all at once", () => {
    STORIES.braga = [["One.", "Two.", "Three.", "Four."].map((say) => ({ say }))];
    at(0.55); // the BSc chapter has just replaced the intro
    expect(screen.getAllByTestId("bubble")).toHaveLength(1);
  });

  test("a block goes away when it's done, and the next block starts fresh after a gap", () => {
    STORIES.porto = [[{ say: "First block." }], [{ say: "Second block." }]];
    at(2.3);
    expect(screen.getAllByTestId("bubble").map((b) => b.textContent)).toEqual(["First block."]);
    act(() => setScreens(2.85)); // the gap after the first block
    expect(screen.queryByTestId("bubble")).toBeNull();
    act(() => setScreens(3.05));
    expect(screen.getAllByTestId("bubble").map((b) => b.textContent)).toEqual(["Second block."]);
  });

  test("with nothing written, the right side stays clear: no placeholder", () => {
    STORIES.porto = [];
    at(1.6);
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  test("the ending has its own closing lines", () => {
    at(10.9);
    expect(screen.getByText("It's been a crazy journey!")).toBeInTheDocument();
  });
});

describe("the ending", () => {
  test("invites the visitor into the next chapter with ways to get in touch", () => {
    at(11);
    expect(screen.getByRole("heading", { name: "The next chapter starts here." })).toBeInTheDocument();
    expect(screen.getByText("Stockholm · Today")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Email me" })).toHaveAttribute("href", "mailto:eduardoluisvp99@gmail.com");
  });

  test("LinkedIn opens in a new tab without access to this page", () => {
    at(11);
    const link = screen.getByRole("link", { name: "LinkedIn" });
    expect(link).toHaveAttribute("href", "https://www.linkedin.com/in/eduardopereira-/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toMatch(/noopener/);
    expect(link.getAttribute("rel")).toMatch(/noreferrer/);
  });

  test("no CV button until there is a CV to download", () => {
    at(11);
    expect(screen.queryByRole("link", { name: "Download CV" })).toBeNull();
  });
});

test("the BSc chapter has a button that opens the degree like a project", () => {
  at(0.6);
  fireEvent.click(screen.getByRole("button", { name: "About the degree" }));
  expect(window.location.search).toBe("?project=bsc-computer-science");
});

test("Deloitte's chapter has no degree button", () => {
  at(1.6);
  expect(screen.queryByRole("button", { name: "About the degree" })).toBeNull();
});

test("a project box shows its partner's logo beside the title, unless the chapter already wears it", () => {
  at(4.5);
  // walk through Jönköping until the U-Net box shows up
  for (let s = 4.5; s < 7.5 && !screen.queryByRole("heading", { name: /U-Net/ }); s += 0.05) act(() => setScreens(s));
  const title = screen.getByRole("heading", { name: /U-Net/ });
  expect(within(title.parentElement!).getByRole("img", { name: "Jordbruksverket" })).toBeInTheDocument();
  act(() => setScreens(8.0));
  expect(screen.getAllByRole("img", { name: "Effektify" })).toHaveLength(1); // the chapter's, not repeated on the box
});
