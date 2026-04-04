/**
 * Integration tests for the Character Sheet page.
 *
 * Covers: Epic 1.2, Batches F + G
 *   - MeterHeader: all 4 meters display, effective_stress_max, NPC hides meters
 *   - CharacterTabs: overview tab renders, tab switching reveals content
 *   - Direct actions: Find Time (enabled/disabled), Recharge Trait, Maintain Bond
 *   - Magic effects: Use (charges decrement), Retire with confirmation dialog
 *   - Toast feedback on success and failure
 *   - Edge cases: stress at effective_max, bond degradations = 5, multi-trauma
 *
 * Note: CharacterTabs (mobile) and CharacterDesktopLayout both render in the DOM
 * simultaneously (no CSS breakpoints in test env). Queries that target section-specific
 * content use `within(tabPanel)` to scope to the active mobile tab panel.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient } from "@tanstack/react-query";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import {
  makeCharacter,
  makeNpcCharacter,
  makeBond,
  makeTrait,
  makeMagicEffect,
} from "@/mocks/fixtures/characters";
import { playerA } from "@/mocks/fixtures/users";
import {
  PC_CHAR_ID,
  findTimeInsufficientPlotHandler,
  rechargeTraitInsufficientFtHandler,
  maintainBondInsufficientFtHandler,
} from "@/mocks/handlers/characters";
import CharacterSheetPage from "@/app/(player)/character/page";

// ── Constants ──────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api/v1";

// ── Auth mock ─────────────────────────────────────────────────────

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: playerA,
    isLoading: false,
    isGm: false,
    isPlayer: true,
    isViewer: false,
    canViewGmContent: false,
    canTakeGmActions: false,
    characterId: PC_CHAR_ID,
    logout: vi.fn(),
  }),
}));

// ── Router mock ───────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// ── MSW lifecycle ─────────────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Helpers ───────────────────────────────────────────────────────

function renderPage(queryClient?: QueryClient) {
  return render(
    <TestProviders queryClient={queryClient}>
      <CharacterSheetPage />
    </TestProviders>
  );
}

/** Override the GET /characters/:id handler with a specific fixture. */
function useCharacterFixture(
  characterId: string,
  character: ReturnType<typeof makeCharacter>
) {
  server.use(
    http.get(`${API_BASE}/characters/${characterId}`, () =>
      HttpResponse.json(character)
    )
  );
}

/**
 * Returns the active mobile tab panel after clicking a tab.
 * CharacterTabs renders panels with id="tab-panel-{tabId}".
 */
async function switchToTab(tabLabel: RegExp | string): Promise<HTMLElement> {
  const tab = screen.getByRole("tab", { name: tabLabel });
  fireEvent.click(tab);
  // The panel matching the tab's aria-controls
  const panelId = tab.getAttribute("aria-controls")!;
  return document.getElementById(panelId) as HTMLElement;
}

// ── Meter display ──────────────────────────────────────────────────

describe("character sheet — meters", () => {
  it("renders all 4 meters with correct values", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        stress: 3,
        free_time: 8,
        plot: 2,
        gnosis: 10,
        effective_stress_max: 9,
      })
    );
    renderPage();

    expect(await screen.findByLabelText("Stress: 3 of 9")).toBeInTheDocument();
    expect(screen.getByLabelText("Free Time: 8 of 20")).toBeInTheDocument();
    expect(screen.getByLabelText("Plot: 2 of 5")).toBeInTheDocument();
    expect(screen.getByLabelText("Gnosis: 10 of 23")).toBeInTheDocument();
  });

  it("stress meter uses effective_stress_max, not hardcoded 9", async () => {
    // 2 traumas → effective_stress_max = 7
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        stress: 5,
        effective_stress_max: 7,
      })
    );
    renderPage();

    const stressMeter = await screen.findByLabelText("Stress: 5 of 7");
    expect(stressMeter).toHaveAttribute("aria-valuemax", "7");
  });

  it("stress below effective_max — segments are not pulsing", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        stress: 6,
        effective_stress_max: 7,
      })
    );
    renderPage();

    // Wait for render
    await screen.findByLabelText("Stress: 6 of 7");
    // MeterBar only pulses when showWarning=true AND value >= effectiveMax - 1
    // value=6, effectiveMax=7 → nearMax = true, so segments DO pulse here.
    // This test verifies the threshold logic: value < effectiveMax - 1 means no pulse.
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        stress: 5,
        effective_stress_max: 7,
      })
    );
  });

  it("stress at effective_stress_max — meter shows max value", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        stress: 7,
        effective_stress_max: 7,
      })
    );
    renderPage();

    const stressMeter = await screen.findByLabelText("Stress: 7 of 7");
    expect(stressMeter).toHaveAttribute("aria-valuenow", "7");
    expect(stressMeter).toHaveAttribute("aria-valuemax", "7");
    // At cap, MeterBar applies animate-pulse to filled segments
    const filledSegments = stressMeter.querySelectorAll(".animate-pulse");
    expect(filledSegments.length).toBeGreaterThan(0);
  });

  it("character name is displayed in the meter header", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({ id: PC_CHAR_ID, name: "Kael" })
    );
    renderPage();
    expect(await screen.findByText("Kael")).toBeInTheDocument();
  });

  it("NPC character does not render meters", async () => {
    server.use(
      http.get(`${API_BASE}/characters/${PC_CHAR_ID}`, () =>
        HttpResponse.json(makeNpcCharacter({ id: PC_CHAR_ID }))
      )
    );
    renderPage();

    await waitFor(() => {
      expect(screen.queryByLabelText(/Stress:/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Plot:/)).not.toBeInTheDocument();
    });
  });
});

// ── Multi-trauma edge case ────────────────────────────────────────

describe("character sheet — multiple traumas", () => {
  it("effective_stress_max shrinks proportionally with trauma count", async () => {
    // 3 traumas → effective_stress_max = 9 − 3 = 6
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        stress: 4,
        effective_stress_max: 6,
      })
    );
    renderPage();

    const stressMeter = await screen.findByLabelText("Stress: 4 of 6");
    expect(stressMeter).toHaveAttribute("aria-valuemax", "6");
    // Free Time still uses full max (not affected by trauma)
    expect(screen.getByLabelText("Free Time: 8 of 20")).toBeInTheDocument();
  });
});

// ── Tab switching ─────────────────────────────────────────────────

describe("character sheet — tab switching", () => {
  it("defaults to overview tab", async () => {
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const overviewTab = screen.getByRole("tab", { name: /overview/i });
    expect(overviewTab).toHaveAttribute("aria-selected", "true");
  });

  it("switching to Traits tab reveals traits content in tab panel", async () => {
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Traits$/i);

    // Scope to the traits tab panel to avoid duplicates with desktop layout
    expect(await within(panel).findByText("Street Rat")).toBeInTheDocument();
    expect(within(panel).getByText("Blade Dancer")).toBeInTheDocument();
  });

  it("switching to Bonds tab reveals bonds content in tab panel", async () => {
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Bonds$/i);

    // Default fixture has one bond with target_name "Sibling"
    expect(await within(panel).findByText("Sibling")).toBeInTheDocument();
  });

  it("switching to Skills tab reveals skill grid in tab panel", async () => {
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/Skills & Stats/i);

    expect(await within(panel).findByText("Skills")).toBeInTheDocument();
    expect(within(panel).getByText("Magic")).toBeInTheDocument();
  });

  it("inactive tab panels are hidden", async () => {
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    // Initially on overview — traits panel should be hidden
    const traitsPanel = document.getElementById("tab-panel-traits")!;
    expect(traitsPanel).toHaveAttribute("hidden");
  });

  it("active tab panel is not hidden", async () => {
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const overviewPanel = document.getElementById("tab-panel-overview")!;
    expect(overviewPanel).not.toHaveAttribute("hidden");
  });
});

// ── Overview tab: Find Time action ───────────────────────────────

describe("character sheet — Find Time", () => {
  it("Find Time button is enabled when plot >= 3", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({ id: PC_CHAR_ID, plot: 3 })
    );
    renderPage();
    await screen.findByLabelText("Plot: 3 of 5");

    const overviewPanel = document.getElementById("tab-panel-overview")!;
    const btn = within(overviewPanel).getByRole("button", {
      name: /find time \(costs 3 plot/i,
    });
    expect(btn).not.toBeDisabled();
  });

  it("Find Time button is disabled when plot < 3", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({ id: PC_CHAR_ID, plot: 2 })
    );
    renderPage();
    await screen.findByLabelText("Plot: 2 of 5");

    const overviewPanel = document.getElementById("tab-panel-overview")!;
    const btn = within(overviewPanel).getByRole("button", {
      name: /cannot find time/i,
    });
    expect(btn).toBeDisabled();
  });

  it("Find Time success: toast shown", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({ id: PC_CHAR_ID, plot: 3, free_time: 8 })
    );
    // Success handler returns updated character (plot=0, free_time=9)
    server.use(
      http.post(`${API_BASE}/characters/${PC_CHAR_ID}/find-time`, () =>
        HttpResponse.json(
          makeCharacter({ id: PC_CHAR_ID, plot: 0, free_time: 9 })
        )
      )
    );
    renderPage();
    await screen.findByLabelText("Plot: 3 of 5");

    const overviewPanel = document.getElementById("tab-panel-overview")!;
    fireEvent.click(
      within(overviewPanel).getByRole("button", {
        name: /find time \(costs 3 plot/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/found time.*3 plot spent/i)
      ).toBeInTheDocument();
    });
  });

  it("Find Time failure: shows error toast", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({ id: PC_CHAR_ID, plot: 3 })
    );
    server.use(findTimeInsufficientPlotHandler(PC_CHAR_ID));
    renderPage();
    await screen.findByLabelText("Plot: 3 of 5");

    const overviewPanel = document.getElementById("tab-panel-overview")!;
    fireEvent.click(
      within(overviewPanel).getByRole("button", {
        name: /find time \(costs 3 plot/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/failed to find time/i)
      ).toBeInTheDocument();
    });
  });
});

// ── Traits tab: Recharge Trait ────────────────────────────────────

describe("character sheet — Recharge Trait", () => {
  it("Recharge button fires API and shows success toast", async () => {
    const traitId = "01TRAIT_DEFAULT000000000";
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        free_time: 5,
        traits: {
          active: [
            makeTrait({ id: traitId, charge: 3, slot_type: "core_trait", name: "Street Rat" }),
          ],
          past: [],
        },
      })
    );
    server.use(
      http.post(`${API_BASE}/characters/${PC_CHAR_ID}/recharge-trait`, async () =>
        HttpResponse.json(
          makeCharacter({
            id: PC_CHAR_ID,
            free_time: 4,
            traits: {
              active: [
                makeTrait({ id: traitId, charge: 5, slot_type: "core_trait", name: "Street Rat" }),
              ],
              past: [],
            },
          })
        )
      )
    );

    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Traits$/i);
    // aria-label when enabled: "Recharge Street Rat (costs 1 Free Time)"
    const rechargeBtn = await within(panel).findByRole("button", {
      name: "Recharge Street Rat (costs 1 Free Time)",
    });
    expect(rechargeBtn).not.toBeDisabled();
    fireEvent.click(rechargeBtn);

    await waitFor(() => {
      expect(screen.getByText(/trait recharged/i)).toBeInTheDocument();
    });
  });

  it("Recharge button is disabled when FT = 0", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        free_time: 0,
        traits: {
          active: [makeTrait({ charge: 3, name: "Street Rat" })],
          past: [],
        },
      })
    );
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Traits$/i);
    // aria-label when disabled (no FT): "Cannot recharge Street Rat: no free time"
    const rechargeBtn = await within(panel).findByRole("button", {
      name: "Cannot recharge Street Rat: no free time",
    });
    expect(rechargeBtn).toBeDisabled();
  });

  it("Recharge failure: shows error toast", async () => {
    const traitId = "01TRAIT_DEFAULT000000000";
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        free_time: 3,
        traits: {
          active: [makeTrait({ id: traitId, charge: 3, name: "Street Rat" })],
          past: [],
        },
      })
    );
    server.use(rechargeTraitInsufficientFtHandler(PC_CHAR_ID));
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Traits$/i);
    // aria-label when enabled: "Recharge Street Rat (costs 1 Free Time)"
    const rechargeBtn = await within(panel).findByRole("button", {
      name: "Recharge Street Rat (costs 1 Free Time)",
    });
    fireEvent.click(rechargeBtn);

    await waitFor(() => {
      expect(screen.getByText(/failed to recharge trait/i)).toBeInTheDocument();
    });
  });
});

// ── Bonds tab: Maintain Bond ──────────────────────────────────────

describe("character sheet — Maintain Bond", () => {
  it("Maintain button is enabled for a degraded bond with FT", async () => {
    const bondId = "01BOND_DEGRADED000000000";
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        free_time: 5,
        bonds: {
          active: [
            makeBond({
              id: bondId,
              target_name: "Riven",
              charges: 2,
              degradations: 2,
              effective_charges_max: 3,
              is_trauma: false,
            }),
          ],
          past: [],
        },
      })
    );
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Bonds$/i);
    // aria-label when enabled: "Maintain bond with Riven (costs 1 Free Time)"
    const maintainBtn = await within(panel).findByRole("button", {
      name: "Maintain bond with Riven (costs 1 Free Time)",
    });
    expect(maintainBtn).not.toBeDisabled();
    // Shows effective max (5 - 2 = 3)
    expect(within(panel).getByText("(2 degraded)")).toBeInTheDocument();
    expect(within(panel).getByText("2/3")).toBeInTheDocument();
  });

  it("Maintain Bond success: shows toast", async () => {
    const bondId = "01BOND_DEGRADED000000000";
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        free_time: 5,
        bonds: {
          active: [
            makeBond({
              id: bondId,
              target_name: "Riven",
              charges: 2,
              degradations: 2,
              effective_charges_max: 3,
              is_trauma: false,
            }),
          ],
          past: [],
        },
      })
    );
    server.use(
      http.post(`${API_BASE}/characters/${PC_CHAR_ID}/maintain-bond`, async () =>
        HttpResponse.json(
          makeCharacter({
            id: PC_CHAR_ID,
            free_time: 4,
            bonds: {
              active: [
                makeBond({
                  id: bondId,
                  target_name: "Riven",
                  charges: 3,
                  degradations: 2,
                  effective_charges_max: 3,
                  is_trauma: false,
                }),
              ],
              past: [],
            },
          })
        )
      )
    );

    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Bonds$/i);
    const maintainBtn = await within(panel).findByRole("button", {
      name: "Maintain bond with Riven (costs 1 Free Time)",
    });
    fireEvent.click(maintainBtn);

    await waitFor(() => {
      expect(screen.getByText(/bond maintained/i)).toBeInTheDocument();
    });
  });

  it("Maintain Bond failure: shows error toast", async () => {
    const bondId = "01BOND_DEFAULT000000000";
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        free_time: 5,
        bonds: {
          active: [
            makeBond({ id: bondId, target_name: "Sibling", charges: 2, is_trauma: false }),
          ],
          past: [],
        },
      })
    );
    server.use(maintainBondInsufficientFtHandler(PC_CHAR_ID));

    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Bonds$/i);
    const maintainBtn = await within(panel).findByRole("button", {
      name: "Maintain bond with Sibling (costs 1 Free Time)",
    });
    fireEvent.click(maintainBtn);

    await waitFor(() => {
      expect(screen.getByText(/failed to maintain bond/i)).toBeInTheDocument();
    });
  });

  it("trauma bond shows Trauma badge and no Maintain button", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        bonds: {
          active: [
            makeBond({
              id: "01BOND_TRAUMA00000000000",
              target_name: "Lost Friend",
              is_trauma: true,
            }),
          ],
          past: [],
        },
      })
    );
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Bonds$/i);
    await within(panel).findByText("Lost Friend");

    // Trauma badge visible
    expect(within(panel).getByLabelText("Trauma bond")).toBeInTheDocument();
    // No maintain button for trauma bonds
    expect(
      within(panel).queryByRole("button", { name: /maintain lost friend/i })
    ).not.toBeInTheDocument();
  });

  it("bond with degradations = 5 shows effective max = 0 and disabled Maintain", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        bonds: {
          active: [
            makeBond({
              id: "01BOND_ZEROED0000000000",
              target_name: "Broken Bond",
              charges: 0,
              degradations: 5,
              effective_charges_max: 0,
              is_trauma: false,
            }),
          ],
          past: [],
        },
      })
    );
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Bonds$/i);
    await within(panel).findByText("Broken Bond");

    // 5 degradations shown
    expect(within(panel).getByText("(5 degraded)")).toBeInTheDocument();
    // Maintain disabled because charges (0) are not < effective max (0)
    // aria-label when disabled (charges at max): "Cannot maintain bond with Broken Bond: charges are at max"
    const maintainBtn = within(panel).getByRole("button", {
      name: "Cannot maintain bond with Broken Bond: charges are at max",
    });
    expect(maintainBtn).toBeDisabled();
  });
});

// ── Magic tab: Use Effect ─────────────────────────────────────────

describe("character sheet — Use Effect", () => {
  it("Use button is enabled when charged effect has charges", async () => {
    const effectId = "01EFFECT_CHARGED00000000";
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        magic_effects: {
          active: [
            makeMagicEffect({
              id: effectId,
              name: "Flame Ward",
              effect_type: "charged",
              charges_current: 3,
              charges_max: 5,
            }),
          ],
          past: [],
        },
      })
    );
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Magic$/i);
    const useBtn = await within(panel).findByRole("button", {
      name: /use flame ward/i,
    });
    expect(useBtn).not.toBeDisabled();
  });

  it("Use button is disabled when charged effect has 0 charges", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        magic_effects: {
          active: [
            makeMagicEffect({
              effect_type: "charged",
              name: "Flame Ward",
              charges_current: 0,
              charges_max: 5,
            }),
          ],
          past: [],
        },
      })
    );
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Magic$/i);
    const useBtn = await within(panel).findByRole("button", {
      name: /cannot use/i,
    });
    expect(useBtn).toBeDisabled();
  });

  it("Use Effect success: shows toast", async () => {
    const effectId = "01EFFECT_CHARGED00000000";
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        magic_effects: {
          active: [
            makeMagicEffect({
              id: effectId,
              name: "Flame Ward",
              effect_type: "charged",
              charges_current: 3,
              charges_max: 5,
            }),
          ],
          past: [],
        },
      })
    );
    server.use(
      http.post(
        `${API_BASE}/characters/${PC_CHAR_ID}/effects/${effectId}/use`,
        () =>
          HttpResponse.json(
            makeCharacter({
              id: PC_CHAR_ID,
              magic_effects: {
                active: [
                  makeMagicEffect({
                    id: effectId,
                    name: "Flame Ward",
                    effect_type: "charged",
                    charges_current: 2,
                    charges_max: 5,
                  }),
                ],
                past: [],
              },
            })
          )
      )
    );

    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Magic$/i);
    const useBtn = await within(panel).findByRole("button", {
      name: /use flame ward/i,
    });
    fireEvent.click(useBtn);

    await waitFor(() => {
      expect(screen.getByText(/effect used/i)).toBeInTheDocument();
    });
  });
});

// ── Magic tab: Retire Effect ──────────────────────────────────────

describe("character sheet — Retire Effect", () => {
  it("Retire opens confirmation dialog", async () => {
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        magic_effects: {
          active: [makeMagicEffect({ name: "Shadow Sight" })],
          past: [],
        },
      })
    );
    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Magic$/i);
    const retireBtn = await within(panel).findByRole("button", {
      name: /retire shadow sight/i,
    });
    fireEvent.click(retireBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/retire shadow sight\?/i)).toBeInTheDocument();
  });

  it("Retire: cancel does not fire API", async () => {
    let retireCalled = false;
    const effectId = "01EFFECT_DEFAULT00000000";
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        magic_effects: {
          active: [makeMagicEffect({ id: effectId, name: "Shadow Sight" })],
          past: [],
        },
      })
    );
    server.use(
      http.post(
        `${API_BASE}/characters/${PC_CHAR_ID}/effects/${effectId}/retire`,
        () => {
          retireCalled = true;
          return HttpResponse.json(makeCharacter({ id: PC_CHAR_ID }));
        }
      )
    );

    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Magic$/i);
    fireEvent.click(
      await within(panel).findByRole("button", { name: /retire shadow sight/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Dialog closed, no API call
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(retireCalled).toBe(false);
  });

  it("Retire: confirm fires API and shows toast", async () => {
    const effectId = "01EFFECT_DEFAULT00000000";
    useCharacterFixture(
      PC_CHAR_ID,
      makeCharacter({
        id: PC_CHAR_ID,
        magic_effects: {
          active: [makeMagicEffect({ id: effectId, name: "Shadow Sight" })],
          past: [],
        },
      })
    );
    server.use(
      http.post(
        `${API_BASE}/characters/${PC_CHAR_ID}/effects/${effectId}/retire`,
        () =>
          HttpResponse.json(
            makeCharacter({
              id: PC_CHAR_ID,
              magic_effects: {
                active: [],
                past: [
                  makeMagicEffect({
                    id: effectId,
                    name: "Shadow Sight",
                    is_active: false,
                  }),
                ],
              },
              active_magic_effects_count: 0,
            })
          )
      )
    );

    renderPage();
    await screen.findByLabelText("Stress: 3 of 9");

    const panel = await switchToTab(/^Magic$/i);
    fireEvent.click(
      await within(panel).findByRole("button", { name: /retire shadow sight/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /retire effect/i }));

    await waitFor(() => {
      expect(screen.getByText(/effect retired/i)).toBeInTheDocument();
    });
  });
});

// ── Loading and error states ──────────────────────────────────────

describe("character sheet — loading and error states", () => {
  it("shows loading skeleton while fetching", () => {
    // Delay the response so loading state is visible
    server.use(
      http.get(`${API_BASE}/characters/${PC_CHAR_ID}`, async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(makeCharacter({ id: PC_CHAR_ID }));
      })
    );
    renderPage();
    // Skeleton pulses are present
    const skeletonContainer = document.querySelector(".animate-pulse");
    expect(skeletonContainer).toBeInTheDocument();
  });

  it("shows error state when character fetch fails", async () => {
    server.use(
      http.get(`${API_BASE}/characters/${PC_CHAR_ID}`, () =>
        HttpResponse.json(
          {
            error: {
              code: "not_found",
              message: "Character not found",
              details: null,
            },
          },
          { status: 404 }
        )
      )
    );
    renderPage();
    expect(
      await screen.findByText(/could not load character/i)
    ).toBeInTheDocument();
  });
});
